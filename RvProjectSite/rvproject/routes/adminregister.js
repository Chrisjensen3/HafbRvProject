var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET adminregister page. */
router.get("/", function (req, res, next) {
  console.log("adminregister.js: GET");
  userTypeId = req.session.userTypeId
  if (userTypeId == 1 || userTypeId == 2){
  res.render("adminregister");
  } else{
    res.redirect("/");
  }
});

router.post("/", function (req, res, next) {
  console.log("adminregister.js: POST");

  // Get the register information from the page
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const phoneNumber = req.body.phone;
  const serviceBranch = req.body.serviceBranch;
  const serviceStatus = req.body.serviceStatus;
  const salt = req.body.salt;
  const hash = req.body.hash;
  const userTypeId = req.body.usertype;

  let sql =
    "CALL registerUser(?, ?, ?, ?, ?, ?, ?, ?, ?, @result); select @result";

  dbCon.query(
    sql,
    [
      firstName,
      lastName,
      email,
      serviceBranch,
      serviceStatus,
      salt,
      hash,
      userTypeId,
      phoneNumber,
    ],
    function (err, rows) {
      if (err) {
        throw err;
      }
      if (rows[1][0]["@result"] == 0) {
        // Successful admin registration!
        res.render("adminregister", {
          message: "Successful registration!",
        });
      } else {
        //user already exists
        console.log(
          "adminregister.js: Username already exists.  Reload register page with that message"
        );
        res.render("adminregister", {
          message: "An account with email '" + email + "' already exists",
        });
      }
    }
  );
});

module.exports = router;
