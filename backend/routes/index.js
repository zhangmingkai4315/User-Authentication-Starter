import express from 'express';
import csrf from 'csurf';
import passport from 'passport';
import User from '../models/User';
import ChangePasswordSession from '../models/ChangePasswordSession';
import config from 'config';
import validator from 'validator';
import uuid from 'uuid';

import {send_confirm_email,send_reset_password_email} from '../lib/email';

const message = config.get('Message');
const url = config.get('URL');
const page_custom = config.get('PageCustom');
const router = express.Router();
// setting csrf protection
const csrfProtection = csrf({ cookie: true })
/* GET users login page. */
router.use(csrfProtection);



const auth_process=(req,res,next) =>{
  if (! req.user) {
    req.flash('message',message['Re_Authentication_Message'])
    return res.redirect(url['User_Login_URL']);
  }
  if (req.user&&(typeof req.user.status==='undefined'||req.user.status==='NotActived')) {
    req.flash('message',{message:message['NotActived'],error:true})
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
              failureRedirect: url['User_Login_URL'],
              failureFlash:message['Login-Failure']})
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
      req.flash('message',{message:message['Invalid_PASSWORD_INPUT'],error:true});
      return res.redirect(url['User_Register_URL']);
    }
    if(validator.isEmail(username)===false){
      req.flash('message',{message:message['Invalid_Email'],error:true});
      return res.redirect(url['User_Register_URL']);
    };
    if(validator.isLength(password,{min:6,max:12})===false){
      req.flash('message',{message:message['Invalid_Password_Length'],error:true});
      return res.redirect(url['User_Register_URL']);
    }
    //
    User.register(new User({ username : req.body.username }),password, (err, user) => {
        if (err) {
            let error_message=message["Unknown_Error_Message"];
            if(err.name === 'UserExistsError'){
              error_message=message["User_Exists_Message"];
            }
            req.flash('message',{message:error_message,error:true});
            return res.redirect(url['User_Register_URL']);
        }
        passport.authenticate('local')(req, res, (err) => {
            if(err){
              res.redirect(url['User_Register_URL']);
            }else{
              let confirm_code=uuid.v4();
              User.findOneAndUpdate({_id:req.user['_id']},{confirm_code:confirm_code},
              {upsert:false},
              (err)=>{
                if(err){
                  req.flash('message',message['Unknown_Error_Message']);
                  res.redirect(url['User_Register_URL']);
                }else{
                  send_confirm_email(req.user['username'],confirm_code,(err)=>{
                    if(err){
                        req.flash('message',{message:message['Email_Send_Fail'],error:true});
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
  res.render('users/notactived',{
    user:req.user,
    message:{message:message['NotActived'],error:true},
    url:url
  });
});

router.get(url['User_Active_URL'],(req,res) => {
  let uuid=req.query.uuid;
  let username=req.query.user;
  if(uuid&&username){
    User.findOneAndUpdate(
      {"status":"NotActived","confirm_code":uuid,"username":username},
      {$set:{"status":"Actived"}},
      {"upsert":false,"new":true},(err,user) => {
        if(err) {
          res.render('users/notactived',{
            user:req.user,
            message:{message:message['Confirm_Email_Fail'],error:true},
            url:url
          });
        }else{
          res.render('users/actived',{
            user:req.user,
            message:{message:message['Confirm_Email_Success'],error:false},
            url:url
          });
        }
      })
  }
});




/* GET users change_password page. */
router.get(url['User_ChangePassword_URL'], auth_process,(req,res) => {
  res.render('users/change_password',{
    csrfToken: req.csrfToken(),
    url:url,
    user:req.user,
    message:req.flash('message')[0]
  });
});


/* POST users change_password page. */
router.post(url['User_ChangePassword_URL'], auth_process,(req,res) => {
  let password=req.body.password;
  let new_password=req.body.new_password;
  let new_password_confirm=req.body.new_password_confirm;
  if(typeof password === 'undefined'||
     typeof new_password === 'undefined'||
     typeof new_password_confirm === 'undefined'){
    req.flash('message',{message:message['Empty_Input'],error:true});
    return res.redirect(url['User_ChangePassword_URL']);
  }
  if(new_password!==new_password_confirm){
    req.flash('message',{message:message['Invalid_PASSWORD_INPUT'],error:true});
    return res.redirect(url['User_ChangePassword_URL']);
  }
  if(validator.isLength(new_password,{min:6,max:12})===false){
    req.flash('message',{message:message['Invalid_Password_Length'],error:true});
    return res.redirect(url['User_ChangePassword_URL']);
  }

  User.authenticate()(req.user.username,password,(err,user) =>{
    if(err){
      req.flash('message',{message:message['Invalid_Old_Password'],error:true});
      return res.redirect(url['User_ChangePassword_URL']);
    }else{
      user.setPassword(new_password,(err,user) =>{
        if(err){
          req.flash('message',{message:message['Unknown_Error_Message'],error:true});
          return res.redirect(url['User_ChangePassword_URL']);
        }else{
          user.save((err)=>{
            if(err){
              req.flash('message',{message:message['Unknown_Error_Message'],error:true});
              return res.redirect(url['User_ChangePassword_URL']);
            }else{
              res.render('users/success_change_info',{
                user:req.user,
                message:{message:message['Success_Change_Password'],error:false},
                url:url
              });
            }
          })

        }
      })
    }
  })




});
/* GET users change_password_from_email page. */
router.get(url['User_ForgetPassword_URL'], (req,res) => {
  res.render('users/forget_password',{
    csrfToken: req.csrfToken(),
    url:url,
    user:req.user,
    message:req.flash('message')[0]
  });
});

router.post(url['User_ForgetPassword_URL'],(req,res) =>{
  let username=req.body.username;
  if(validator.isEmail(username)===false){
    req.flash('message',{message:message['Invalid_Email'],error:true});
    return res.redirect(url['User_ForgetPassword_URL']);
  };

  User.findOne({'username':username},(err,user) => {
    if(user){
      // send the mail to user, but need save the staus to database.
      let session_uuid=uuid.v4();
      let cps= new ChangePasswordSession({'username':user.username,'session':session_uuid});
      cps.save((err,doc)　=> {
        if(err){
          req.flash('message',{message:message['Unknown_Error_Message'],error:true});
          return res.redirect(url['User_ForgetPassword_URL']);
        }else{

          send_reset_password_email(user.username,session_uuid,(err,info)=>{
            if(err){
              req.flash('message',{message:message['Unknown_Error_Message'],error:true});
              return res.redirect(url['User_ForgetPassword_URL']);
            }else{
              req.flash('message',{message:message['Send_ChangePassord_Mail_Success'],error:false});
              return res.redirect(url['User_ForgetPassword_URL']);
            }
          })
        }
      });
    }else{
      req.flash('message',{message:message['Not_Exist_User'],error:true});
      return res.redirect(url['User_ForgetPassword_URL']);
    }
  });
});

router.get(url['User_ResetPassword_Email_URL'],(req,res) => {
  let session_uuid=req.query.uuid;
  let username=req.query.user;
  if(session_uuid&&username){
    ChangePasswordSession.findOne(
      {"session":session_uuid,"username":username},(err,doc) => {
        if(doc) {
          res.render('users/change_password_from_email',{
            user:req.user,
            csrfToken: req.csrfToken(),
            message:req.flash('message')[0],
            hidden_uuid:session_uuid,
            url:url
          });
        }else{
          res.render('users/no_email_session',{
            user:req.user,
            message:{message:message['SessionNotExistOrTimeout'],error:true},
            url:url
          });
        }
      })
  }else{
    res.render('users/no_email_session',{
      user:req.user,
      message:{message:message['SessionNotExistOrTimeout'],error:true},
      url:url
    });
  }
});

router.post(url['User_ResetPassword_Email_URL'],(req,res) => {
  let session_uuid=req.query.uuid;
  let username=req.query.user;
  let password1 = req.body.password1;
  let password2 = req.body.password2;

  if(typeof password1 === 'undefined'||password1!==password2){
    req.flash('message',{message:message['Invalid_PASSWORD_INPUT'],error:true});
    return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
  }
  if(validator.isLength(password1,{min:6,max:12})===false){
    req.flash('message',{message:message['Invalid_Password_Length'],error:true});
    return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
  }
  if(session_uuid&&username){
      ChangePasswordSession.findOne(
        {"session":session_uuid,"username":username},(err,doc) => {
          if(doc) {
            // 查看
            User.findOne({'username':username},(err,user) =>{
              if(user){
                user.setPassword(password1,(err,user) =>{
                  if(err){
                    req.flash('message',{message:message['Unknown_Error_Message'],error:true});
                    return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
                  }else{
                    user.save((err)=>{
                      if(err){
                        req.flash('message',{message:message['Unknown_Error_Message'],error:true});
                        return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
                      }else{
                        res.render('users/success_change_info',{
                          user:req.user,
                          message:{message:message['Success_Change_Password'],error:false},
                          url:url
                        });
                      }
                    })

                  }
                })
              }else{
                req.flash('message',{message:message['Unknown_Error_Message'],error:true});
                return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
              }
            })
            　
          }else{
            res.render('users/no_email_session',{
              user:req.user,
              message:{message:message['SessionNotExistOrTimeout'],error:true},
              url:url
            });
          }
        })
    }else{
      res.render('users/no_email_session',{
        user:req.user,
        message:{message:message['SessionNotExistOrTimeout'],error:true},
        url:url
      });
    }
});


module.exports = router;
