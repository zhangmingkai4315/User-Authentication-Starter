// 测试用户的登录情况 Test the user authentication behavior
import should from 'should';     // eslint-disable-line
import { expect} from 'chai';   // eslint-disable-line
import supertest from 'supertest';
import async from 'async';
import config from 'config';
import mongoose  from 'mongoose';

// import {app} from '../../index';

const url = config.get('URL');
const request = supertest(url['Base_URL']);
const message = config.get('Message');
import {User,ChangePasswordSession} from '../models';
const model_list=[User,ChangePasswordSession];
const database = config.get('Database.mongoDB');
const db_connect_string='mongodb://'+database.host+':'+database.port+'/'+database.database;
const test_email= config.get('Email.username');
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
  let global_csrf='';   // eslint-disable-line
  let global_cookies=''; // eslint-disable-line
  let password='111111';
  let new_password='222222';
  before((done) => {
    console.log('\n    >>>>Clean The Database For Test\n');
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
    console.log('\n    <<<<Test Done. Try To Disconnect The Database\n');
    // in case error:OverwriteModelError: https://github.com/Automattic/mongoose/issues/1251
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.disconnect();
    return done();
  });

  describe('User Regist Process', () => {

    it(url['User_Register_URL']+' with invalid csrf token will forbidden 403', (done) =>{
      var post = {
        username: test_email,
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
                     username: test_email,
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
                      username: '353873605',
                      password: 'test_pass',
                      confirm_password:'test_pass',
                      selected_question:0,
                      answer_question:'One Answer',
                      _csrf:csrf

                    })
                    .expect(function(res){
                          let reg_string='<div class="alert alert-danger" role="alert">'+message['Invalid_Email']+'<\/div>'
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
             global_csrf=csrf;
             global_cookies= cookies;
             request.post(url['User_Register_URL'])
                    .set('Accept-Type','text/html')
                    .set('Cookie',cookies.join(';'))
                    .redirects(1)
                    .send({
                      username: test_email,
                      password: password,
                      confirm_password:password,
                      selected_question:0,
                      answer_question:'One Answer',
                      _csrf:csrf

                    })
                    .expect(function(res){
                          let reg_string=message['NotActived'];
                          let re = new RegExp(reg_string,'g');
                          res.text.should.match(re);
                          // res..should.include(url['User_NotActive_URL'])
                          should.equal(res.req.path,url['User_NotActive_URL'])
                    })
                    .expect(200,done);
          });
     }).timeout(30000);  // send email will cost more than 2s!
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

      it(url['User_Login_URL']+' with valid user-pass should return notactive page',(done)=>{
        request.get(url['User_Login_URL'])
           .expect(200)
           .end((err,res)=>{
               let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
               let cookies=res.header['set-cookie'];
               request.post(url['User_Login_URL'])
                      .set('Accept-Type','text/html')
                      .set('Cookie',cookies.join(';'))
                      .redirects(2)  // login - > profile - > notactive
                      .send({
                        username: test_email,
                        password: password,
                        _csrf:csrf
                      })
                      .expect((res)=>{
                          should.equal(res.req.path,url['User_NotActive_URL'])  //not active user
                      })
                      .expect(200,done);
                      // .end(done);
            });
        });
        // i don't know how to test this part. Maybe later i will figure out how to.
      it(url['User_Login_URL']+' fake user active his account with url',(done)=>{
        User.findOneAndUpdate(
              {username:test_email},
              {$set:{'status':'Actived'}},
              {'upsert':false,'new':true},
              (err)=>{
                if(err){
                  done(err)
                }
                done();
              })
      });

      it(url['User_Login_URL']+' with valid user-pass and active user should return profile page',(done)=>{
        request.get(url['User_Login_URL'])
           .expect(200)
           .end((err,res)=>{
               let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
               let cookies=res.header['set-cookie'];
               global_cookies=cookies;
               global_csrf=csrf;
               request.post(url['User_Login_URL'])
                      .set('Accept-Type','text/html')
                      .set('Cookie',cookies.join(';'))
                      .redirects(1)  // login - > profile - > notactive
                      .send({
                        username: test_email,
                        password: password,
                        _csrf:csrf
                      })
                      .expect(function(res){
                          should.equal(res.req.path,url['User_Profile_URL'])  //not active user
                      })
                      .expect(200,done);
                      // .end(done);
            });
        });

      it(url['User_Login_URL']+' with valid user-pass and active user should access change password page',(done)=>{
              request.get(url['User_ChangePassword_URL'])
                                .set('Accept-Type','text/html')
                                .set('Cookie',global_cookies.join(';'))
                                .expect(200)
                                .expect(res=>{
                                  should.equal(res.req.path,url['User_ChangePassword_URL'])
                                })
                                .end(done);
                      // .end(done);
        });

      it(url['User_Login_URL']+' with valid user-pass and active user should change his password!',(done)=>{
              request.get(url['User_ChangePassword_URL'])
                                .set('Accept-Type','text/html')
                                .set('Cookie',global_cookies.join(';'))
                                .expect(200)
                                .end((err,res)=>{
                                  let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
                                  should.equal(res.req.path,url['User_ChangePassword_URL'])
                                  request.post(url['User_ChangePassword_URL'])
                                         .set('Accept-Type','text/html')
                                         .set('Cookie',global_cookies.join(';'))
                                         .redirects(1)  // login - > profile - > notactive
                                         .send({
                                           username: test_email,
                                           password: password,
                                           new_password:new_password,
                                           new_password_confirm:new_password,
                                           _csrf:csrf
                                         })
                                         .expect(200)
                                         .expect(res=>{
                                           let reg_string=message['Success_Change_Password']
                                           let re = new RegExp(reg_string,'g');
                                           res.text.should.match(re);
                                         })
                                         .end(done);

                                });
                      // .end(done);
        });

      it(url['User_Logout_URL']+' should redirect user to home page',(done)=>{
              request.get(url['User_Logout_URL'])
                                .set('Accept-Type','text/html')
                                .set('Cookie',global_cookies.join(';'))
                                .expect(302)
                                .redirects(1)
                                .expect(200)
                                .end((err,res)=>{
                                  should.equal(res.req.path,url['Home_Page_URL'])
                                  done();
                                });
                      // .end(done);
        });


      it(url['User_Login_URL']+' user with valid new password should return profile page',(done)=>{
        request.get(url['User_Login_URL'])
           .expect(200)
           .end((err,res)=>{
               let csrf=res.text.match(/name="_csrf" value=\"([\w\W]+?)\"/)[1];
               let cookies=res.header['set-cookie'];
               global_cookies=cookies;
               global_csrf=csrf;
               request.post(url['User_Login_URL'])
                      .set('Accept-Type','text/html')
                      .set('Cookie',cookies.join(';'))
                      .redirects(1)  // login - > profile - > notactive
                      .send({
                        username: test_email,
                        password: new_password,
                        _csrf:csrf
                      })
                      .expect(function(res){
                          should.equal(res.req.path,url['User_Profile_URL'])  //not active user
                      })
                      .expect(200,done);
                      // .end(done);
            });
        });
    });
});
