// 测试用户的登录情况 Test the user authentication behavior
import should from 'should';     // eslint-disable-line
import { expect} from 'chai';   // eslint-disable-line
import supertest from 'supertest';
import async from 'async';
import config from 'config';
const url = config.get('URL');
const message = config.get('Message');
const request = supertest(url['Base_URL']);

import mongoose  from 'mongoose';
import {User,ChangePasswordSession} from '../models';
const model_list=[User,ChangePasswordSession];
const database = config.get('Database.mongoDB');
const db_connect_string='mongodb://'+database.host+':'+database.port+'/'+database.database;
// ensure the NODE_ENV is set to 'test'
// this is helpful when you would like to change behavior when testing

process.env.NODE_ENV = 'test';

function ClearDataForTest(cb){
  // delete all models data
  async.each(model_list,(model,callback)=>{
    model.remove(()=>{
      callback();
    })
  },()=>{
    cb();
  })
}


describe('User Authentication Test', () => {
  before((done) => {
    console.log('\n>>>>Clean The Database For Test\n');
    if (mongoose.connection.readyState === 0) {
       mongoose.connect(db_connect_string, (err) => {
         if (err) {
           throw err;
         }
         return ClearDataForTest(done);
       });
     } else {
       return ClearDataForTest(done);
     }
  });

  after((done) => {
    console.log('\n<<<<Test Done. Try To Disconnect The Database\n');
    // in case error:OverwriteModelError: https://github.com/Automattic/mongoose/issues/1251
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.disconnect();
    return done();
  });

  describe('User Regist Process', () => {

    it(url['User_Register_URL']+' with invalid csrf token will forbidden 403', (done) =>{
      var post = {
        username: '353873605@qq.com',
        password: 'test_pass',
        confirm_password:'test_pass_pass',
        selected_question:0,
        answer_question:'One Answer'
      };
      request.post(url['User_Register_URL'])
         .set('Accept-Type','text/html')
         .send(post)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(403)
         .end(done)
     });

   it(url['User_Register_URL']+' with invalid information will redirect back 302', (done) =>{
     request.get(url['User_Register_URL'])
        .expect(200)
        .end((err,res)=>{
            let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
            let cookies=res.header['set-cookie'];
            request.post(url['User_Register_URL'])
                   .set('Accept-Type','text/html')
                   .set('Cookie',cookies.join(';'))
                   .redirects(1)
                   .send({
                     username: '353873605@qq.com',
                     password: 'test_pass',
                     confirm_password:'test_pass_pass',
                     selected_question:0,
                     answer_question:'One Answer',
                     _csrf:csrf

                   })
                   .expect(function(res){
                         let reg_string='<div class="alert alert-danger" role="alert">'+message['Invalid_PASSWORD_INPUT']+'<\/div>'
                         let re = new RegExp(reg_string,'g');
                         res.text.should.match(re)
                   })
                   .expect(200,done);
         });
    });

    it(url['User_Register_URL']+' with valid information will success registed', (done) =>{

      request.get(url['User_Register_URL'])
         .expect(200)
         .end((err,res)=>{
             let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
             let cookies=res.header['set-cookie'];
             request.post(url['User_Register_URL'])
                    .set('Accept-Type','text/html')
                    .set('Cookie',cookies.join(';'))
                    .redirects(1)
                    .send({
                      username: '353873605@qq.com',
                      password: '111111',
                      confirm_password:'111111',
                      selected_question:0,
                      answer_question:'One Answer',
                      _csrf:csrf

                    })
                    .expect(function(res){
                          let reg_string=message['NotActived'];
                          let re = new RegExp(reg_string,'g');
                          res.text.should.match(re);
                    })
                    .expect(200,done);
          });
     }).timeout(20000);

});



  describe('User Login Process', () => {

    it(url['User_Login_URL']+' with invalid csrf token will forbidden 403', (done) =>{
      var post = {
        username: 'NotExistUser@gmail.com',
        password: 'password'
      };
      request.post(url['User_Login_URL'])
         .set('Accept-Type','text/html')
         .send(post)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(403)
         .end(done)
     });

    it(url['User_Login_URL']+' with invalid user-pass should return login page with flash',(done)=>{
      request.get(url['User_Login_URL'])
         .expect(200)
         .end((err,res)=>{
             let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
             let cookies=res.header['set-cookie'];
             request.post(url['User_Login_URL'])
                    .set('Accept-Type','text/html')
                    .set('Cookie',cookies.join(';'))
                    .redirects(1)
                    .send({
                      username: 'NotExistUser@gmail.com',
                      password: 'password',
                      _csrf:csrf
                    })
                    .expect(function(res){
                          let reg_string='<div class="alert alert-danger" role="alert">'+message['Login-Failure']+'<\/div>'
                          let re = new RegExp(reg_string,'g');
                          res.text.should.match(re)
                    })
                    .expect(200,done);
                    // .end(done);
          });
        });
    });
});
