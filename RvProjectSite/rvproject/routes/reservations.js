var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET reservations page. */
router.get("/", function (req, res, next) {
  console.log("reservations.js POST: GET");
  // If Admin passed in a resId from the admin view (to change a single reservation)
  if(req.query.resId) {
    const resId = parseInt(req.query.resId);
    console.log("resId passed from Admin page to change a reservation: " + resId);
    dbCon.query(
    "SELECT userId FROM reservation WHERE resId = ?", 
    [resId],
    function (err, results, fields) {
      if (err) {
        throw err;
      }
      if (results) {
        const userId = results[0].userId;
        checkReservations(req, res, null, userId);
      } else {
        console.log("reservations.js POST: GET: No results from query");
        return res.render("reservations", {
          message: "Error gathering userId from reservation",
        });
      }
    });
  } else {
    const userId = parseInt(req.session.userId);
    console.log("reservations.js POST: user is checking their own reservations: " + userId);
    checkReservations(req, res, null, userId);
  }
});

/* POST reservations page. */
router.post("/", (req, res) => {
  console.log("reservations.js POST:");
  var selectedResId = req.body.selectedResId;
  console.log("reservations.js POST: selectedResId: " + selectedResId);
  getSingleReservationInfo(req, res, selectedResId);
});

function checkReservations(req, res, message, userId) {
  // Gather all reservations for the user and check to see if any have been completed
  console.log("reservations.js POST: userId in checkReservations: " + userId);
  dbCon.query(
  "CALL getReservationCheckout(?)",
  [userId],
  function (err, results, fields) {
    if (err) {
      return res.status(500).send("Error executing the getReservationCheckout stored procedure");
    }
    if (results) {
      console.log("reservations.js POST: Gathered all reservations for the user");
      markCompletedReservations(req, res, message, userId, results[0]);
    } else {
      console.log("reservations.js POST: Error gathering reservations");
      return res.render("reservations", {
        message: "Error gathering reservations",
      });
    }
  });
}

function markCompletedReservations(req, res, message, userId, reservationsToMark) {
  // Check to see if any reservations have been completed
  console.log("reservations.js POST: userId in markCompletedReservations: " + userId);
  console.log("reservations.js POST: in markCompletedReservations: " + JSON.stringify(reservationsToMark));
  console.log("reservations.js POST: reservations.length: " + reservationsToMark.length); 
  // Get dateToday's date
  var dateToday = new Date();
  dateToday.setHours(0,0,0,0);

  // Track the number of completed reservations
  var completedCount = 0;
  
// Loop through all reservations
  for (var i = 0; i < reservationsToMark.length; i++) {
    // Get the checkOut date of the current reservation
    var checkOut = new Date(reservationsToMark[i].checkOut);
    checkOut.setHours(0,0,0,0);

    // Compare the checkOut date with dateToday's date
    if (checkOut.getTime() < dateToday.getTime()) {
      console.log("reservations.js POST: Check to see if checkout date is earlier than dateToday");
      // If the checkOut date is earlier than dateToday, update the status of the reservation
      dbCon.query(
        "CALL setReservationStatus(?, 'Completed')",
        [reservationsToMark[i].resId],
        function (err, result) {
          if (err) {
            throw err;
          }
          else {
            completedCount++;
            if (completedCount === reservationsToMark.length) {
            getReservations(req, res, message, userId);
            }
          }
        }
      );
    }
    else {
      completedCount++;
    }
  }
  if (completedCount === reservationsToMark.length) {
    getReservations(req, res, message, userId);
  }
}

function getReservations(req, res, message, userId) {
  // Get all reservations with user and site details using getReservations stored procedure
  var reservations = [];
  console.log("reservations.js POST: userId in getReservations function: " + userId);

  dbCon.query(
    "CALL getReservations(?)",
    [userId],
    function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        const siteImages = {
          1: "images/backin.jpg",
          2: "images/premium.jpg",
          3: "images/drysite.jpg",
          4: "images/rental.jpg",
          5: "images/tent.jpg",
          6: "images/rvpark-people2.jpg",
        };
        console.log(results[0][0]);
        // Store the resulting data in an array
        for (var i = 0; i < results[0].length; i++) {
          var reservation = results[0][i];
          reservations.push({
            userId: reservation.userId,
            resId: reservation.resId,
            siteId: reservation.siteId,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            length: reservation.trailerLength,
            firstName: reservation.userFirstName,
            lastName: reservation.userLastName,
            email: reservation.userEmail,
            phone: reservation.userPhone,
            branch: reservation.userServiceBranch,
            userTypeId: reservation.userTypeId,
            siteTypeId: reservation.siteTypeId,
            siteName: reservation.siteName,
            siteType: reservation.siteType,
            siteRate: reservation.siteRate,
            status: reservation.status,
            siteImage: siteImages[reservation.siteTypeId],
          });
          // Get date difference
          reservations[i].diffDays = calculateDiffDays(reservations[i].checkIn, reservations[i].checkOut);
          // Calculate the total cost of the reservation
          reservations[i].total = reservations[i].diffDays * reservations[i].siteRate;
        }
        renderReservationsPage(req, res, reservations, message, userId);
      }
    }
  );
}

function renderReservationsPage(req, res, reservations, message, userId) {
  res.render("reservations", {
    reservations: reservations,
    message: message,
    userId: userId,
  });
}

function getSingleReservationInfo(req, res, resId) {
  console.log("reservations.js POST: selected reservation = " + resId);
  let reservation = {};
  reservation.resId = resId;

  // Get reservation info
  let sql =
    "SELECT reservation.*, site.*, siteType.*, user.* FROM reservation LEFT JOIN site ON site.siteId = reservation.siteId LEFT JOIN siteType ON siteType.siteTypeId = site.siteTypeId LEFT JOIN user ON user.userId = reservation.userId WHERE reservation.resId = ?";
  dbCon.query(sql, [resId], function (err, results) {
    if (err) {
      throw err;
    } else {
      if (results !== undefined && results.length > 0) {
        const result = results[0];
        console.log("reservations.js POST: result: " + JSON.stringify(result));  
        reservation.userId = result.userId;
        reservation.firstName = result.userFirstName;
        reservation.lastName = result.userLastName;
        reservation.email = result.userEmail;
        reservation.phone = result.userPhone;
        reservation.branch = result.userServiceBranch;
        reservation.userTypeId = result.userTypeId;
        reservation.checkIn = result.checkIn;
        reservation.checkOut = result.checkOut;
        reservation.comment = result.comment;
        reservation.status = result.status;
        reservation.siteId = result.siteId;
        reservation.siteName = result.siteName;
        reservation.siteType = result.siteType;
        reservation.siteRate = result.siteRate;
        reservation.siteTypeId = result.siteTypeId;
        reservation.siteImage = result.siteTypeImage;
      }
      console.log("reservations.js POST: reservation.userId = " + reservation.userId);
      if(req.query.resId) {
        req.session.reservation = reservation;
        req.session.save(function (err) {
          if (err) {
            throw err;
          }
          if (req.body.action === "cancel") {
            cancelReservation(req, res, reservation);
          } else if (req.body.action === "update") {
            console.log("reservations.js POST: update reservation");
            updateReservation(req, res, reservation);
          } else {
            console.log("reservations.js POST: No action specified");
          }
        });
      } else {
        console.log("reservations.js POST: session otherUserId is undefined");
        if (req.body.action === "cancel") {
            cancelReservation(req, res, reservation);
        } else if (req.body.action === "update") {
          console.log("reservations.js POST: update reservation");
          updateReservation(req, res, reservation);
        } else {
          console.log("reservations.js POST: reservation passed, but no action specified");
        }
      }
    }
  });
}

function cancelReservation(req, res, reservation) {

  const diffDays = calculateDiffDays(reservation.checkIn, reservation.checkOut);
  const daysBeforeCheckIn = calculateDiffDays(new Date(), reservation.checkIn)
  reservation.diffDays = parseInt(diffDays) * -1;
  reservation.numDays = diffDays * -1;
  reservation.subtotal = reservation.diffDays * parseFloat(reservation.siteRate);
  reservation.daysBeforeCheckIn = daysBeforeCheckIn;
  console.log("reservations.js POST: in cancelReservation function: " + JSON.stringify(reservation));
  //generate a random confirmation number with numbers and letters
  let confirmationNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  reservation.confirmationNumber = confirmationNumber;
  dbCon.query(
    "CALL cancelReservation(?,?,?,?,?,?, @result); select @result",
    [
      reservation.resId,
      reservation.siteId,
      reservation.daysBeforeCheckIn,
      reservation.siteRate,
      reservation.diffDays,
      reservation.confirmationNumber,
    ],
    function (err, rows, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      }
      else {
        console.log("reservation.js POST: rows[1][0][@result] = " + rows[1][0]["@result"]);
        if (rows[1][0]["@result"] > 0) {
          console.log("reservation.js POST: Reservation " + reservation.resId + " cancelled");
          reservation.trxId = rows[1][0]["@result"]; 
          renderCheckoutWithCancel(req, res, reservation);  
        } else {
          console.log("reservation.js POST: Error canceling reservation");
        }
      }
    }
  );
}

function calculateDiffDays(date1, date2) {
    const beginDate = new Date(date1);
    const endDate = new Date(date2);
    const timeDiff = Math.abs(endDate.getTime() - beginDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));  // 1000 * 3600 * 24 is the number of milliseconds in a day
    return diffDays;
}

function updateReservation(req, res, reservation) {
  // First check for overlapping reservation on changed dates
  // Save new reservation info to session
  dbCon.query(
  "SELECT u.* FROM user u LEFT JOIN reservation r ON r.userId = u.userId WHERE r.resId = ?;", 
  [reservation.resId],
  (error, results) => {
    if (error) {
      throw error;
    }
    if (results) {
      console.log("reservation.js POST: retrieved user info for reservation: " + JSON.stringify(results));
      let newReservation = {};
      newReservation.userId = results[0].userId;
      newReservation.firstName = results[0].userFirstName;
      newReservation.lastName = results[0].userLastName;
      newReservation.email = results[0].userEmail;
      newReservation.phone = results[0].userPhone;
      newReservation.branch = results[0].userServiceBranch;
      newReservation.newCheckIn = req.body.updatedCheckIn;
      newReservation.newCheckOut = req.body.updatedCheckOut;
      newReservation.cancel = false;
      newReservation.siteId = reservation.siteId;
      newReservation.siteName = reservation.siteName;
      newReservation.siteType = reservation.siteType;
      newReservation.siteRate = reservation.siteRate;
      newReservation.siteTypeId = reservation.siteTypeId;
      newReservation.siteImage = reservation.siteImage;
      newReservation.diffDays = calculateDiffDays(newReservation.newCheckIn, newReservation.newCheckOut);
      newReservation.numDays  = newReservation.diffDays;
      newReservation.subtotal = parseInt(newReservation.numDays) * parseFloat(newReservation.siteRate);
      req.session.newReservation = newReservation;
      console.log("reservation.js POST: newReservation assigned");
      console.log("reservation.js POST: newReservation = " + JSON.stringify(req.session.newReservation)); 
      req.session.save(function (err) {
        if (err) {
          throw err;
        }
        checkOverlappingReservations(req, res, reservation);
      });
    } else {
      console.log("reservation.js POST: Error: results undefined");
    }
  });
}

function checkOverlappingReservations(req, res, reservation) {
  console.log("reservation.js: checkOverlappingReservations");
  dbCon.query(
  "CALL checkOverlappingReservations(?,?,?,?,@result); SELECT @result as result;",
  [reservation.resId, reservation.siteId, reservation.newCheckIn, reservation.newCheckOut],
  (error, results) => {
    if (error) {
      throw error;
    }
    const result = results[1][0].result;
    // Returns the count of overlapping reservations
    if (result > 0) {
      console.log("reservation.js POST: Error: Overlapping reservation exists");
    } else if (result == 0) {
      console.log("reservation.js POST: No overlapping reservation exists");
      // Cancel the existing reservation before adding the updated reservation
      cancelReservation(req, res, reservation);
    } else {
      console.log("reservation.js POST: Error: results undefined");
    }
  });
}

function renderCheckoutWithCancel(req, res, reservation) {
  var cartItems = reservation; 
      
  // Calculate cart total
  if (cartItems.daysBeforeCheckIn >= 3) {
    cartItems.cancelFee = 10;
    cartItems.resChangeNotice = "Refund Cancellation with $10 fee";
  } else if (cartItems.daysBeforeCheckIn > 0) {
    cartItems.cancelFee = parseFloat(cartItems.siteRate);
    cartItems.resChangeNotice = "Refund Cancellation with full day's fee";
  } 
  const cartTotal = cartItems.subtotal + cartItems.cancelFee;

  // Save the session variables
  // Append the new items to the existing items in the cart
  req.session.itemsInCart = req.session.itemsInCart || [];
  req.session.itemsInCart.push(cartItems);
  req.session.cartTotal = req.session.cartTotal || 0;
  req.session.cartTotal = parseFloat(req.session.cartTotal) + cartTotal;
  req.session.reservation = reservation;

  req.session.save(function (err) {
    if (err) {
      throw err;
    }
    console.log("reservations.js POST: itemsInCart session field is: " + req.session.itemsInCart);
    console.log("reservations.js POST: reservation session field is: " + req.session.reservation);
    // Render the checkout page inside the callback to ensure session data is saved before rendering
    res.render("checkout");
  });
}

module.exports = router;
