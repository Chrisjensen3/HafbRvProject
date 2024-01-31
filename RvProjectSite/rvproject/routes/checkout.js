var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET checkout page. */
router.get("/", function (req, res, next) {
  console.log("checkout.js: GET");
  res.render("checkout");
});

router.post("/", function (req, res, next) {
  console.log("checkout.js: POST");
  //generate a random confirmation number with numbers and letters
  let confirmationNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let userId = 0;
  if(req.session.otherUser && Object.keys(req.session.otherUser).length !== 0) {
    userId = req.session.otherUser.userId;
  } else if (req.session.reservation && Object.keys(req.session.reservation).length !== 0) {
    userId = req.session.reservation.userId;
  } else if (req.session.newReservation && Object.keys(req.session.newReservation).length !== 0) {
    userId = req.session.newReservation.userId;
  } else { userId = req.session.userId; }

  if(req.body['yes-no'] == 'no') {
    return res.render("checkout", {
      message: "Everyone in group must have base access in order to make a reservation.",
    });
  }
    
  let cartItems = req.session.itemsInCart;
  // Get the user's payment information from the form
  let payment = {}
  payment.userId = userId;
  payment.cardNumber = req.body.creditCard;
  payment.expDate = req.body.expiryDate;
  payment.cvv = req.body.cvv;
  payment.zip = req.body.zip;
  payment.arrivalTime = req.body.arrivalTime + ":00";
  payment.baseAccess = req.body['yes-no'];
  payment.comments = req.body.comments;
  payment.confirmationNumber = confirmationNumber;
   if (payment.comments == "") {
    payment.comments = null;
  }
  console.log("checkout.js: cartItems is " + JSON.stringify(cartItems)); 
  console.log("checkout.js: estArrivalTime is " + payment.arrivalTime);

  if(cartItems[0].resChangeNotice) {
    console.log("checkout.js: calling createRefund");
    createRefund(req, res, payment, cartItems);
  } else if(cartItems[0].resUpdateNotice) {
    console.log("checkout.js: calling");
    renderInvoice(req, res, payment, cartItems);
  } else {
    console.log("checkout.js: calling createReservation");
    createReservation(req, res, payment, cartItems);
  }
});

async function createReservation(req, res, payment, cartItems) {
  console.log("checkout.js: addReservation function"); 
  console.log("checkout.js: cartItems is " + JSON.stringify(cartItems));
  // Add new reservations for each cart item - Result is the new resId
  let checkin = '';
  let checkout = '';  
  let rvLength = '';
  let userId = 0;
  if(req.session.newReservation && Object.keys(req.session.newReservation).length !== 0) {
    checkin = req.session.newReservation.newCheckIn;
    checkout = req.session.newReservation.newCheckOut;
    rvLength = req.session.newReservation.rvLength;
    userId = req.session.newReservation.userId;
  }
  else {
    checkin = cartItems[0].checkIn;
    checkout = cartItems[0].checkOut;
    rvLength = cartItems[0].rvLength;
    userId = payment.userId;
  }
  if(rvLength == '') {
      rvLength = null;
  }
  let sql = "CALL addReservation(?, ?, ?, ?, ?, ?, ?, ?, @result); SELECT @result";
  let status = 'Paid';
  // Use await to pause execution of the loop until the query is done
  for (const cartItem of cartItems) {
    try {
      const rows = await dbCon.promise().query(sql, [
        checkin,
        checkout,
        rvLength,
        payment.comments,
        status,
        payment.arrivalTime,
        userId,
        cartItem.siteId,
      ]);
      console.log("checkout.js: rows is " + JSON.stringify(rows));
      console.log("checkout.js: rows[0][1] is " + JSON.stringify(rows[0][1]));
      console.log("checkout.js: rows[0][1][0] is " + JSON.stringify(rows[0][1][0]));
      console.log("checkout.js: rows[0][1][0]['@result'] is " + JSON.stringify(rows[0][1][0]["@result"]));
      if (rows && rows[0][1][0]["@result"] !== undefined) {
        console.log("Reservation added successfully! Reservation ID is " + rows[0][1][0]["@result"]);
        cartItem.resId = rows[0][1][0]["@result"];
        console.log("checkout.js: cartItems new resId is " + cartItem.resId);  
      } else {
        console.log("checkout.js: Error checking out during addReservation");
        return res.render("checkout", {
          message: "Error checking out",
          payment: payment,
        });
      }
    } catch (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
  console.log("checkout.js: calling createTransaction");
  createTransaction(req, res, payment, cartItems);
}

async function createTransaction(req, res, payment, cartItems) {
  // Add new transactions for each cart item - Result is the new trxId
  let sql = "CALL addTransaction(?, ?, ?, ?, ?, @result); SELECT @result";
  console.log("checkout.js: createTransaction function");
  // Use await to pause the execution of the loop until the query is done
  for (const cartItem of cartItems) {
    console.log("checkout.js: createTransaction for loop");
    try {
      const rows = await dbCon.promise().query( sql, [
        cartItem.subtotal,
        "Reservation for site " + cartItem.siteName,
        "Invoice",
        payment.confirmationNumber,
        cartItem.resId
      ]);

      if (rows && rows[0][1][0]["@result"] !== undefined) {
        console.log("Transaction added successfully! Transaction ID is " + rows[0][1][0]["@result"]);
        cartItem.trxId = rows[0][1][0]["@result"];
        cartItem.trxDescription = "Reservation for site " + cartItem.siteName;  
      } else {
        console.log("checkout.js: Error checking out during addTransaction");
        return res.render("checkout", {
          message: "Error checking out",
          payment: payment,
        });
      }
    } catch (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
  createTransactionItem(req, res, payment, cartItems);
}

async function createTransactionItem(req, res, payment, cartItems) {
  // Add new transaction items for each cart item - Result is the new trxItemId
  let sql = "CALL addTransactionItem(?, ?, ?, ?, @result); SELECT @result";

  // Use await to pause the execution of the loop until the query is done
  for (const cartItem of cartItems) {
    try {
      const rows = await dbCon.promise().query( sql, [
        cartItem.siteRate,
        cartItem.numDays,
        cartItem.siteType,
        cartItem.trxId,
      ]);

      if (rows && rows[0][1][0]["@result"] !== undefined) {
        console.log("Transaction item added successfully! trxItemID is " + rows[0][1][0]["@result"]);
        cartItem.trxItemId = rows[0][1][0]["@result"];
      } else {
        console.log("checkout.js: Error checking out during addTransactionItem"); 
        return res.render("checkout", {
          message: "Error checking out",
          payment: payment,
        });
      }
    } catch (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
  removeSitesFromCart(req, res, payment, cartItems);
}

async function removeSitesFromCart(req, res, payment, cartItems) {
  const sql = "CALL removeFromCart(?, @result);";

  try {
    for (const cartItem of cartItems) {
      const [rows] = await dbCon.promise().query(sql, [cartItem.siteId]);
      console.log("checkout.js: rows is " + JSON.stringify(rows));

      if (rows && rows.affectedRows == 1) {
        console.log("Cart item removed successfully!");
      } else {
        console.log("checkout.js: Error removing site");
        return res.render("checkout", {
          message: "Error removing site during checkout",
          payment: payment,
        });
      }
    }
    renderInvoice(req, res, payment, cartItems);
  } catch (err) {
    console.error("Error during database query:", err);
    return res.status(500).send("Internal Server Error");
  }
}

function createRefund(req, res, payment, cartItems) {
  let sql = "SELECT t.*, r.*, u.* FROM transaction t INNER JOIN RESERVATION r ON r.resId = t.resId INNER JOIN user u ON u.userId = r.userId WHERE t.resId = ?";
  dbCon.query(sql, [cartItems[0].resId], function (err, results) {
    if (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    } else {
      payment.userId = results[0].userId;
      payment.userTypeId = results[0].userTypeId;
      payment.trxId = results[0].trxId;
      payment.lastName = results[0].userLastName;
      payment.firstName = results[0].userFirstName;
      payment.email = results[0].userEmail;
      payment.phone = results[0].userPhone;
      payment.branch = results[0].userServiceBranch;
      console.log("checkout.js: results[0].trxId is " + results[0].trxId);
      console.log("checkout.js: results.trxId is " + results.trxId);
      renderInvoice(req, res, payment, cartItems);  
    }
  });
}

function renderInvoice(req, res, payment, cartItems) {
  const cartTotal = req.session.cartTotal;
  let today = new Date(); 
  let invoiceDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  payment.cartTotal = cartTotal;
  payment.invoiceDate = invoiceDate;
  res.render("invoice", {
    payment: payment, cartItems: cartItems,
  });
}

module.exports = router;
