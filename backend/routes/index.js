import express from 'express';
import config from 'config';

const router = express.Router();
const PageCustom = config.get('PageCustom');
/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: PageCustom["Home-Page-Title"]});
});
/* GET home page. */
router.get('/about', (req, res) => {
  res.render('about', { title: PageCustom["About-Me-Title"]});
});
module.exports = router;
