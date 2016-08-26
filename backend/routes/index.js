import express from 'express';
import csrf from 'csurf';
import passport from 'passport';
import User from '../models/User';
import ChangePasswordSession from '../models/ChangePasswordSession';
import config from 'config';
import validator from 'validator';
import uuid from 'uuid';

import {send_confirm_email_asyn,send_reset_password_email_asyn} from '../lib/email';
const message = config.get('Message');
const url = config.get('URL');
const questions = config.get('Questions');
const page_custom = config.get('PageCustom');
const router = express.Router();
// setting csrf protection
const csrfProtection = csrf({ cookie: true })

// router.use(csrfProtection);



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
     title: page_custom['Home-Page-Title'],
     user:req.user,
     url:url
  });
});
/* GET about page. */
router.get('/about', (req, res) => {
  res.render('about', {
    title: page_custom['About-Me-Title'],
    user:req.user,
    url:url
  });
});




router.get(url['User_Login_URL'], csrfProtection ,(req,res) => {
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
router.get(url['User_Register_URL'],  csrfProtection ,(req,res) => {

  res.render('users/register',{
    csrfToken: req.csrfToken(),
    user: req.user,
    message :req.flash('message')[0],
    questions:questions,
    url:url
  });
});
router.post(url['User_Register_URL'],  csrfProtection ,function(req, res) {
    // 服务器端验证
    let username=req.body.username;
    let password=req.body.password;
    let confirm_password=req.body.confirm_password;
    let selected_question=req.body.selected_question;
    let answer_question=req.body.answer_question;
    if( typeof username === 'undefined'||
        typeof password === 'undefined'||
        typeof confirm_password === 'undefined'||
        typeof selected_question === 'undefined'||
        typeof answer_question === 'undefined'){
          req.flash('message',{message:message['Empty_Input'],error:true});
          return res.redirect(url['User_Register_URL']);
    }

    if(confirm_password!==password){
      req.flash('message',{message:message['Invalid_PASSWORD_INPUT'],error:true});
      return res.redirect(url['User_Register_URL']);
    }
    username=username.trim();
    password=password.trim();
    confirm_password=confirm_password.trim();
    answer_question=answer_question.trim();

    if(validator.isEmail(username)===false){
      req.flash('message',{message:message['Invalid_Email'],error:true});
      return res.redirect(url['User_Register_URL']);
    }
    if(validator.isLength(password,{min:6,max:12})===false){
      req.flash('message',{message:message['Invalid_Password_Length'],error:true});
      return res.redirect(url['User_Register_URL']);
    }

    if(validator.isLength(answer_question,{min:1,max:120})===false){
      req.flash('message',{message:message['Invalid_Question_Answer_Length'],error:true});
      return res.redirect(url['User_Register_URL']);
    }

    User.register(new User({ username : req.body.username }),password, (err) => {
        if (err) {
            let error_message=message['Unknown_Error_Message'];
            if(err.name === 'UserExistsError'){
              error_message=message['User_Exists_Message'];
            }
            req.flash('message',{message:error_message,error:true});
            return res.redirect(url['User_Register_URL']);
        }
        passport.authenticate('local')(req, res, (err) => {
            if(err){
              res.redirect(url['User_Register_URL']);
            }else{
              let confirm_code=uuid.v4();
              User.findOneAndUpdate(
                {_id:req.user['_id']},
                {confirm_code:confirm_code,selected_question:selected_question,answer_question:answer_question},
                {upsert:false})
                .exec()
                .then(()=>{
                  return send_confirm_email_asyn(req.user['username'],confirm_code)
                }).then(()=>{
                    res.redirect(url['User_NotActive_URL']);
                })
                .catch(()=>{
                  req.flash('message',message['Unknown_Error_Message']);
                  res.redirect(url['User_Register_URL']);
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
      {'status':'NotActived','confirm_code':uuid,'username':username},
      {$set:{'status':'Actived'}},
      {'upsert':false,'new':true}
    ).exec()
     .then(()=>{
       res.render('users/actived',{
         user:req.user,
         message:{message:message['Confirm_Email_Success'],error:false},
         url:url
       });
     })
     .catch(()=>{
       res.render('users/notactived',{
         user:req.user,
         message:{message:message['Confirm_Email_Fail'],error:true},
         url:url
       });
     })
  }else{
    res.render('users/notactived',{
      user:req.user,
      message:{message:message['Confirm_Email_Fail'],error:true},
      url:url
    });
  }
});




/* GET users change_password page. */
router.get(url['User_ChangePassword_URL'],  csrfProtection , auth_process,(req,res) => {
  res.render('users/change_password',{
    csrfToken: req.csrfToken(),
    url:url,
    user:req.user,
    message:req.flash('message')[0]
  });
});


/* POST users change_password page. */
router.post(url['User_ChangePassword_URL'],  csrfProtection ,auth_process,(req,res) => {
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

  req.user.authenticate(password,(err,user) =>{
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
router.get(url['User_ForgetPassword_URL'],  csrfProtection ,(req,res) => {
  res.render('users/forget_password',{
    csrfToken: req.csrfToken(),
    url:url,
    user:req.user,
    message:req.flash('message')[0],
    questions:questions
  });
});

router.post(url['User_ForgetPassword_URL'], csrfProtection ,(req,res) =>{
  let username=req.body.username;
  let selected_question=req.body.selected_question;
  let answer_question=req.body.answer_question;


  if(typeof username==='undefined'||
    typeof username==='undefined'||
    typeof answer_question==='undefined'
  ){
    req.flash('message',{message:message['Empty_Input'],error:true});
    return res.redirect(url['User_ForgetPassword_URL']);
  }
  username=username.trim()
  answer_question=answer_question.trim();


  if(validator.isEmail(username)===false){
    req.flash('message',{message:message['Invalid_Email'],error:true});
    return res.redirect(url['User_ForgetPassword_URL']);
  }

  User.findOne({'username':username})
  .exec()
  .then((user) => {
     if(!user){
       throw new Error(message['Not_Exist_User']);
     }
     if(user.selected_question!==parseInt(selected_question)||
        user.answer_question!==answer_question){
          throw new Error(message['Invalid_Answer_Input']);
      }
      let session_uuid=uuid.v4();
      let cps= new ChangePasswordSession({'username':user.username,'session':session_uuid});
      return cps.save()
  })
  .then((user) => {
      return send_reset_password_email_asyn(user.username,user.session)
  })
  .then(()=>{
      req.flash('message',{message:message['Send_ChangePassord_Mail_Success'],error:false});
      res.redirect(url['User_ForgetPassword_URL']);
  })
  .catch((err)=>{
        if(err.message===message['Invalid_Answer_Input']){
          req.flash('message',{message:message['Invalid_Answer_Input'],error:true});
        }else if(err.message===message['Not_Exist_User']){
           req.flash('message',{message:message['Not_Exist_User'],error:true});
        }else{
          req.flash('message',{message:message['Unknown_Error_Message'],error:true});
        }
        return res.redirect(url['User_ForgetPassword_URL']);
  })
});

router.get(url['User_ResetPassword_Email_URL'], csrfProtection ,(req,res) => {
  let session_uuid=req.query.uuid;
  let username=req.query.user;
  if(session_uuid&&username){
    ChangePasswordSession.findOne(
      {'session':session_uuid,'username':username},(err,doc) => {
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

router.post(url['User_ResetPassword_Email_URL'], csrfProtection ,(req,res) => {
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
  if(typeof session_uuid==='undefined'|| typeof username==='undefined'){
    req.flash('message',{message:message['Invalid_URL_Param'],error:true});
    return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
  }
  ChangePasswordSession.findOne({'session':session_uuid,'username':username})
      .exec()
      .then((doc) => {
          if(doc) {
            return User.findOne({'username':username}).exec();
          }else{
            throw(new Error(message['SessionNotExistOrTimeout']));
          }
      })
      .then((user)=>{
        if(user){
          user.setPassword(password1,(err,user) =>{
            if(err){
              throw(new Error(message['Unknown_Error_Message']))
              // req.flash('message',{message:message['Unknown_Error_Message'],error:true});
              // return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
            }else{
              user.save((err)=>{
                if(err){
                  throw(new Error(message['Unknown_Error_Message']))
                  // req.flash('message',{message:message['Unknown_Error_Message'],error:true});
                  // return res.redirect(url['User_ResetPassword_Email_URL']+'?user='+username+'&uuid='+session_uuid);
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
            throw(new Error(message['User_Not_Exist']));
        }
      })
      .catch((err)=>{
        let send_message={message:null,error:true};
        switch (err.message) {
          case message['SessionNotExistOrTimeout']:
            send_message.message=message['SessionNotExistOrTimeout'];
            break;
          case message['User_Not_Exist']:
            send_message.message=message['User_Not_Exist'];
            break;
          default:
            send_message.message=message['Unknown_Error_Message'];
        }
        res.render('users/no_email_session',{
          user:req.user,
          message:{message:send_message,error:true},
          url:url
        });
      })
    });


module.exports = router;
