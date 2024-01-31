var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET register page. */
router.get("/", function (req, res, next) {
  console.log("register.js: GET");
  res.render("register", {});
});

router.post("/", function (req, res, next) {
  console.log("register post register");
  // Get the register information from the page
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const phoneNumber = req.body.phone;
  const serviceBranch = req.body.serviceBranch;
  const serviceStatus = req.body.serviceStatus;
  const salt = req.body.salt;
  const hash = req.body.hash;
  const userTypeId = 3; // Customer

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
        // Successful registration!
        // Set the sessions variable for this
        req.session.email = email;
        req.session.firstName = firstName;
        req.session.lastName = lastName;
        req.session.phone = phoneNumber;
        req.session.branch = serviceBranch;
        req.session.loggedIn = true;
        req.session.save(function (err) {
          if (err) {
            throw err;
          }
          console.log(
            "register.js: Successful registration, email session field is: " +
              req.session.email
          );
          getUserInfo(email, res, req);
        });
      } else {
        //user already exists
        console.log(
          "register.js: Username already exists.  Reload register page with that message"
        );
        res.render("register", {
          message: "An account with email '" + email + "' already exists",
        });
      }
    }
  );
});

function getUserInfo(email, res, req) {
  const sql = "SELECT * FROM user WHERE userEmail = ? LIMIT 1";
  dbCon.query(sql, [email], function (err, results) {
    if (err) {
      throw err;
    } else {
      // Login user
      req.session.save(function (err) {
        if (err) {
          throw err;
        }
        req.session.userId = results[0].userId;
        console.log("register.js: userId is " + req.session.userId);
        const userTypeId = results[0].userTypeId;
        console.log("register.js: userTypeId is " + userTypeId);
        req.session.userTypeId = userTypeId;
        // User types: Admin = 1 / Employee = 2 / Customer = 3
        if (userTypeId == 1 || userTypeId == 2) {
          console.log("register.js: Send admin or employee user to admin page");
          res.redirect("/admin");
        } // Else if customer
        if (userTypeId == 3) {
          console.log("register.js: Send customer to site page");
          res.redirect("/sites");
        }
      });
    }
  });
}

module.exports = router;
