import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'UserAuthStarter' });
});
/* GET home page. */
router.get('/about', (req, res) => {
  res.render('about', { title: '关于我们' });
});
module.exports = router;
