import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose' ;
const Schema = mongoose.Schema;

const User = new Schema({
    username: String,
    password: String,
    role:{type:String,default:'user'},
    status:{type:String,default:'NotActived'},
    confirm_code:{type:String,default:''},
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
