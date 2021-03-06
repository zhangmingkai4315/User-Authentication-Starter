import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose' ;
const Schema = mongoose.Schema;


const User = new Schema({
    username: {type:String,required: true,unique:true},
    role:{type:String,default:'user'},

    status:{type:String,default:'NotActived'},
    confirm_code:{type:String,default:''},

    selected_question:{type:Number},
    answer_question:{type:String},
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
