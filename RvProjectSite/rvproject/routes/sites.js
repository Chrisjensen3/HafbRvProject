var express = require("express");
var router = express.Router();
var dbCon = require("../lib/database");
const { each } = require("jquery");

/* GET sites page. */
router.get("/", function (req, res, next) {
  console.log("sites.js: GET");
    getItemsInCart(req, res, false);
});

/* POST sites page. */
router.post("/", function (req, res, next) {
  console.log("sites.js: POST");
  getItemsInCart(req, res, true);
});

//create function that gets items in cart from the form (showSites is false if search has NOT been clicked)
function getItemsInCart(req, res, showSites) {
  var newCartItem = [];
  console.log("sites.js: getting array of items in cart from the form");
  // Get array of items in cart from the form 
  if (req.body.cartItems && req.body.cartItems.trim() !== "") {
    newCartItem = JSON.parse(req.body.cartItems)[0];
    console.log("sites.js: itemsInCart: " + newCartItem);
    console.log(newCartItem);

    // If there's a session cart and the item is already in the cart
    if(req.session.itemsInCart && isSiteInCart(newCartItem.siteId, req.session.itemsInCart)) {
      console.log('Site already in cart');
      return res.status(400).send('This site is already in your cart.');
    }
    console.log('Site not in cart');
    // Update the site status for the site added to the cart
    let sql = "CALL addToCart(?)";
    dbCon.query(
      sql,
      [newCartItem.siteId],
      function (err, results, fields) {
        if (err) {
          console.log(err.message);
          throw err;
        } else {
          console.log("Added to cart - site status updated to siteInCart");
        // Save the session variables
        // Append the new items to the existing items in the cart
        req.session.itemsInCart = req.session.itemsInCart || [];
        req.session.itemsInCart.push(newCartItem);
        req.session.cartTotal = req.session.cartTotal || 0;
        req.session.cartTotal = parseFloat(req.session.cartTotal) + parseFloat(newCartItem.subtotal);

        req.session.save(function (err) {
          if (err) {
            throw err;
          }
          console.log(
            "sites.js: Successful getting items in cart, itemsInCart session field is: " +
              req.session.itemsInCart
          );
          renderSitesPage(req, res, showSites);      
        });
      }
    });
  } else {
    // No items in cart, just render the sites page
    renderSitesPage(req, res, showSites);
  }
}

function renderSitesPage(req, res, showSites) {
  var siteTypes = [];
  
  // For site type cards that appear for general information on the sites page (excluding host site)
  dbCon.query("CALL getSiteTypes()", function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      for (var i = 0; i < results[0].length - 1; i++) {
        var type = results[0][i];
        siteTypes.push({
          siteTypeId: type.siteTypeId,
          siteType: type.siteType,
          siteImage: type.siteTypeImage,
          siteDescription: type.siteDescription,
          siteRate: type.siteRate,
        });
       
      }
      // POST has occurred, render the available sites from search criteria and pass any existing items in cart
      if (showSites) {
        console.log("sites.js: POST has occurred: render available sites");
        renderAvailableSites(req, res, siteTypes);
      } else {
        console.log("sites.js: GET has occurred: render site types");
        // GET has occurred, render the site types and pass siteTypes and items in cart
        // Passing searchClicked false which means availableSites will not be displayed
        res.render("sites", {
          siteTypes: siteTypes,
          searchClicked : false,
          reservationsInCart: req.session.reservationsInCart,
        });
      }
    }
  });

  // POST has occurred, render the available sites and pass siteTypes and items in cart
  function renderAvailableSites(req, res, siteTypes) {
    // Get the available sites for the selected site type
    const checkin = req.body.checkin;
    const checkout = req.body.checkout;
    var checkIn = new Date(req.body.checkin);
    var checkOut = new Date(req.body.checkout);
    var timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
    var numDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    var siteTypeId = req.body.siteClassOptions;
    var rvLength = req.body.rvLength;

    //if rvLength is > 46, set siteType to "2" for Premium site since they won't fit in a regular site
    if (rvLength > 46) {
      console.log("rvLength > 46");
      siteTypeId = 2;
    }

    //Log the values
    console.log("checkin: " + checkin);
    console.log("checkout: " + checkout);
    console.log("siteType: " + siteTypeId);
    console.log("rvLength: " + rvLength);
    console.log("numDays: " + numDays);

    // If rvLength is "", set it to null
    if (rvLength == "") {
      rvLength = null;
      console.log("rvLength is null" + rvLength);
    }
    let availableSites = [];
    dbCon.query(
      "CALL getAvailableSites(?, ?, ?, ?)",
      [checkin, checkout, siteTypeId, rvLength],
      function (err, results, fields) {
        if (err) {
          console.log(err.message);
          throw err;
        } else {
          for (var i = 0; i < results[0].length; i++) {
            var site = results[0][i];
            availableSites.push({
              siteId: site.siteId,
              siteName: site.siteName,
              siteType: site.siteType,
              siteImage: site.siteTypeImage,
              siteDescription: site.siteDescription,
              siteRate: site.siteRate,
            });
          }
          console.log("sites.js: After search function is called");
          console.log("sites.js: availableSites: " + JSON.stringify(availableSites));

          // Render the sites page and pass the availableSites array
          res.render("sites", {
            availableSites: availableSites,
            siteType: siteTypes,
            checkin: checkin,
            checkout: checkout,
            numDays: numDays,
            searchClicked : true,
            rvLength: rvLength,
            siteTypeId: siteTypeId,
          });
        }
      }
    );
  }
}

function isSiteInCart(siteId, cartItems) {
  return cartItems.some(function(item) {
    return item.siteId === siteId;
  });
}

module.exports = router;
