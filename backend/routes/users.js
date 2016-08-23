import express from 'express';
import csrf from 'csurf';
import passport from 'passport';
import User from '../models/User';
import config from 'config';
import validator from 'validator';

const message = config.get('Message');
const url = config.get('URL');

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
  return next();
};

router.get('/login', (req,res) => {
  if(req.user){
    res.redirect(url['User_Profile_URL'])
    return
  }
  res.render('users/login',{ csrfToken: req.csrfToken(),user: req.user, message:req.flash('error')[0]});
});

router.post('/login',
          passport.authenticate('local',{
              successRedirect: url['User_Profile_URL'],
              successFlash:message['Login-Success'],
              failureRedirect: url['User_Login_URL'],
              failureFlash:  message['Login-Failure'],
          })
);
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect(url['Home_Page_URL']);
});

router.get('/profile',auth_process,(req,res) =>{
  res.render('users/profile',{user:req.user});
});

/* GET users regist page. */
router.get('/register', (req,res) => {
  res.render('users/register',{ csrfToken: req.csrfToken(), message : req.flash('message')[0]});
});
router.post('/register', function(req, res) {
    // 服务器端验证
    let username=req.body.username;
    let password=req.body.password;
    let confirm_password=req.body.confirm_password;
    if(typeof confirm_password === 'undefined'||confirm_password!==password){
      req.flash('message',message['Invalid_PASSWORD_INPUT']);
      return res.redirect(url['User_Register_URL']);
    }
    console.log(username,password,confirm_password)
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
            console.log(error_message)
            req.flash('message',error_message);
            return res.redirect(url['User_Register_URL']);
        }
        passport.authenticate('local')(req, res, (err) => {
            if(err){
              res.redirect(url['User_Register_URL']);
            }else{
              res.redirect('/');
            }
        });
    });
});



/* GET users change_password page. */
router.get('/change_password', (req,res) => {
  res.render('users/change_password_from_page',{ csrfToken: req.csrfToken() });
});

/* GET users change_password_from_email page. */
router.get('/change_password_from_email', (req,res) => {
  res.render('users/change_password_from_email',{ csrfToken: req.csrfToken() });
});

module.exports = router;
