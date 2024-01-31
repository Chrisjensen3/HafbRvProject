var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET page. */
router.get("/", function (req, res) {
  console.log("login.js: GET");
  res.render("login", {});
});

// Called from app.js as a helper method to get the salt from the DB after user enters their email
const getSaltRoute = (app) => {
  app.post("/getsalt", async (req, res) => {
    const email = req.body.email;
    const sql = "CALL getSalt(?)";

    try {
      const results = await new Promise((resolve, reject) => {
        dbCon.query(sql, [email], function (err, results) {
          if (err) {
            reject(err);
          }
          resolve(results);
        });
      });

      if (results[0][0] === undefined) {
        console.log("login: No results found");
        res.status(404).json({
          message: "User '" + email + "' not found",
        });
      } else {
        const salt = results[0][0].salt;
        req.session.email = email;
        console.log(
          "login.js: The email session variable is '" + req.session.email + "'"
        );
        req.session.salt = salt;
        console.log(
          "login.js: The salt session variable is '" + req.session.salt + "'"
        );
        res.status(200).json({
          salt: salt,
        });
      }
    } catch (error) {
      console.error("login.js: An error occurred while fetching the salt");
      res.status(500).json({
        message: "Error getting salt",
      });
    }
  });
};

/* POST page. */
router.post("/", function (req, res, next) {
  console.log("login.js: POST");
  console.log("req.body: ", req.body);
  console.log("The email in variable is'" + req.session.email + "'");
  console.log("The password in variable is'" + req.body.password + "'");
  console.log("The salt in variable is'" + req.session.salt + "'");
  // If a hashedPassword exists
  if (req.body.hashedPassword) {
    // User is submitting user/password credentials
    const email = req.body.email;
    const hashedPassword = req.body.hashedPassword;
    const sql = "CALL checkCredentials(?,?)";
    dbCon.query(sql, [email, hashedPassword], function (err, results) {
      if (err) {
        throw err;
      }
      // If no results are found
      if (results[0][0] === undefined || results[0][0].result == 0) {
        console.log("login.js: No login credentials found");
        res.render("login", {
          message:
            "Password not valid for user '" +
            email +
            "'.  Please log in again.",
        });
      } else {
        // A match is found, getUserInfo
        getUserInfo(email, req, res);
      }
    });
  } else {
    res.render("login", {
      message: "Please enter a password",
    });
  }
});

function getUserInfo(email, req, res) {
  const sql = "SELECT * FROM user WHERE userEmail = ? LIMIT 1";
  dbCon.query(sql, [email], function (err, results) {
    if (err) {
      throw err;
    } else {
      const userTypeId = results[0].userTypeId;
      const userFirstName = results[0].userFirstName;
      const userLastName = results[0].userLastName;
      const userPhone = results[0].userPhone; 
      const userEmail = results[0].userEmail;
      const userBranch = results[0].userServiceBranch;
      // Login user
      req.session.save(function (err) {
        if (err) {
          throw err;
        }
        req.session.loggedIn = true;
        console.log(
          "login.js: loggedIn variable value = " + req.session.loggedIn
        );
        req.session.userTypeId = userTypeId;
        console.log(
          "login.js: userTypeId variable value = " + req.session.userTypeId
        );
        req.session.userId = results[0].userId;
        req.session.firstName = userFirstName;
        req.session.lastName = userLastName;
        req.session.phone = userPhone;
        req.session.email = userEmail;
        req.session.branch = userBranch;
        console.log("login.js: userId variable value = " + req.session.userId);
        console.log(
          "login.js: loggedIn variable value = " + req.session.loggedIn
        );
        console.log("User logged in " + req.session.firstName + " " + req.session.lastName);
        // User types: Admin = 1 / Employee = 2 / Customer = 3
        if (userTypeId == 1 || userTypeId == 2) {
          console.log("login.js: Send admin or employee to admin page");
          res.redirect("/admin");
        } // Else if customer
        if (userTypeId == 3) {
          console.log("login.js: Send customer to site page");
          res.redirect("/sites");
        }
      });
    }
  });
}

module.exports = {
  router: router,
  getSaltRoute: getSaltRoute,
};
