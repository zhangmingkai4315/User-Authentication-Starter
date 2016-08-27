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
    console.log('\n\tClean The Database For Test\n');
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
    console.log('\n\tTest Done. Try To Disconnect The Database\n');
    // in case error:OverwriteModelError: https://github.com/Automattic/mongoose/issues/1251
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.disconnect();
    return done();
  });
  describe('User Login With Wrong Params Will Fail Test', () => {
    it(url['User_Login_URL']+' should return login page',(done)=>{
      request.get(url['User_Login_URL'])
         .expect(200)
         .end((err,res)=>{

             res.text.should.match(/id="login"/);
             res.text.should.match(/name="username"/);
             res.text.should.match(/name="password"/);
             res.text.should.match(/name="_csrf" value=\"[\w\W]+\"/);  //include csrf
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
    it('You will stay at login page  if the form data is invalid', (done) =>{
      var post = {
        username: 'NotExistUser@gmail.com',
        password: 'password'
      };
      request.post(url['User_Login_URL'])
         .set('Accept-Type','text/html')
         .send(post)
         .expect('Content-Type', 'text/plain; charset=utf-8')
         .expect(302)
         .end(done)
     });
  });

});
