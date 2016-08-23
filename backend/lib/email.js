import nodemailer from 'nodemailer';
import config from 'config';

const email=config.get('Email');
const url=config.get('URL');

const email_string='smtp://'+email['username']+':'+email['password']+'@'+email['smtp_server'];
const transporter=nodemailer.createTransport(email_string);
const confirm_Options = {
    from: '"UVS-Support" <'+email['username']+'>', // sender address
    subject:email['confirm_subject'],// Subject line
    text: email['confirm_title'], // plaintext body
    html: '<h4><a>%s</a></h4>' // html body
};
const send_confirm_email = (user,uuid,cb) =>{
  confirm_Options['to']=user;
  confirm_Options['html']='<h3>'+email['confirm_title']+'</h3><h4><a>'+url['Base_URL']+url['User_Active_URL']+'?user='+user+'&uuid='+uuid+'</a></h4>'
  console.log(confirm_Options);
  transporter.sendMail(confirm_Options, function(error, info){
    if(error){
        return cb(error);
    }
    cb(null,'Message sent: ' + info.response);
  });
}
export {send_confirm_email};
