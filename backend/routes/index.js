import express from 'express';
import csrf from 'csurf';
import passport from 'passport';
import User from '../models/User';
import config from 'config';
import validator from 'validator';
import uuid from 'uuid';

import {send_confirm_email} from '../lib/email';

const message = config.get('Message');
const url = config.get('URL');
const page_custom = config.get('PageCustom');
const router = express.Router();
// 设置csrf 保护
const csrfProtection = csrf({ cookie: true })
/* GET users login page. */
router.use(csrfProtection);



const auth_process=(req,res,next) =>{
  if (! req.user) {
    req.flash('message',message['Re_Authentication_Message'])
    return res.redirect(url['User_Login_URL']);
  }
  if (req.user&&(typeof req.user.status==='undefined'||req.user.status==='NotActived')) {
    req.flash('message',message['NotActived'])
    return res.redirect(url['User_NotActive_URL']);
  }
  return next();
};


/* GET home page. */
router.get('/', (req, res) => {
  res.render('index',{
     title: page_custom["Home-Page-Title"],
     user:req.user,
     url:url
  });
});
/* GET about page. */
router.get('/about', (req, res) => {
  res.render('about', {
    title: page_custom["About-Me-Title"],
    user:req.user,
    url:url
  });
});




router.get(url['User_Login_URL'], (req,res) => {
  if(req.user){
    res.redirect(url['User_Profile_URL'])
    return
  }
  res.render('users/login',{
    csrfToken: req.csrfToken(),
    user: req.user,
    message:req.flash('error')[0],
    url:url
  });
});

router.post(url['User_Login_URL'],
          passport.authenticate('local',{
              successRedirect: url['User_Profile_URL'],
              successFlash:message['Login-Success'],
              failureRedirect: url['User_Login_URL'],
              failureFlash:  message['Login-Failure'],
          })
);
router.get(url['User_Logout_URL'], function(req, res) {
    req.logout();
    res.redirect(url['Home_Page_URL']);
});

router.get(url['User_Profile_URL'],auth_process,(req,res) =>{
  res.render('users/profile',{user:req.user,url:url});
});

/* GET users regist page. */
router.get(url['User_Register_URL'], (req,res) => {
  res.render('users/register',{
    csrfToken: req.csrfToken(),
    user: req.user,
    message :req.flash('message')[0],
    url:url
  });
});
router.post(url['User_Register_URL'], function(req, res) {
    // 服务器端验证
    let username=req.body.username;
    let password=req.body.password;
    let confirm_password=req.body.confirm_password;
    if(typeof confirm_password === 'undefined'||confirm_password!==password){
      req.flash('message',message['Invalid_PASSWORD_INPUT']);
      return res.redirect(url['User_Register_URL']);
    }
    if(validator.isEmail(username)===false){
      req.flash('message',message['Invalid_Email']);
      return res.redirect(url['User_Register_URL']);
    };
    if(validator.isLength(password,{min:6,max:12})===false){
      req.flash('message',message['Invalid_Password_Length']);
      return res.redirect(url['User_Register_URL']);
    }
    //
    User.register(new User({ username : req.body.username }), req.body.password, (err, user) => {
        if (err) {
            let error_message=message["Unknown_Error_Message"];
            if(err.name === 'UserExistsError'){
              error_message=message["User_Exists_Message"];
            }
            req.flash('message',error_message);
            return res.redirect(url['User_Register_URL']);
        }
        passport.authenticate('local')(req, res, (err) => {
            if(err){
              res.redirect(url['User_Register_URL']);
            }else{
              let confirm_code=uuid.v4();
              console.log(req.user)
              User.findOneAndUpdate({_id:req.user['_id']},{confirm_code:confirm_code},
              {upsert:false},
              (err)=>{
                if(err){
                  console.log(err);
                  req.flash('message',message['Unknown_Error_Message']);
                  res.redirect(url['User_Register_URL']);
                }else{
                  send_confirm_email(req.user['username'],confirm_code,(err)=>{
                    console.log(err);
                    if(err){
                        req.flash('message',message['Email_Send_Fail']);
                        res.redirect(url['User_Register_URL']);
                    }else{
                      if(req.user&&req.user.status==='NotActived'){
                        res.redirect(url['User_NotActive_URL']);
                      }
                    }
                  });
                }
              })
            }
        });
    });
});

router.get(url['User_NotActive_URL'],(req,res) =>{
  res.render('users/notactive',{
    user:req.user,
    message:message['NotActived'],
    url:url
  });
});




/* GET users change_password page. */
router.get('/change_password', (req,res) => {
  res.render('users/change_password_from_page',{
    csrfToken: req.csrfToken(),
    url:url
  });
});

/* GET users change_password_from_email page. */
router.get('/change_password_from_email', (req,res) => {
  res.render('users/change_password_from_email',{
    csrfToken: req.csrfToken(),
    url:url
  });
});

module.exports = router;
