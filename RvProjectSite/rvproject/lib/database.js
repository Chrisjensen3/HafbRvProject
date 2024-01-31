let mysql = require("mysql2");
//const { dateStrings } = require("./connectioninfo");

var dbConnectionInfo = require("../connectioninfo");

var con = mysql.createConnection({
  host: dbConnectionInfo.host,
  user: dbConnectionInfo.user,
  password: dbConnectionInfo.password,
  port: dbConnectionInfo.port,
  multipleStatements: true, // Needed for stored proecures with OUT results
  dateStrings: true,
});

con.connect(function (err) {
  if (err) {
    throw err;
  } else {
    console.log("database.js: Connected to server!");

    con.query(
      "DROP DATABASE IF EXISTS rv_system;\n" + "CREATE DATABASE rv_system",
      function (err, result) {
        if (err) {
          console.log(err.message);
          throw err;
        }
        console.log(
          "database.js: rv_system database created if it didn't exist"
        );
        selectDatabase();
      }
    );
  }
});

function selectDatabase() {
  let sql = "USE rv_system";
  console.log(sql);
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: Selected rv_system database");
      createTables();
      createStoredProcedures();
      addTableData();
      addDummyDataToDatabase();
      //testAddtoCart();
    }
  });
}

function createTables() {
  // Create User Type Table - Easton
  let sql =
    "CREATE TABLE IF NOT EXISTS userType (\n" +
    "userTypeId INT NOT NULL AUTO_INCREMENT, \n" +
    "userType VARCHAR(45) NOT NULL,\n" +
    "PRIMARY KEY (userTypeId)\n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("database.js: userType table created if it didn't exist");
  });

  // Create User Table - Easton
  sql =
    "CREATE TABLE IF NOT EXISTS user (\n" +
    "userId INT NOT NULL AUTO_INCREMENT, \n" +
    "userFirstName VARCHAR(45) NOT NULL, \n" +
    "userLastName VARCHAR(45) NOT NULL, \n" +
    "userEmail VARCHAR(100) NOT NULL, \n" +
    "userServiceBranch VARCHAR(45) NOT NULL, \n" +
    "userStatus VARCHAR(45) NOT NULL, \n" +
    "salt VARCHAR(255) NOT NULL, \n" +
    "hashedPassword VARCHAR(255) NOT NULL, \n" +
    "userTypeId INT NOT NULL, \n" +
    "userPhone VARCHAR(15) NOT NULL, \n" +
    "PRIMARY KEY (userId),\n" +
    "FOREIGN KEY (userTypeId) REFERENCES userType(userTypeId) \n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: user table created if it didn't exist");
    }
  });

  // Create SiteType Table
  sql =
    "CREATE TABLE IF NOT EXISTS siteType (\n" +
    "siteTypeId INT NOT NULL AUTO_INCREMENT, \n" +
    "siteType VARCHAR(255) NOT NULL,\n" +
    "siteTypeImage VARCHAR(255) NOT NULL,\n" +
    "siteDescription VARCHAR(1000) NOT NULL,\n" +
    "siteRate DECIMAL(10,2) NOT NULL,\n" +
    "PRIMARY KEY (siteTypeId)\n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: siteType table created if it didn't exist");
    }
  });

  // Create Site Table
  sql =
    "CREATE TABLE IF NOT EXISTS site (\n" +
    "siteId INT NOT NULL AUTO_INCREMENT, \n" +
    "siteName VARCHAR(45) NOT NULL,\n" +
    "maxTrailerLength INT,\n" +
    "siteInCart BIT(1) NOT NULL DEFAULT 0,\n" +
    "siteTypeId INT NOT NULL,\n" +
    "PRIMARY KEY (siteId),\n" +
    "FOREIGN KEY (siteTypeId) REFERENCES siteType(siteTypeId)\n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: site table created if it didn't exist");
    }
  });

  // Create Reservation Table - Easton
  sql =
    "CREATE TABLE IF NOT EXISTS reservation (\n" +
    "resId INT NOT NULL AUTO_INCREMENT, \n" +
    "checkIn DATE NOT NULL,\n" +
    "checkOut DATE NOT NULL,\n" +
    "trailerLength INT,\n" +
    "comment LONGTEXT,\n" +
    "status VARCHAR(45) NOT NULL,\n" +
    "estArrivalTime TIME,\n" +
    "userId INT NOT NULL,\n" +
    "siteId INT NOT NULL,\n" +
    "PRIMARY KEY (resId),\n" +
    "FOREIGN KEY (userId) REFERENCES user(userId),\n" +
    "FOREIGN KEY (siteId) REFERENCES site(siteId)\n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: reservation table created if it didn't exist");
    }
  });

  // Create Transaction Table
  // trxTotal set as nullable for now - once trx items are added, calculation will be done
  // trxType set as nullable - type is determined when reservation updates are made
  // resId set as nullable - will be added after checkout
  // confirmationId set as nullable for now - will be added after checkout
  sql =
    "CREATE TABLE IF NOT EXISTS transaction (\n" +
    "trxId INT NOT NULL AUTO_INCREMENT, \n" +
    "trxDate DATE NOT NULL,\n" +
    "trxTotal DECIMAL(10,2),\n" +
    "trxDescription VARCHAR(255),\n" +
    "trxType VARCHAR(45),\n" +
    "trxConfirmationId VARCHAR(255),\n" +
    "resId INT,\n" +
    "PRIMARY KEY (trxId),\n" +
    "FOREIGN KEY (resId) REFERENCES reservation(resId)\n" +
    ")";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: transaction table created if it didn't exist");
    }
  });

  // Create TransactionItem Table
  sql =
    "CREATE TABLE IF NOT EXISTS transactionItem (\n" +
    "trxItemId INT NOT NULL AUTO_INCREMENT, \n" +
    "trxItemAmount DECIMAL(10,2) NOT NULL,\n" +
    "trxItemQty INT NOT NULL, \n" +
    "trxItemDescr VARCHAR(255) NOT NULL,\n" +
    "trxId INT NOT NULL,\n" +
    "PRIMARY KEY (trxItemId),\n" +
    "FOREIGN KEY (trxId) REFERENCES transaction(trxId)\n" +
    ")";

  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: invoice item table created if it didn't exist");
    }
  });

}

function createStoredProcedures() {
  console.log("database.js: createStoredProcedures() function called");
  let sql = "";
  // Create Procedures (login & register procedures) - Jon

  sql =
    "CREATE PROCEDURE IF NOT EXISTS `registerUser`(\n" +
    "IN firstName VARCHAR(255), \n" +
    "IN lastName VARCHAR(255), \n" +
    "IN email VARCHAR(255), \n" +
    "IN serviceBranch VARCHAR(255), \n" +
    "IN serviceStatus VARCHAR(255), \n" +
    "IN salt VARCHAR(255), \n" +
    "IN hashed_password VARCHAR(255), \n" +
    "IN user_type INT, \n" +
    "IN phone VARCHAR(255), \n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "DECLARE nCount INT DEFAULT 0;\n" +
    "SET result = 0;\n" +
    "SELECT Count(*) INTO nCount FROM user WHERE user.userEmail = email;\n" +
    "IF nCount = 0 THEN\n" +
    "INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)\n" +
    "VALUES(firstName, lastName, email, serviceBranch, serviceStatus, salt, hashed_password, user_type, phone);\n" +
    "ELSE\n" +
    "SET result = 1;\n" +
    "END IF;\n" +
    "END;";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure registerUser created if it didn't exist"
      );
    }
  });

  // Create Procedures (checkout procedures) - Easton
  //Easton addToCart - set siteInCart to 1 for site added
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addToCart`(\n" +
    "IN selectedSiteId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "UPDATE site SET siteInCart = 1 WHERE site.siteId = selectedSiteId;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure addToCart created if it didn't exist"
      );
    }
  });

  //Easton removeFromCart - set siteInCart to 0 for site removed
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `removeFromCart`(\n" +
    "IN selectedSiteId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "UPDATE site SET siteInCart = 0 WHERE site.siteId = selectedSiteId;\n" +
    "SET result = 1;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure removeFromCart created if it didn't exist"
      );
    }
  });

  // Easton addTransaction

  sql = 
    "CREATE PROCEDURE IF NOT EXISTS `addTransaction`(\n" +
    "IN total DECIMAL(10,2),\n" +
    "IN description VARCHAR(255),\n" +
    "IN type VARCHAR(45),\n" +
    "IN confirmationNum VARCHAR(255),\n" +
    "IN newResId VARCHAR(255),\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "DECLARE today DATE;\n" + 
    "SET today = CURDATE();\n" +  
    "INSERT INTO transaction (trxDate, trxTotal, trxDescription, trxType, trxConfirmationId, resId)\n" +  
    "VALUES(today, total, description, type, confirmationNum, newResId);\n" +
    "SET result = LAST_INSERT_ID();\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("database.js: procedure addTransaction created if it didn't exist");
  });


  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addTransactionItem`(\n" +
    "IN amount DECIMAL(10,2),\n" +
    "IN qty INT,\n" +
    "IN description VARCHAR(255),\n" +
    "IN newTrxId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "INSERT INTO transactionItem (trxItemAmount, trxItemQty, trxItemDescr, trxId)\n" +
    "VALUES (amount, qty, description, newTrxId);\n" +
    "SET result = LAST_INSERT_ID();\n" +
    "END";      
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("database.js: procedure addTransaction created if it didn't exist");
  });

  // Create Procedures (reservation procedures) - Chris
  // Create a procedure to get all reservations with user and site details for a specific user
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getReservations`(\n" +
    "IN selectedUserId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT r.resId, r.checkIn, r.checkOut, r.comment, r.status, r.userId, r.siteId, trailerLength, u.userFirstName, u.userLastName, u.userEmail, u.userTypeId, u.userPhone, s.siteName, st.siteTypeId, st.siteType, st.siteDescription, st.siteRate\n" +
    "FROM (\n" +
    "SELECT resId\n" +
    "FROM reservation\n" +
    "WHERE reservation.userId = selectedUserId\n" +
    ") AS subq\n" +
    "INNER JOIN reservation AS r ON r.resId = subq.resId\n" +
    "LEFT JOIN user AS u ON u.userId = r.userId\n" +
    "LEFT JOIN site AS s ON s.siteId = r.siteId\n" +
    "LEFT JOIN siteType AS st ON st.siteTypeId = s.siteTypeId\n" +
    "GROUP BY r.resId\n" +
    "ORDER BY r.checkIn;\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getReservations created if it didn't exist"
      );
    }
  });

   // Create a procedure to get all reservations for a specific user
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getReservationCheckout`(\n" +
    "IN selectedUserId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT * FROM reservation WHERE reservation.userId = selectedUserId;\n " +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getReservationCheckout created if it didn't exist"
      );
    }
  });
 // Create a procedure to setReservationStatus
  sql =
  "CREATE PROCEDURE IF NOT EXISTS `setReservationStatus`(\n" +
  "IN reservationId INT,\n" +
  "IN status VARCHAR(255)\n" +
  ")\n" +
  "BEGIN\n" +
  "UPDATE reservation\n" + 
  "SET reservation.status = status\n" +
  "WHERE resId = reservationId;\n" +
  "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setReservationStatus created if it didn't exist"
      );
    }
  });

  //EASTON - getReservationsForCart procedure - gets all reservations that are in-process for the cart for a specific user
  // Create a procedure to get all reservations that are in-process for the cart for a specific user
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getReservationsForCart`(\n" +
    "IN selectedUserId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT r.resId, r.checkIn, r.checkOut, r.comment, r.status, r.userId, r.siteId, trailerLength, u.userFirstName, u.userLastName, u.userEmail, u.userTypeId, u.userPhone, s.siteName, st.siteTypeId, st.siteType, st.siteDescription, st.siteRate\n" +
    "FROM (\n" +
    "SELECT resId\n" +
    "FROM reservation\n" +
    "WHERE reservation.userId = selectedUserId\n" +
    ") AS subq\n" +
    "INNER JOIN reservation AS r ON r.resId = subq.resId\n" +
    "LEFT JOIN user AS u ON u.userId = r.userId\n" +
    "LEFT JOIN site AS s ON s.siteId = r.siteId\n" +
    "LEFT JOIN siteType AS st ON st.siteTypeId = s.siteTypeId\n" +
    "WHERE r.status = 'In-Process'\n" +
    "GROUP BY r.resId\n" +
    "ORDER BY r.checkIn;\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getReservationsForCart created if it didn't exist"
      );
    }
  });
  //used to get the cart total
  // get the total price where the reservation status is in-process
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getCheckoutTotal`(\n" +
    "IN selectedUserId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT SUM(site.siteRate * DATEDIFF(reservation.checkOut, reservation.checkIn)) AS totalPrice\n" +
    "FROM reservation\n" +
    "INNER JOIN site ON site.siteId = reservation.siteId\n" +
    "WHERE reservation.status = 'In-Process' AND reservation.userId = selectedUserId;\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log(
      "database.js: procedure getCheckoutTotal created if it didn't exist"
    );
  });


  // Create Procedure getReservation - accepts input parameter resId
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getReservation`(\n" +
    "IN resId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT reservation.*, site.*, user.*, siteType.*, transaction.*, transactionItem.*\n" +
    "FROM reservation\n" +
    "LEFT JOIN user ON user.userId = reservation.userId\n" +
    "LEFT JOIN transaction ON transaction.resId = reservation.resId\n" +
    "LEFT JOIN transactionItem ON transactionItem.trxId = transaction.trxId\n" +
    "LEFT JOIN site ON site.siteId = reservation.siteId\n" +
    "LEFT JOIN siteType ON siteType.siteTypeId = site.siteTypeId\n" +
    "WHERE reservation.resId = resId;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getReservation created if it didn't exist"
      );
    }
  });

  // Create a procedure to get transaction for a specific reservation
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getTransaction`(\n" +
    "IN selectedResId INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT r.*, s.*, st.*, u.*, t.*, ti.*\n" +
    "FROM (\n" +
    "SELECT resId\n" +
    "FROM reservation AS r\n" +
    "WHERE r.resId = selectedResId\n" +
    ") AS subq\n" +
    "INNER JOIN reservation AS r ON r.resId = subq.resId\n" +
    "INNER JOIN user AS u ON u.userId = r.userId\n" +
    "INNER JOIN site AS s ON s.siteId = r.siteId\n" +
    "INNER JOIN siteType AS st ON st.siteTypeId = s.siteTypeId\n" +
    "INNER JOIN transaction AS t ON t.resId = r.resId\n" +
    "INNER JOIN transactionItem AS ti ON ti.trxId = t.trxId\n" +
    "ORDER BY ti.trxItemDescr;\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getTransaction created if it didn't exist"
      );
    }
  });
   
  // Create a procedure to check for overlapping reservations for a specific site and date span
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `checkOverlappingReservations`(\n" +
    "IN existingResId INT,\n" +
    "IN existingSiteId INT,\n" +
    "IN newCheckIn DATE,\n" +
    "IN newCheckOut DATE,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SET result = (\n" +
    "SELECT COUNT(*)\n" +
    "FROM reservation\n" +
    "INNER JOIN site ON site.siteId = reservation.siteId\n" +
    "WHERE reservation.siteId = existingSiteId\n" +
    "AND site.siteInCart = 0\n" +
    "AND reservation.resId <> existingResId\n" +
    "AND (\n" +
    "(newCheckIn BETWEEN reservation.checkIn AND reservation.checkOut)\n" +
    "OR (newCheckOut BETWEEN reservation.checkIn AND reservation.checkOut)\n" +
    "OR (reservation.checkIn BETWEEN newCheckIn AND newCheckOut)\n" +
    "OR (reservation.checkOut BETWEEN newCheckIn AND newCheckOut)\n" +
    ")\n" +
    ");\n" +
    "END";

    con.query(sql, function (err, results, fields) {
      if (err) {
        console.log(err.message);
        throw err;
      } else {
        console.log(
          "database.js: procedure checkSiteAndUpdate created if it didn't exist"
        );
      }
    });

  // Checks if reservation is active
  sql =
    "CREATE PROCEDURE `checkCurrentReservation`(\n" +
    "IN existingResId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "DECLARE reservationCount INT;\n" +
    "SELECT COUNT(*) INTO reservationCount\n" +
    "FROM reservation\n" +
    "WHERE resId = existingResId\n" +
    "AND checkIn < CURDATE() AND checkOut > CURDATE();\n" +
    "SET result = reservationCount;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure checkCurrentReservation created if it didn't exist"
      );
    }
  });

  // Create a procedure to cancel a reservation - calculates cancellation fees and creates the Refund
  sql =
    "CREATE PROCEDURE `cancelReservation`(\n" +
    "IN existingResId INT,\n" +
    "IN existingSiteId INT,\n" +
    "IN daysBeforeCheckIn INT,\n" +
    "IN siteRate DECIMAL(10,2),\n" +
    "IN daysInReservation INT,\n" +
    "IN confirmId VARCHAR(255),\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SET result = 0;\n" +
    "IF daysBeforeCheckIn >=0 THEN\n" +
    "INSERT INTO transaction(trxDate, trxTotal, trxDescription, trxType, trxConfirmationId, resId)\n" +
    "VALUES (CURDATE(), 0, 'Refund for canceled reservation', 'Refund', null, existingResId);\n" +
    "SET @transactionId = LAST_INSERT_ID();\n" +
    "INSERT INTO transactionItem(trxItemAmount, trxItemQty, trxItemDescr, trxId)\n" +
    "VALUES (siteRate, daysInReservation, 'Refund for canceled reservation', @transactionId);\n" +
    "UPDATE transaction SET trxTotal = (trxTotal + (siteRate * daysInReservation)) WHERE trxId = @transactionId;\n" +
    // If canceling 3 or more days before their stay
    "IF daysBeforeCheckIn >= 3 THEN\n" +
    "INSERT INTO transactionItem(trxItemAmount, trxItemQty, trxItemDescr, trxId)\n" +
    "VALUES (10.00, 1, 'Cancel Fee: 3 days or more before reservation', @transactionId);\n" +
    "UPDATE transaction SET trxTotal = (trxTotal + 10.00) WHERE trxId = @transactionId;\n" +
    // If canceling 0-2 days before their stay    
    "ELSEIF daysBeforeCheckIn >= 0 AND daysBeforeCheckIn < 3 THEN\n" +
    "INSERT INTO transactionItem(trxItemAmount, trxItemQty, trxItemDescr, trxId)\n" +
    "VALUES (siteRate, 1, 'Cancel Fee: less than 3 days prior', @transactionId);\n" +
    "UPDATE transaction SET trxTotal = (trxTotal + siteRate) WHERE trxId = @transactionId;\n" +
    "END IF;\n" +
    // Update reservation status
    "UPDATE reservation SET status = 'Canceled' WHERE reservation.resId = existingResId;\n" +
    // Update transaction confirm Id
    "UPDATE transaction SET trxConfirmationId = confirmId WHERE trxId = @transactionId;\n" +
    "SET result = @transactionId;\n" +
    "END IF;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure cancelReservation created if it didn't exist"
      );
    }
  });

  // Create a procedure to get the new invoice information for a canceled or updated reservation
  sql =
    "CREATE PROCEDURE `getInvoiceInfo`(\n" +
    "IN existingResId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT t.*, ti.*, u.*, r.* FROM transaction t INNER JOIN transactionItem tt ON t.trxId = ti.trxId INNER JOIN reservation r ON r.resId = t.resId INNER JOIN user u ON u.userId = r.userId WHERE resId = existingResId;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getInvoiceInfo created if it didn't exist"
      );
    }
  });

  // Create Procedures (admin & site procedures) - Traci

  // Create Procedure addUserType
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addUserType`(\n" +
    "IN type VARCHAR(45)\n" +
    ")\n" +
    "BEGIN\n" +
    "INSERT INTO userType (userType)\n" +
    "VALUES (type);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure addUserType created if it didn't exist"
      );
    }
  });

  // Create Procedure addUser
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addUser`(\n" +
    "IN first VARCHAR(45),\n" +
    "IN last VARCHAR(45),\n" +
    "IN email VARCHAR(100),\n" +
    "IN branch VARCHAR(45),\n" +
    "IN status VARCHAR(45),\n" +
    "IN salt VARCHAR(255),\n" +
    "IN password VARCHAR(255),\n" +
    "IN typeId INT,\n" +
    "IN phone VARCHAR(15),\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "DECLARE nCount INT DEFAULT 0;\n" +
    "SET result = 0;\n" +
    "SELECT Count(*) INTO nCount FROM user WHERE userEmail = email;\n" +
    "IF nCount = 0 THEN\n" +
    "INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)\n" +
    "VALUES (first, last, email, branch, status, salt, password, typeId, phone);\n" +
    "ELSE\n" +
    "SET result = 1;\n" +
    "END IF;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: procedure addUser created if it didn't exist");
    }
  });

  // Create Procedure getUserType
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getUserType`(\n" +
    "IN userid INT\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT userType\n" +
    "FROM userType\n" +
    "INNER JOIN user ON user.userTypeId = userType.userTypeId\n" +
    "WHERE user.userId = userid LIMIT 1;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getUserType created if it didn't exist"
      );
    }
  });

  // Create Procedure addSiteType
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addSiteType`(\n" +
    "IN type VARCHAR(45),\n" +
    "IN description VARCHAR(255),\n" +
    "IN rate DECIMAL(10,2)\n" +
    ")\n" +
    "BEGIN\n" +
    "INSERT INTO siteType (siteType, siteDescription, siteRate)\n" +
    "VALUES (type, description, rate);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure addSiteType created if it didn't exist"
      );
    }
  });

  // Create Procedure addSite
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addSite`(\n" +
    "IN name VARCHAR(45),\n" +
    "IN maxLength INT,\n" +
    "IN typeId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "DECLARE existingSite VARCHAR(45);\n" +
    "SELECT existingSite = (SELECT siteName FROM site WHERE siteName = name);\n" +
    "IF existingSite IS NULL THEN\n" +
    "INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)\n" +
    "VALUES (name, maxLength, 0, typeId);\n" +
    "SET result = 1;\n" +
    "ELSE\n" +
    "SET result = 0;\n" +
    "END IF;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("database.js: procedure addSite created if it didn't exist");
    }
  });

  // Create Procedure addReservation (added when user checks out)
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `addReservation`(\n" +
    "IN  checkin DATE,\n" +
    "IN  checkout DATE,\n" +
    "IN  length INT,\n" +
    "IN  comments LONGTEXT,\n" +
    "IN  resStatus VARCHAR(45),\n" + 
    "IN  arrival TIME,\n" +
    "IN  resUserId INT,\n" +
    "IN  resSiteId INT,\n" +
    "OUT result INT\n" +
    ")\n" +
    "BEGIN\n" +
    "INSERT INTO reservation (checkIn, checkOut, trailerLength, comment, status, estArrivalTime, userId, siteId)\n" +
    "VALUES (checkin, checkout, length, comments, resStatus, arrival, resUserId, resSiteId);\n" +
    "SET result = LAST_INSERT_ID();\n" + 
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure addReservation created if it didn't exist"
      );
    }
  });

  // Create Procedure getAllSites (to display on main site page)
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getAllSites`()\n" +
    "BEGIN\n" +
    "SELECT *\n" +
    "FROM site\n" +
    "LEFT JOIN sitetype ON sitetype.siteTypeId = site.siteTypeId\n" +
    "ORDER BY\n" +
    "CASE\n" +
    "WHEN site.siteName REGEXP '^[0-9]'\n" +
    "THEN CAST(site.siteName AS UNSIGNED)\n" +
    "ELSE 9999\n" +
    "END,\n" +
    "site.siteName;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getAllSites created if it didn't exist"
      );
    }
  });

  // Create Procedure getAvailableSites that checks for available sites based on input parameters
  sql =
    "CREATE PROCEDURE getAvailableSites(\n" +
    "  IN p_checkIn DATE,\n" +
    "  IN p_checkOut DATE,\n" +
    "  IN p_siteTypeId VARCHAR(255),\n" +
    "  IN p_length INT\n" +
    ")\n" +
    "BEGIN\n" +
    "  SELECT s.siteId, s.siteName, st.siteType, st.siteDescription, st.siteRate, st.siteTypeImage\n" +
    "  FROM site s\n" +
    "  JOIN siteType st ON s.siteTypeId = st.siteTypeId\n" +
    "  WHERE s.siteTypeId = p_siteTypeId\n" +
    "    AND s.siteInCart = 0\n" +
    "    AND (p_length IS NULL OR s.maxTrailerLength >= p_length)\n" +
    "    AND s.siteInCart = 0\n" +
    "    AND NOT EXISTS (\n" +
    "      SELECT 1\n" +
    "      FROM Reservation r\n" +
    "      WHERE r.siteId = s.siteId\n" +
    "        AND (\n" +
    "          (p_checkIn >= r.checkIn AND p_checkIn < r.checkOut)\n" +
    "          OR (p_checkOut > r.checkIn AND p_checkOut <= r.checkOut)\n" +
    "          OR (p_checkIn < r.checkIn AND p_checkOut > r.checkOut)\n" +
    "        )\n" +
    "    );\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getAvailableSites created if it didn't exist"
      );
    }
  });

  // Create Procedure adminGetReservations - accepts input parameter of date
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `adminGetReservations`(\n" +
    "IN dateParam DATE\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT reservation.resId, reservation.*, user.*, site.*, sitetype.*, maxTrx.maxTrxId\n" +
    "FROM (\n" +
    "    SELECT resId, MAX(trxId) as maxTrxId\n" +
    "    FROM transaction\n" +
    "    GROUP BY resId\n" +
    ") as maxTrx\n" +
    "INNER JOIN reservation ON reservation.resId = maxTrx.resId\n" +
    "LEFT JOIN user ON user.userId = reservation.userId\n" +
    "LEFT JOIN site ON site.siteId = reservation.siteId\n" +
    "LEFT JOIN sitetype ON sitetype.siteTypeId = site.siteTypeId\n" +
    "WHERE (reservation.checkIn >= dateParam OR reservation.checkOut >= dateParam)\n" +
    "AND reservation.status NOT IN ('Canceled', 'Cancelled')\n" +
    "ORDER BY reservation.checkIn;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure adminGetReservations created if it didn't exist"
      );
    }
  });

  // Create Procedure adminGetAvailableSites - accepts input parameter of date
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `adminGetAvailableSites`(\n" +
    "IN date DATE\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT site.*, siteType.*, \n" +
    "(SELECT MIN(reservation.checkIn)\n" +
    "FROM reservation\n" +
    "WHERE reservation.siteId = site.siteId AND reservation.checkIn > date) AS nextCheckinDate\n" +
    "FROM site\n" +
    "LEFT JOIN siteType ON siteType.siteTypeId = site.siteTypeId\n" +
    "WHERE site.siteId NOT IN (\n" +
    "SELECT reservation.siteId FROM reservation\n" +
    "WHERE date BETWEEN reservation.checkIn AND reservation.checkOut - INTERVAL 1 DAY\n" +
    ")\n" +
    "AND site.siteInCart != 1\n" +
    "ORDER BY\n" +
    "CASE\n" +
    "WHEN site.siteName REGEXP '^[0-9]'\n" +
    "THEN CAST(site.siteName AS UNSIGNED)\n" +
    "ELSE 9999\n" +
    "END,\n" +
    "site.siteName;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure adminGetAvailableSites created if it didn't exist"
      );
    }
  });

  // Create Procedure getSalt
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `getSalt`(\n" +
    "IN email VARCHAR(255)\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT salt FROM user\n" +
    "WHERE user.userEmail = email\n" +
    "LIMIT 1;\n" +
    "END;";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure 'getSalt' created if it didn't exist"
      );
    }
  });

  // Create Procedure checkCredentials
  sql =
    // WHERE clause suffers from man-in-the middle attacks. We would need a certificate for SSL TLS connections
    "CREATE PROCEDURE IF NOT EXISTS `checkCredentials`(\n" +
    "IN email VARCHAR(255),\n" +
    "IN hashPassword VARCHAR(255)\n" +
    ")\n" +
    "BEGIN\n" +
    "SELECT EXISTS(\n" +
    "SELECT * FROM user\n" +
    "WHERE user.userEmail = email AND user.hashedPassword = hashPassword\n" +
    ") AS result;\n" +
    "END;";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure 'checkCredentials' created if it didn't exist"
      );
    }
  });
}

function addTableData() {
  console.log("addTableData() function called");

  // ----------------------- Add Data to siteType Table ------------------------------
  // Create Procedure setupSiteType (Host site type added for internal admin use only)
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `setupSiteType`()\n" +
    "BEGIN\n" +
    "INSERT INTO siteType (siteType, siteTypeImage, siteDescription, siteRate)\n" +
    "VALUES\n" +
    "('Standard Back-In Site', 'images/backin.jpg', 'Asphault base fits up to 46 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers.Has 30 Amp/50 Amp electrical as well as water and sewer hookups. Limited free Wifi also available.', 35.00),\n" +
    "('Premium Pull-Through Site', 'images/premium.jpg', 'Concrete base fits up to 60 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers. Has 30 Amp/50 Amp electrical as well as water and sewer hookups. Limited free Wifi also available.', 40.00),\n" +
    "('Dry Site', 'images/drysite.jpg', 'Gravel base fits up to 50 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers. No electrical, water, or sewer hookups. Limited free Wifi available.', 20.00),\n" +
    "('Trailer Rental Site', 'images/rental.jpg', 'Trailer Rental site has electrical and water hookups, but no sewer. Limited free Wifi available.', 50.00),\n" +
    "('Tent Site', 'images/tent.jpg', 'Accommodates a family-size tent (up to 6 people). Includes a picnic table and fire ring.', 20.00),\n" +
    "('Host Site', 'images/host.jpg', 'Host site has electrical, water, and sewer hookups. Free for host employees.', 0.00);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupSiteType created if it didn't exist"
      );
    }
  });

  sql = "CALL `setupSiteType`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupSiteType called to add data to siteType table"
      );
    }
  });

  // Create Procedure getSiteTypes
  sql =
    "CREATE PROCEDURE `getSiteTypes`()\n" +
    "BEGIN\n" +
    "SELECT *\n" +
    "FROM siteType;\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure getSiteTypes created if it didn't exist"
      );
    }
  });

  // ------------------- Add Data to site Table -------------------
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `setupSite`()\n" +
    "BEGIN\n" +
    "DECLARE i INT DEFAULT 1;\n" +
    "DECLARE j INT DEFAULT 32;\n" +
    "DECLARE k CHAR(1) DEFAULT 'A';\n" +
    "WHILE i <= 31 DO\n" +
    "IF i != 15 AND i != 16 THEN\n" +
    "INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)\n" +
    "VALUES\n" +
    "(CAST(i AS CHAR), 46, 0, 1);\n" +
    "END IF;\n" +
    "SET i = i + 1;\n" +
    "END WHILE;\n" +
    "WHILE j <= 45 DO\n" +
    "INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)\n" +
    "VALUES\n" +
    "(CAST(j AS CHAR), 60, 0, 2);\n" +
    "SET j = j + 1;\n" +
    "END WHILE;\n" +
    "WHILE k <= 'D' DO\n" +
    "INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)\n" +
    "VALUES\n" +
    "(k, 50, 0, 3);\n" +
    "SET k = CHAR(ASCII(k) + 1);\n" +
    "END WHILE;\n" +
    "INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)\n" +
    "VALUES\n" +
    "('11B', null, 0, 4),\n" +
    "('12B', null, 0, 4),\n" +
    "('TENT', null, 0, 5),\n" +
    "('HOST', null, 0, 6);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupSite created if it didn't exist"
      );
    }
  });

  sql = "CALL `setupSite`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupSite called to add data to site table"
      );
    }
  });

  // ----------------- Add Data to userType Table -----------------
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `setupUserType`()\n" +
    "BEGIN\n" +
    "INSERT INTO userType (userType)\n" +
    "VALUES\n" +
    "('Administrator'), ('Employee'), ('Customer');\n" +
    "END";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupUserType called to add data to site table"
      );
    }
  });

  sql = "CALL `setupUserType`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure setupUserType called to add data to userType table"
      );
    }
  });
}

function addDummyDataToDatabase() {
  // ------------------------------------- Add Users ---------------------------------------
  // Admin 'Sam Jones' registered with email 'samj@hafb.gov' and password 'sam'
  // Employee 'Bob Brown' registered with email 'bobb@hafb.gov' and password 'bob'
  // Customer 'Amy Adams' registered with email 'amya@gmail.com' and password 'amy'
  // Customer 'Chris Clark' registered with email 'chrisc@gmail.com' and password 'chris'
  // Customer 'Don Davis' registered with email 'dond@hafb.gov' and password 'don'
  // Customer 'Eve Edwards' registered with email 'evee@outlook.com' and password 'eve'
  // Customer 'Fred Franklin' registered with email 'fredf@gmail.com' and password 'fred'
  // Customer 'Gina Green' registered with email 'ginag@hafb.gov' and password 'gina'
  // Customer 'Hal Harris' registered with email 'halh@gmail.com' and password 'hal'
  // Customer 'Ivy Ingram' registered with email 'ivyi@gmail.com' and password 'ivy'
  // Customer 'Jen Jensen' registered with email 'jenj@gmail.com' and password 'jen'
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `seedUsers`()\n" +
    "BEGIN\n" +
    "INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)\n" +
    "VALUES\n" +
    "('Sam', 'Jones', 'samj@hafb.gov', 'Airforce', 'Active', '9068f69ec265d72f', '4b22bd39d3c3078b999c8336d4e77b6f2a1115433501fd0c06a68c85f6914255', 1, '801-589-1111'),\n" +
    "('Bob', 'Brown', 'bobb@hafb.gov', 'Airforce', 'Active', 'b0f241dad5a71191', 'c154cc2fb9d2c3a323e26742db9042c3705cad0ca1db5872b44bca2cb8fd24a3', 2, '801-589-1112'),\n" +
    "('Amy', 'Adams', 'amya@gmail.com', 'Army', 'Active', 'a3754ae0306fa4fd', 'd9c56161d5c8c7fc396665152519066fe3c359f1741a49baee5df64c729362db', 3, '801-589-1113'),\n" +
    "('Chris', 'Clark', 'chrisc@gmail.com', 'Airforce', 'Active', 'd2d7a7f11923b3c8', '9537974f13e0d488158a543f29cbbecb27283da4da8f81b582a5c6cb1bad649f', 3, '801-589-1114'),\n" +
    "('Don', 'Davis', 'dond.@hafb.gov', 'Airforce', 'Retired', '0ecaeb96980fd188', 'ffb92abbb2308fa4c1f31ec1d9e4911f4cc16eccfdfaa61f0f638c89b875092f', 3, '801-589-1115'),\n" +
    "('Eve', 'Edwards', 'evee@outlook.com', 'Navy', 'Active', '1ab68f2659283fcc', 'ba52e8324ff1e0a29024e515c7135f79c6b67945784d33a679f32e90e8397611', 3, '801-589-1116'),\n" +
    "('Fred', 'Franklin', 'fredf@gmail.com', 'Airforce', 'Active', '33b2adaf99f5265b', '4471770447a6108433f4f19a940483c760cb365e63666a9773fd5e07f7476d27', 3, '801-589-1117'),\n" +
    "('Gina', 'Green', 'ginag@hafb.gov', 'Airforce', 'Active', 'd654477f14b6c809', 'e2c9d75a802bebeb48e798d2c21770653e1c655c8d54cfe8e8eedf740125ff3a', 3, '801-589-1118'),\n" +
    "('Hal', 'Harris', 'halh@gmail.com', 'Marines', 'Retired', '8e844b354bb3b0f3', '81cba4e950e9ac4136a0070a52de7a9ac0380b6978a56cf0c02805aba17525cf', 3, '801-589-1119'),\n" +
    "('Ivy', 'Ingram', 'ivyi@gmail.com', 'Airforce', 'Active', '2bf307a5576aacce', '5760002ab6a5e52269ecf42a36e48783ec3ef14a74f051cf1818f23e0719fd54', 3, '801-589-1120'),\n" +
    "('Jen', 'Jensen', 'jenj@gmail.com', 'Airforce', 'Active', '9ea1fe9e7e75c901', 'f1ad27615ed5cb7fa848edac3353183e55f47c1dec4f97bd872ba1a886252728', 3, '801-589-1121');\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedUsers created if it didn't exist"
      );
    }
  });

  sql = "CALL `seedUsers`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedUsers called to add data to user table"
      );
    }
  });

  // ------------------------------ Add Reservations ---------------------------------
  // Adding with today's date and alternate datespans
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `seedReservations`()\n" +
    "BEGIN\n" +
    "INSERT INTO reservation (checkIn, checkOut, trailerLength, comment, status, estArrivalTime, userId, siteId)\n" +
    "VALUES\n" +
    "('2023-05-09', '2023-05-22', 60, 'Reservation refunded', 'Canceled', '08:00:00', 3, 30),\n" +
    "('2023-05-10', '2023-05-18', 46, null, 'Paid', '22:00:00', 4, 7),\n" +
    "('2023-05-12', '2023-05-25', 50, null, 'Paid', '11:30:00', 5, 45),\n" +
    "('2023-05-19', '2023-05-26', 52, null, 'Paid', '09:30:00', 6, 34),\n" +
    "('2023-05-13', '2023-05-16', 60, null, 'Paid', '20:00:00', 3, 40),\n" +
    "('2023-05-14', '2023-05-26', 46, null, 'Paid', '18:30:00', 7, 24),\n" +
    "('2023-05-15', '2023-05-28', 50, null, 'Paid', '13:00:00', 8, 47),\n" +
    "('2023-05-13', '2023-05-25', 46, null, 'Paid', '12:30:00', 9, 17),\n" +
    "('2023-05-17', '2023-05-29', 46, 'Customer has three concurrent reservations', 'Paid', '09:00:00', 10, 8),\n" +
    "('2023-05-17', '2023-05-29', 46, 'Second reservation for adjacent site', 'Paid', '09:00:00', 10, 9),\n" +
    "('2023-05-17', '2023-05-29', null, 'Third reservation for tent site', 'Paid', '09:00:00', 10, 50),\n" +
    "('2023-05-24', '2023-05-28', 60, null, 'Paid', '09:00:00', 9, 29),\n" +
    "('2023-05-22', '2023-05-31', 46, null, 'Paid', '23:00:00', 8, 6),\n" +
    "('2023-05-27', '2023-06-08', 50, null, 'Paid', '10:30:00', 7, 43),\n" +
    "('2023-05-25', '2023-06-08', 52, null, 'Paid', '09:30:00', 6, 33),\n" +
    "('2023-05-21', '2023-05-31', 60, null, 'Paid', '18:00:00', 5, 39),\n" +
    "('2023-05-28', '2023-06-09', 46, null, 'Paid', '12:30:00', 4, 23),\n" +
    "('2023-06-03', '2023-06-15', 50, null, 'Paid', '13:00:00', 3, 46),\n" +
    "('2023-05-26', '2023-06-02', 46, null, 'Paid', '08:30:00', 2, 16);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedReservations created if it didn't exist"
      );
    }
  });

  sql = "CALL `seedReservations`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedReservations called to add data to reservation table"
      );
    }
  });

  // siteRate: 1:35.00  2:40.00  3:20.00  4:50.00  5:20.00
  // siteId: 1-31 1 (1-29) 32-45 2 (30-43)  a-d 3 (44-47)  11b 12b 4 (48-49)  tent 5(51)
  // ------------------------------ Add Transactions ---------------------------------
  
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `seedTransactions`()\n" +
    "BEGIN\n" +
    "INSERT INTO transaction (trxDate, trxTotal, trxDescription, trxType, trxConfirmationId, resId)\n" +
    "VALUES\n" +
    "('2023-05-09', 520.00, 'Famcamp Stay - Peak Season', 'Invoice', '2487241300', 1),\n" +
    "('2023-05-10', 280.00, 'Famcamp Stay - Peak Season', 'Invoice', '4578640191', 2),\n" +
    "('2023-05-12', 260.00, 'Famcamp Stay - Peak Season', 'Invoice', '1112398763', 3),\n" +
    "('2023-05-10', 280.00, 'Famcamp Stay - Peak Season', 'Invoice', '3829211004', 4),\n" +
    "('2023-05-13', 120.00, 'Famcamp Stay - Peak Season', 'Invoice', '8537182906', 5),\n" +
    "('2023-05-09', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '6252349520', 6),\n" +
    "('2023-05-10', 260.00, 'Famcamp Stay - Peak Season', 'Invoice', '9834223791', 7),\n" +
    "('2023-05-12', 385.00, 'Famcamp Stay - Peak Season', 'Invoice', '2322497284', 8),\n" +
    "('2023-05-11', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '8862349872', 9),\n" +
    "('2023-05-24', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '9084103197', 10),\n" +
    "('2023-05-22', 240.00, 'Famcamp Stay - Peak Season', 'Invoice', '3017087428', 11),\n" +
    "('2023-05-28', 140.00, 'Famcamp Stay - Peak Season', 'Invoice', '0205163321', 12),\n" +
    "('2023-05-09', -510.00, 'Refund with cancellation fees', 'Invoice', '2165729409', 1),\n" +
    "('2023-05-25', 315.00, 'Famcamp Stay - Peak Season', 'Invoice', '1931091827', 13),\n" +
    "('2023-05-21', 480.00, 'Famcamp Stay - Peak Season', 'Invoice', '5616875485', 14),\n" +
    "('2023-05-28', 560.00, 'Famcamp Stay - Peak Season', 'Invoice', '2775270247', 15),\n" +
    "('2023-06-03', 400.00, 'Famcamp Stay - Peak Season', 'Invoice', '8582338688', 16),\n" +
    "('2023-05-26', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '5145879171', 17),\n" +
    "('2023-05-18', 240.00, 'Famcamp Stay - Peak Season', 'Invoice', '2165728930', 18),\n" +
    "('2023-05-18', 245.00, 'Famcamp Stay - Peak Season', 'Invoice', '1264578952', 19);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedTransactions created if it didn't exist"
      );
    }
  });

  sql = "CALL `seedTransactions`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedTransactions called to add data to transaction table"
      );
    }
  });

  // --------------------------- Add Transaction Items ------------------------------
  // Adding for Transactions in DB
  sql =
    "CREATE PROCEDURE IF NOT EXISTS `seedTransactionItems`()\n" +
    "BEGIN\n" +
    "INSERT INTO transactionItem (trxItemAmount, trxItemQty, trxItemDescr, trxId)\n" +
    "VALUES\n" +
    "(40.00, 13, 'Premium Pull-Through Site #32', 1),\n" +
    "(35.00, 8, 'Standard Back-In Site #7', 2),\n" +
    "(20.00, 13, 'Dry Site #B', 3),\n" +
    "(40.00, 7, 'Premium Pull-Through Site #36', 4),\n" +
    "(40.00, 3, 'Premium Pull-Through Site #42', 5),\n" +
    "(35.00, 12, 'Standard Back-In Site #26', 6),\n" +
    "(20.00, 13, 'Dry Site #D', 7),\n" +
    "(35.00, 11, 'Standard Back-In Site #19', 8),\n" +
    "(35.00, 12, 'Standard Back-In Site #8', 9),\n" +
    "(35.00, 12, 'Standard Back-In Site #9', 9),\n" +
    "(20.00, 12, 'Tent Site', 9),\n" +
    "(40.00, 4, 'Premium Pull-Through Site #32', 10),\n" +
    "(35.00, 9, 'Standard Back-In Site #7', 11),\n" +
    "(20.00, 12, 'Dry Site #B', 12),\n" +
    "(-40.00, 13, 'Site #32 - Refund', 13),\n" +
    "(10.00, 1, 'Cancellation Fee', 13),\n" +
    "(40.00, 14, 'Premium Pull-Through Site #36', 14),\n" +
    "(40.00, 10, 'Premium Pull-Through Site #42', 15),\n" +
    "(35.00, 12, 'Standard Back-In Site #26', 16),\n" +
    "(20.00, 12, 'Dry Site #D', 17),\n" +
    "(35.00, 7, 'Standard Back-In Site #19', 18);\n" +
    "END";

  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedTransactionItems created if it didn't exist"
      );
    }
  });

  sql = "CALL `seedTransactionItems`();";
  con.execute(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log(
        "database.js: procedure seedTransactionItems called to add data to transactionItems table"
      );
    }
    console.log("database.js: addDummyDataToDatabase() function finished");
  });
  console.log("database.js: Done");
}

function testAddtoCart() {
  // insert user into user table
  let sql =
    "INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)\n" +
    "VALUES ('Easton', 'Nye', 'enye@gmail.com', 'AirForce', 'Active', '798070193017590', '70421hj2017052910j', 3, '801-792-2772');";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
  });
  //call addToCart
  sql = "CALL addToCart(12, 26, '2023-08-26', '2023-08-28', 35)";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("addToCart: " + results);
  });

  sql = "CALL addToCart(12, 25, '2023-09-26', '2023-09-29', 35)";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("addToCart: " + results);
  });

  sql = "CALL addToCart(12, 24, '2023-12-26', '2023-12-29', 35)";
  con.query(sql, function (err, results, fields) {
    if (err) {
      console.log(err.message);
      throw err;
    }
    console.log("addToCart: " + results);
  });
}

module.exports = con;
