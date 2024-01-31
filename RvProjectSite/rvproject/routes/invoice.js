var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");

/* GET invoice page. */
router.get("/", function (req, res, next) {
  console.log("invoice.js: GET");
  res.render("invoice");
});

/* POST invoice page. */    
router.post("/", function (req, res, next) {
  console.log("invoice.js: POST");
  console.log("invoice.js: req.session.userTypeId = " + req.session.userTypeId);

  // If the host site has been selected, create the reservation without payment information
  let cartItems = req.session.itemsInCart;
  if(parseInt(cartItems[0].siteTypeId) == 6) {
    console.log("invoice.js: host site selected, creating reservation without payment information");
    if(req.body.comments == "") {
      req.body.comments = null;
    }
    console.log("invoice.js: adding reservation for host site"); 
    let status = 'Reserved';
    dbCon.query(
      "CALL addReservation(?, ?, ?, ?, ?, ?, ?, ?, @result); SELECT @result;",
      [cartItems[0].checkIn, cartItems[0].checkOut, null, req.body.comments, status, null, parseInt(req.session.otherUser.userId), parseInt(cartItems[0].siteId),],
      (error, results) => {
        if (error) {
          throw error;
        }
        const result = results[1][0]["@result"];
        if (result > 0) {
          cartItems[0].resId = result;  
          console.log("invoice.js: Reservation booked, creating transaction");
          createTransaction(req, res, cartItems);
        } else {
          console.log("invoice.js: Error: Could not complete reservation");
        }
      });
  } else {
    console.log("invoice.js: host site not selected, clearing session variables not related to login");
    // Clear the session variables not related to login
    req.session.itemsInCart = [];
    req.session.otherUser = {};
    req.session.reservation = {};
    req.session.cartTotal = 0;
    console.log("invoice.js: clearing session variables not related to login");
    console.log("invoice.js: itemsInCart: " + req.session.itemsInCart);
    console.log("invoice.js: newReservation: " + JSON.stringify(req.session.newReservation));
    if(req.session.newReservation && Object.keys(req.session.newReservation).length !== 0 && req.session.newReservation.cancel == false) {
      req.session.newReservation.cancel = true;
      // Populate the cart with the newReservation
      req.session.itemsInCart.push(req.session.newReservation);
      req.session.cartTotal = req.session.newReservation.subtotal;
      console.log("invoice.js: newReservation.cancel: " + req.session.newReservation.cancel);
      res.redirect('/checkout');  
    }
    else if(req.session.newReservation && Object.keys(req.session.newReservation).length !== 0 && req.session.newReservation.cancel == true) {
      // Clear the newReservation
      req.session.newReservation = {};
      req.session.itemsInCart = [];
      console.log("invoice.js: Both Refund and invoice have processed. newReservation: " + JSON.stringify(req.session.newReservation));
      // Redirect to the admin page for admin users
      if (req.session.userTypeId == 1 || req.session.userTypeId == 2) {
        res.redirect('/admin');
      }
      // Redirect to the reservations page
      else {
        res.redirect('/reservations');
      }
    }
    else if(!req.session.newReservation) {
    req.session.save(function (err) {
      if (err) {
        throw err;
      }
      else {
        if (req.session.itemsInCart && req.session.itemsInCart.length > 0) {
          res.redirect('/checkout');  
        }
        else {
          // Redirect to the admin page for admin users
          if (req.session.userTypeId == 1 || req.session.userTypeId == 2) {
            res.redirect('/admin');
          }
          // Redirect to the reservations page
          else {
            res.redirect('/reservations');
          }
        }
      }
    });
  }
  }
});

async function createTransaction(req, res, cartItems) {
  // Add new transactions for each cart item - Result is the new trxId
  let sql = "CALL addTransaction(?, ?, ?, ?, ?, @result); SELECT @result";
  console.log("invoice.js: createTransaction function");
  // Use await to pause the execution of the loop until the query is done
  let confirmationNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  for (const cartItem of cartItems) {
    console.log("invoice.js: createTransaction for loop");
    try {
      const rows = await dbCon.promise().query( sql, [
        cartItem.subtotal,
        "Reservation for site " + cartItem.siteName,
        "Invoice",
        confirmationNumber,
        cartItem.resId
      ]);

      if (rows && rows[0][1][0]["@result"] !== undefined) {
        console.log("Transaction added successfully! Transaction ID is " + rows[0][1][0]["@result"]);
        cartItem.trxId = rows[0][1][0]["@result"];
        cartItem.trxDescription = "Reservation for site " + cartItem.siteName;  
      } else {
        console.log("checkout.js: Error checking out during addTransaction");
      }
    } catch (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
  createTransactionItem(req, res, cartItems);
}

async function createTransactionItem(req, res, cartItems) {
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
      }
    } catch (err) {
      console.error("Error during database query:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
  removeSitesFromCart(req, res, cartItems);
}

async function removeSitesFromCart(req, res, cartItems) {
  const sql = "CALL removeFromCart(?, @result);";
  try {
    for (const cartItem of cartItems) {
      const [rows] = await dbCon.promise().query(sql, [cartItem.siteId]);
      if (rows && rows.affectedRows == 1) {
        console.log("Cart item removed successfully!");
         // Clear the session variables not related to login
        req.session.itemsInCart = [];
        req.session.cartTotal = 0;
        req.session.otherUser = {};
        req.session.reservation = {};

        req.session.save(function (err) {
          if (err) {
            throw err;
          }
          
        });
        // Redirect to the admin page
        res.redirect('/admin');
          } else {
            console.log("checkout.js: Error removing site");
          }
        }
  } catch (err) {
    console.error("Error during database query:", err);
    return res.status(500).send("Internal Server Error");
  }
}


module.exports = router;