var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET admin page. */
router.get("/", function (req, res, next) {
  console.log("admin.js: GET");
  const dateToday= new Date();
  const sixMonths = new Date(dateToday);
  sixMonths.setMonth(dateToday.getMonth() + 6);
  // Format date as string (YYYY-MM-DD) for mysql search parameter
  const searchDate = dateToday.toISOString().split("T")[0];
  // Format date as string (MM-DD-YY) for display on page
  const displayDate = dateToday.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
  // Get all users from the database to populate the dropdown list
  let users = [];
  let sql = "SELECT u.userId, u.userFirstName, u.userLastName, u.userEmail, u.userPhone, ut.userType FROM user u LEFT JOIN userType ut ON u.userTypeId = ut.userTypeId ORDER BY ut.userTypeId";
  dbCon.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      users = results;
      console.log("users: " + JSON.stringify(users)); 
      console.log("admin.js: GET: calling getReservations() function");  
      getReservations(req, res, dateToday, searchDate, displayDate, sixMonths, users);
    }
  });
});

/* POST admin page. */
router.post("/", (req, res) => {
  console.log("admin.js: POST");

  // If user clicked 'change reservation' button
  if ((req.body.changeResId) || (req.body.changeMobileResId)) {
    let resId = 0;
    if(req.body.changeResId){
      resId = req.body.changeResId;
    } else if (req.body.changeMobileResId){
      resId = req.body.changeMobileResId;
    }
    console.log("resId: " + resId);

    otherUser = {};
    otherUser.resId = resId;

    // Get the user info from the database
    let sql = "SELECT u.userId, u.userFirstName, u.userLastName, u.userEmail, u.userPhone, u.userServiceBranch, ut.userType FROM user u LEFT JOIN reservation r ON r.userId = u.userId LEFT JOIN userType ut ON u.userTypeId = ut.userTypeId WHERE r.resId = ?";
    dbCon.query(sql, [resId], function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        otherUser.userId = results[0].userId;
        otherUser.firstName = results[0].userFirstName;
        otherUser.lastName = results[0].userLastName;
        otherUser.email = results[0].userEmail;
        otherUser.phone = results[0].userPhone;
        otherUser.branch = results[0].userServiceBranch;
        otherUser.userType = results[0].userType;
      }
      req.session.otherUser = otherUser;
      req.session.save(function (err) {
        if (err) {
          throw err;
        }
        console.log("req.session.otherUser: " + JSON.stringify(req.session.otherUser));
          // Redirect to reservations page
          return res.redirect("/reservations?resId=" + req.session.otherUser.resId);
      });
    });
  }

  // If user clicked 'reserve' button on available site and selected a user
  else if (req.body.selectUser) {
    const userId = req.body.selectUser;
    console.log("userId: " + userId);
    otherUser = {};
    otherUser.userId = userId;
    // Get the user info from the database
    let sql = "SELECT u.userFirstName, u.userLastName, u.userEmail, u.userPhone, u.userServiceBranch, ut.userType FROM user u LEFT JOIN userType ut ON u.userTypeId = ut.userTypeId WHERE u.userId = ?";
    dbCon.query(sql, [userId], function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        otherUser.firstName = results[0].userFirstName;
        otherUser.lastName = results[0].userLastName;
        otherUser.email = results[0].userEmail;
        otherUser.phone = results[0].userPhone;
        otherUser.branch = results[0].userServiceBranch;
        otherUser.userType = results[0].userType;
      }
      req.session.otherUser = otherUser;
      req.session.save(function (err) {
        if (err) {
          throw err;
        }
        console.log("req.session.otherUser: " + JSON.stringify(req.session.otherUser));
        // Pass the userId to the sites page
        return res.redirect("/sites?userId=" + req.session.otherUser.userId);
      });
    });
  }
  else {
    console.log("admin.js: POST: error - no button clicked");
  }
});

function getReservations(req, res, dateToday, searchDate, displayDate, sixMonths, users) {
  // Create reservations array
  var reservations = [];
  // Call adminGetReservations stored procedure
  dbCon.query(
    "CALL adminGetReservations(?)",
    [searchDate],
    function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        // Store results
        for (let i = 0; i < results[0].length; i++) {
          let reservation = results[0][i];
          // Convert reservation string dates to Date objects
          let checkIn = new Date(reservation.checkIn);
          let checkOut = new Date(reservation.checkOut);
          // Calculate the difference in milliseconds
          let diffInMs = checkOut.getTime() - checkIn.getTime();
          // Convert milliseconds to days
          let numNights = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          let siteTotal = parseInt(reservation.siteRate) * numNights;
          let formattedTotal = "$" + siteTotal.toFixed(2);

          reservations.push({
            resId: reservation.resId,
            userId: reservation.userId,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            lastName: reservation.userLastName,
            firstName: reservation.userFirstName,
            email: reservation.userEmail,
            phone: reservation.userPhone,
            branch: reservation.userServiceBranch,
            status: reservation.userStatus,
            siteName: reservation.siteName,
            siteRate: reservation.siteRate,
            siteType: reservation.siteType,
            nights: numNights,
            total: formattedTotal,
          });
        }
        getAvailableSites(req, res, reservations, dateToday, searchDate, displayDate, sixMonths, users);
      }
    }
  );
}

function getAvailableSites(req, res, reservations, dateToday, searchDate, displayDate, sixMonths, users) {
  // Create available array to store available sites
  var available = [];
  // Call adminGetReservations stored procedure
  dbCon.query(
    "CALL adminGetAvailableSites(?)",
    [searchDate],
    function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        // Store results
        for (var i = 0; i < results[0].length; i++) {
          var site = results[0][i];
          let nextDate = new Date(site.nextCheckinDate);
          let diff = 0;
          let numNights = 0;
          // Check for Peak Season of current date
          let month = dateToday.getMonth() + 1;
          if (month >= 4 && month <= 10) {
            if (site.nextCheckinDate != null) {
              diff = nextDate.getTime() - dateToday.getTime();
            } else {
              // Get six months from current date so admin can override if user is on PCS orders
              diff = sixMonths.getTime() - dateToday.getTime();
            }
          }
          // Convert milliseconds to days
          numNights = diff / (1000 * 60 * 60 * 24);
          available.push({
            siteId: site.siteId,
            nights: numNights,
            siteName: site.siteName,
            maxLength: site.maxTrailerLength,
            siteType: site.siteType,
            siteRate: site.siteRate,
          });
        }
        // Render the admin page and pass the reservations array
        return res.render("admin", {
          reservations: reservations,
          available: available,
          displayDate: displayDate,
          users: users,
        });
    }
  });
}



module.exports = router;
