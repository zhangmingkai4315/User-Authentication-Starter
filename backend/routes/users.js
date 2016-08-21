import express from 'express';
var router = express.Router();

/* GET users login page. */
router.get('/login', (req,res) => {
  res.render('users/login');
});

/* GET users regist page. */
router.get('/regist', (req,res) => {
  res.render('users/regist');
});

/* GET users profile page. */
router.get('/profile', (req,res) => {
  res.render('users/profile');
});

/* GET users change_password page. */
router.get('/change_password', (req,res) => {
  res.render('users/change_password_from_page');
});

/* GET users change_password_from_email page. */
router.get('/change_password_from_email', (req,res) => {
  res.render('users/change_password_from_email');
});

module.exports = router;
