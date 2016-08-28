// 测试页面的访问情况 Test the view of web pages.
import should from 'should';     // eslint-disable-line
import { expect } from 'chai';   // eslint-disable-line
import supertest from 'supertest';
import config from 'config';
// import {app} from '../../index';

const url = config.get('URL');
const request = supertest(url['Base_URL']);

describe('Webpages View Test',()=>{
  describe('Standard URL Without Authentication',()=>{
    it(url['Home_Page_URL']+' should return 200 StatusCode',(done)=>{
      request.get(url['Home_Page_URL'])
         .expect(200,done);
    });
    it(url['About_URL']+' should return 200 StatusCode',(done)=>{
      request.get(url['About_URL'])
         .expect(200,done);
    });
    it(url['User_Login_URL']+' should return 200 StatusCode and include login form',(done)=>{
      request.get(url['User_Login_URL'])
         .expect(200)
         .expect((res)=>{
             res.text.should.match(/id="login"/);
             res.text.should.match(/name="username"/);
             res.text.should.match(/name="password"/);
             res.text.should.match(/name="_csrf" value=\"[\w\W]+\"/);  //include csrf
          })
         .end(done);
    });
    it(url['User_Register_URL']+' should return 200 StatusCode and register form ',(done)=>{
      request.get(url['User_Register_URL'])
         .expect(200)
         .expect((res)=>{
            res.text.should.match(/id="regist"/);
            res.text.should.match(/name="username"/);
            res.text.should.match(/name="password"/);
            res.text.should.match(/name="confirm_password"/);
            res.text.should.match(/name="selected_question"/);
            res.text.should.match(/name="answer_question"/);
            res.text.should.match(/name="_csrf" value=\"[\w\W]+\"/);  //include csrf
          })
         .end(done);
    });
    it(url['User_ForgetPassword_URL']+' should return 200 StatusCode and forget_password form',(done)=>{
      request.get(url['User_ForgetPassword_URL'])
        .expect(200)
        .expect((res)=>{
           res.text.should.match(/id="forget_password_form"/);
           res.text.should.match(/name="username"/);
           res.text.should.match(/name="selected_question"/);
           res.text.should.match(/name="answer_question"/);
           res.text.should.match(/name="_csrf" value=\"[\w\W]+\"/);  //include csrf
         })
        .end(done);
    });
  });
  describe('Standard URL Will Redirect',()=>{
    it('Unauthenticated User Profile Should Redirect to Login Page',(done)=>{
      request.get(url['User_Profile_URL'])
         .expect(302)
         .expect('Location',url['User_Login_URL'])
         .end(done);
    });
    it('Unauthenticated User Logout Should Redirect to Main Page',(done)=>{
      request.get(url['User_Logout_URL'])
         .expect(302)
         .expect('Location',url['Home_Page_URL'])
         .end(done);
    });
    it('Unauthenticated User Change Password Should Redirect to Login Page',(done)=>{
      request.get(url['User_ChangePassword_URL'])
         .expect(302)
         .expect('Location',url['User_Login_URL'])
         .end(done);
    });
  });
})
