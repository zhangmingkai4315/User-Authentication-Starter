import mongoose from 'mongoose';
import config from 'config';

const Schema = mongoose.Schema;
const secure = config.get('Secure');
const ChangePasswordSession = new Schema({
    username: {type:String,required: true},
    session:  {type:String,required: true},
    createdAt: { type: Date, default:Date.now(),expires: secure['Email_Session_Expire'] }   //　delete in 60*30 sec;
});

module.exports = mongoose.model('ChangePasswordSession', ChangePasswordSession);
