import nodemailer from 'nodemailer';
import config from 'config';

const email=config.get('Email');
const url=config.get('URL');

const email_string='smtp://'+email['username']+':'+email['password']+'@'+email['smtp_server'];
const transporter=nodemailer.createTransport(email_string);

const send_confirm_email = (user,uuid,cb) =>{
  let confirm_Options = {
      from: '"UVS-Support" <'+email['username']+'>',
  };
  confirm_Options['to']=user;
  confirm_Options['html']='<h3>'+email['confirm_title']+'</h3><h4><a>'+url['Base_URL']+url['User_Active_URL']+'?user='+user+'&uuid='+uuid+'</a></h4>'
  confirm_Options['subject']=email['confirm_subject'];
  confirm_Options['text']=email['confirm_title'];

  console.log(confirm_Options);

  transporter.sendMail(confirm_Options, (error, info) => {
    if(error){
        console.log(error)
        return cb(error);
    }
    cb(null,'Message sent: ' + info.response);
  });
}

const send_reset_password_email = (user,uuid,cb) =>{
  let confirm_Options = {
      from: '"UVS-Support" <'+email['username']+'>',
  };
  confirm_Options['to']=user;
  confirm_Options['html']='<h3>'+email['reset_password_title']+'</h3><h4><a>'+url['Base_URL']+url['User_ResetPassword_Email_URL']+'?user='+user+'&uuid='+uuid+'</a></h4>'
  confirm_Options['subject']=email['reset_password_subject'];
  confirm_Options['text']=email['reset_password_title'];
  transporter.sendMail(confirm_Options, (error, info) => {
    if(error){
        return cb(error);
    }
    cb(null,'Message sent: ' + info.response);
  });
}

export {send_confirm_email,send_reset_password_email};
