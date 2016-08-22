import express from 'express';
import csrf from 'csurf';

// 设置csrf 保护
const csrfProtection = csrf({ cookie: true })
const router = express.Router();

/* GET users login page. */
router.get('/login', csrfProtection, (req,res) => {
  res.render('users/login',{ csrfToken: req.csrfToken() });
});

router.post('/login',csrfProtection,(req,res)=>{
  res.render('index');
});



/* GET users regist page. */
router.get('/regist', csrfProtection, (req,res) => {
  res.render('users/regist',{ csrfToken: req.csrfToken() });
});

/* GET users profile page. */
router.get('/profile', csrfProtection, (req,res) => {
  res.render('users/profile');
});

/* GET users change_password page. */
router.get('/change_password', csrfProtection, (req,res) => {
  res.render('users/change_password_from_page',{ csrfToken: req.csrfToken() });
});

/* GET users change_password_from_email page. */
router.get('/change_password_from_email', csrfProtection, (req,res) => {
  res.render('users/change_password_from_email',{ csrfToken: req.csrfToken() });
});

module.exports = router;
