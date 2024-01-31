var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home");
});

router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      throw err;
    }
    // Clear session cookies
    res.clearCookie('session_cookie_name');
    console.log('home.js: Successful logout');
    res.redirect('/');
  });
});
module.exports = router;
