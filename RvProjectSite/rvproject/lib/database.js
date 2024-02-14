let mysql = require("mysql2");
//const { dateStrings } = require("./connectioninfo");

const dbConnectionInfo = require('../connectionInfo');

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
            "DROP DATABASE IF EXISTS db_a9e9f2_parkrv;\n" + "CREATE DATABASE db_a9e9f2_parkrv",
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
    let sql = "USE db_a9e9f2_parkrv";
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

    let dropProcedureSql = "DROP PROCEDURE IF EXISTS `registerUser`;";
    let createProcedureSql = 
  "CREATE PROCEDURE `registerUser`(\n" +
        "IN firstName VARCHAR(255),\n" +
        "IN lastName VARCHAR(255),\n" +
        "IN email VARCHAR(255),\n" +
        "IN serviceBranch VARCHAR(255),\n" +
        "IN serviceStatus VARCHAR(255),\n" +
        "IN salt VARCHAR(255),\n" +
        "IN hashed_password VARCHAR(255),\n" +
        "IN user_type INT,\n" +
        "IN phone VARCHAR(255),\n" +
        "OUT result INT\n" +
        ")\n" +
        "BEGIN\n" +
        "DECLARE nCount INT DEFAULT 0;\n" +
        "SET result = 0;\n" +
        "SELECT COUNT(*) INTO nCount FROM user WHERE userEmail = email;\n" +
        "IF nCount = 0 THEN\n" +
        "INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)\n" +
        "VALUES(firstName, lastName, email, serviceBranch, serviceStatus, salt, hashed_password, user_type, phone);\n" +
        "ELSE\n" +
        "SET result = 1;\n" +
        "END IF;\n" +
        "END";

    // First, drop the procedure if it exists
    con.query(dropProcedureSql, function (err, results, fields) {
        if (err) {
            console.log("Error dropping procedure: ", err.message);
        } else {
            console.log("Procedure `registerUser` dropped if it existed.");
        }
    });
    con.query(createProcedureSql, function (createErr, createResults, createFields) {
        if (createErr) {
            console.log("Error creating procedure: ", createErr.message);
        } else if (createResults) {
            console.log("Procedure `registerUser` created successfully.");
        } else {
            console.log("Procedure `registerUser` creation had no errors but no confirmation was received.");
        }
    });


    //Easton removeFromCart - set siteInCart to 0 for site removed
    let dropRemoveFromCartProcedureSql = "DROP PROCEDURE IF EXISTS `removeFromCart`;";
    let createRemoveFromCartProcedureSql = `
  CREATE PROCEDURE \`removeFromCart\`(
    IN selectedSiteId INT,
    OUT result INT
  )
  BEGIN
    UPDATE site SET siteInCart = 0 WHERE siteId = selectedSiteId;
    SET result = 1;
  END;
`;

    // First, drop the procedure if it exists
    con.query(dropRemoveFromCartProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `removeFromCart` dropped if it existed.");

        }
    });

    // Then, create the new procedure
    con.query(createRemoveFromCartProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `removeFromCart` created successfully.");
        }
    });


    // Easton addTransaction

    let dropAddTransactionProcedureSql = "DROP PROCEDURE IF EXISTS `addTransaction`;";
    let createAddTransactionProcedureSql = `
  CREATE PROCEDURE \`addTransaction\`(
    IN total DECIMAL(10,2),
    IN description VARCHAR(255),
    IN type VARCHAR(45),
    IN confirmationNum VARCHAR(255),
    IN newResId VARCHAR(255),
    OUT result INT
  )
  BEGIN
    DECLARE today DATE;
    SET today = CURDATE();
    INSERT INTO transaction (trxDate, trxTotal, trxDescription, trxType, trxConfirmationId, resId)
    VALUES(today, total, description, type, confirmationNum, newResId);
    SET result = LAST_INSERT_ID();
  END;
`;

    con.query(dropAddTransactionProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `addTransaction` dropped if it existed.");
        }
    });
    con.query(createAddTransactionProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `addTransaction` created successfully.");
        }
    });

    let dropAddTransactionItemProcedureSql = "DROP PROCEDURE IF EXISTS `addTransactionItem`;";
    let createAddTransactionItemProcedureSql = `
  CREATE PROCEDURE \`addTransactionItem\`(
    IN amount DECIMAL(10,2),
    IN qty INT,
    IN description VARCHAR(255),
    IN newTrxId INT,
    OUT result INT
  )
  BEGIN
    INSERT INTO transactionItem (trxItemAmount, trxItemQty, trxItemDescr, trxId)
    VALUES (amount, qty, description, newTrxId);
    SET result = LAST_INSERT_ID();
  END;
`;

    con.query(dropAddTransactionItemProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `addTransactionItem` dropped if it existed.");
        }
    });
    con.query(createAddTransactionItemProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `addTransactionItem` created successfully.");
        }
    });

    // Create Procedures (reservation procedures) - Chris
    // Create a procedure to get all reservations with user and site details for a specific user
    let dropGetReservationsProcedureSql = "DROP PROCEDURE IF EXISTS `getReservations`;";
    let createGetReservationsProcedureSql = `
CREATE PROCEDURE \`getReservations\`(
  IN selectedUserId INT
)
BEGIN
  SELECT r.resId, r.checkIn, r.checkOut, r.comment, r.status, r.userId, r.siteId, trailerLength, u.userFirstName, u.userLastName, u.userEmail, u.userTypeId, u.userPhone, s.siteName, st.siteTypeId, st.siteType, st.siteDescription, st.siteRate
  FROM (
    SELECT resId
    FROM reservation
    WHERE reservation.userId = selectedUserId
  ) AS subq
  INNER JOIN reservation AS r ON r.resId = subq.resId
  LEFT JOIN user AS u ON u.userId = r.userId
  LEFT JOIN site AS s ON s.siteId = r.siteId
  LEFT JOIN siteType AS st ON st.siteTypeId = s.siteTypeId
  GROUP BY r.resId
  ORDER BY r.checkIn;
END;
`;
    con.query(dropGetReservationsProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `getReservations` dropped if it existed.");
        }
    });
    con.query(createGetReservationsProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `getReservations` created successfully.");
        }
    });


    // Create a procedure to get all reservations for a specific user
    let dropGetReservationCheckoutProcedureSql = "DROP PROCEDURE IF EXISTS `getReservationCheckout`;";
    let createGetReservationCheckoutProcedureSql = `
CREATE PROCEDURE \`getReservationCheckout\`(
  IN selectedUserId INT
)
BEGIN
  SELECT * FROM reservation WHERE reservation.userId = selectedUserId;
END;
`;
    // Drop the existing `getReservationCheckout` procedure if it exists
    con.query(dropGetReservationCheckoutProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `getReservationCheckout` dropped if it existed.");
        }
    });

    // Create the `getReservationCheckout` procedure
    con.query(createGetReservationCheckoutProcedureSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            // Handle error
        } else {
            console.log("Procedure `getReservationCheckout` created successfully.");
        }
    });

    // Drop and Create Procedure: setReservationStatus
    let dropSetReservationStatusProcedureSql = "DROP PROCEDURE IF EXISTS `setReservationStatus`;";
    let createSetReservationStatusProcedureSql = `
CREATE PROCEDURE \`setReservationStatus\`(
  IN reservationId INT,
  IN status VARCHAR(255)
)
BEGIN
  UPDATE reservation
  SET reservation.status = status
  WHERE resId = reservationId;
END;
`;
    con.query(dropSetReservationStatusProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `setReservationStatus` dropped if it existed.");
        }
    });
    con.query(createSetReservationStatusProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `setReservationStatus` created successfully.");
    });

    // Drop and Create Procedure: getReservationsForCart
    let dropGetReservationsForCartProcedureSql = "DROP PROCEDURE IF EXISTS `getReservationsForCart`;";
    let createGetReservationsForCartProcedureSql = `
CREATE PROCEDURE \`getReservationsForCart\`(
  IN selectedUserId INT
)
BEGIN
  SELECT r.resId, r.checkIn, r.checkOut, r.comment, r.status, r.userId, r.siteId, trailerLength, u.userFirstName, u.userLastName, u.userEmail, u.userTypeId, u.userPhone, s.siteName, st.siteTypeId, st.siteType, st.siteDescription, st.siteRate
  FROM (
    SELECT resId
    FROM reservation
    WHERE reservation.userId = selectedUserId
  ) AS subq
  INNER JOIN reservation AS r ON r.resId = subq.resId
  LEFT JOIN user AS u ON u.userId = r.userId
  LEFT JOIN site AS s ON s.siteId = r.siteId
  LEFT JOIN siteType AS st ON st.siteTypeId = s.siteTypeId
  WHERE r.status = 'In-Process'
  GROUP BY r.resId
  ORDER BY r.checkIn;
END;
`;
    con.query(dropGetReservationsForCartProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getReservationsForCart` dropped if it existed.");
        }
    });
    con.query(createGetReservationsForCartProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getReservationsForCart` created successfully.");
    });

    //used to get the cart total
    // get the total price where the reservation status is in-process
    let dropGetCheckoutTotalProcedureSql = "DROP PROCEDURE IF EXISTS `getCheckoutTotal`;";
    let createGetCheckoutTotalProcedureSql = `
CREATE PROCEDURE \`getCheckoutTotal\`(
  IN selectedUserId INT
)
BEGIN
  SELECT SUM(site.siteRate * DATEDIFF(reservation.checkOut, reservation.checkIn)) AS totalPrice
  FROM reservation
  INNER JOIN site ON site.siteId = reservation.siteId
  WHERE reservation.status = 'In-Process' AND reservation.userId = selectedUserId;
END;
`;
    con.query(dropGetCheckoutTotalProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getCheckoutTotal` dropped if it existed.");
        }
    });
    con.query(createGetCheckoutTotalProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getCheckoutTotal` created successfully.");
    });


    // Create Procedure getReservation - accepts input parameter resId
    let dropGetReservationProcedureSql = "DROP PROCEDURE IF EXISTS `getReservation`;";
    let createGetReservationProcedureSql = `
CREATE PROCEDURE \`getReservation\`(
  IN resId INT
)
BEGIN
  SELECT reservation.*, site.*, user.*, siteType.*, transaction.*, transactionItem.*
  FROM reservation
  LEFT JOIN user ON user.userId = reservation.userId
  LEFT JOIN transaction ON transaction.resId = reservation.resId
  LEFT JOIN transactionItem ON transactionItem.trxId = transaction.trxId
  LEFT JOIN site ON site.siteId = reservation.siteId
  LEFT JOIN siteType ON siteType.siteTypeId = site.siteTypeId
  WHERE reservation.resId = resId;
END;
`;

    con.query(dropGetReservationProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getReservation` dropped if it existed.");
        }
    });
    con.query(createGetReservationProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getReservation` created successfully.");
    });


    // Create a procedure to get transaction for a specific reservation
    let dropGetTransactionProcedureSql = "DROP PROCEDURE IF EXISTS `getTransaction`;";
    let createGetTransactionProcedureSql = `
CREATE PROCEDURE \`getTransaction\`(
  IN selectedResId INT
)
BEGIN
  SELECT r.*, s.*, st.*, u.*, t.*, ti.*
  FROM (
    SELECT resId
    FROM reservation AS r
    WHERE r.resId = selectedResId
  ) AS subq
  INNER JOIN reservation AS r ON r.resId = subq.resId
  INNER JOIN user AS u ON u.userId = r.userId
  INNER JOIN site AS s ON s.siteId = r.siteId
  INNER JOIN siteType AS st ON st.siteTypeId = s.siteTypeId
  INNER JOIN transaction AS t ON t.resId = r.resId
  INNER JOIN transactionItem AS ti ON ti.trxId = t.trxId
  ORDER BY ti.trxItemDescr;
END;
`;

    con.query(dropGetTransactionProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getTransaction` dropped if it existed.");
        }
    });
    con.query(createGetTransactionProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getTransaction` created successfully.");
    });


    // Create a procedure to check for overlapping reservations for a specific site and date span
    let dropCheckOverlappingReservationsProcedureSql = "DROP PROCEDURE IF EXISTS `checkOverlappingReservations`;";
    let createCheckOverlappingReservationsProcedureSql = `
CREATE PROCEDURE \`checkOverlappingReservations\`(
  IN existingResId INT,
  IN existingSiteId INT,
  IN newCheckIn DATE,
  IN newCheckOut DATE,
  OUT result INT
)
BEGIN
  SET result = (
    SELECT COUNT(*)
    FROM reservation
    INNER JOIN site ON site.siteId = reservation.siteId
    WHERE reservation.siteId = existingSiteId
    AND site.siteInCart = 0
    AND reservation.resId <> existingResId
    AND (
      (newCheckIn BETWEEN reservation.checkIn AND reservation.checkOut)
      OR (newCheckOut BETWEEN reservation.checkIn AND reservation.checkOut)
      OR (reservation.checkIn BETWEEN newCheckIn AND newCheckOut)
      OR (reservation.checkOut BETWEEN newCheckIn AND newCheckOut)
    )
  );
END;
`;

    con.query(dropCheckOverlappingReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `checkOverlappingReservations` dropped if it existed.");
        }
    });
    con.query(createCheckOverlappingReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `checkOverlappingReservations` created successfully.");
    });


    // Checks if reservation is active
    let sqlCheckCurrentReservation = `
CREATE PROCEDURE \`checkCurrentReservation\`(
  IN existingResId INT,
  OUT result INT
)
BEGIN
  DECLARE reservationCount INT;
  SELECT COUNT(*) INTO reservationCount
  FROM reservation
  WHERE resId = existingResId
  AND checkIn < CURDATE() AND checkOut > CURDATE();
  SET result = reservationCount;
END;
`;

    con.query(sqlCheckCurrentReservation, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        } else {
            console.log("Procedure checkCurrentReservation created if it didn't exist.");
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
    let dropAddUserTypeProcedureSql = "DROP PROCEDURE IF EXISTS `addUserType`;";
    let createAddUserTypeProcedureSql = `
CREATE PROCEDURE \`addUserType\`(
  IN type VARCHAR(45)
)
BEGIN
  INSERT INTO userType (userType)
  VALUES (type);
END;
`;

    con.query(dropAddUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `addUserType` dropped if it existed.");
        }
    });
    con.query(createAddUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `addUserType` created successfully.");
    });


    // Create Procedure addUser
    let dropAddUserProcedureSql = "DROP PROCEDURE IF EXISTS `addUser`;";
    let createAddUserProcedureSql = `
CREATE PROCEDURE \`addUser\`(
  IN first VARCHAR(45),
  IN last VARCHAR(45),
  IN email VARCHAR(100),
  IN branch VARCHAR(45),
  IN status VARCHAR(45),
  IN salt VARCHAR(255),
  IN password VARCHAR(255),
  IN typeId INT,
  IN phone VARCHAR(15),
  OUT result INT
)
BEGIN
  DECLARE nCount INT DEFAULT 0;
  SET result = 0;
  SELECT Count(*) INTO nCount FROM user WHERE userEmail = email;
  IF nCount = 0 THEN
    INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)
    VALUES (first, last, email, branch, status, salt, password, typeId, phone);
  ELSE
    SET result = 1;
  END IF;
END;
`;

    con.query(dropAddUserProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `addUser` dropped if it existed.");
        }
    });
    con.query(createAddUserProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `addUser` created successfully.");
    });


    // Create Procedure getUserType
    let dropGetUserTypeProcedureSql = "DROP PROCEDURE IF EXISTS `getUserType`;";
    let createGetUserTypeProcedureSql = `
CREATE PROCEDURE \`getUserType\`(
  IN userid INT
)
BEGIN
  SELECT userType
  FROM userType
  INNER JOIN user ON user.userTypeId = userType.userTypeId
  WHERE user.userId = userid LIMIT 1;
END;
`;

    con.query(dropGetUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getUserType` dropped if it existed.");
        }
    });
    con.query(createGetUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getUserType` created successfully.");
    });


    // Create Procedure addSiteType
    let dropAddSiteTypeProcedureSql = "DROP PROCEDURE IF EXISTS `addSiteType`;";
    let createAddSiteTypeProcedureSql = `
CREATE PROCEDURE \`addSiteType\`(
  IN type VARCHAR(45),
  IN description VARCHAR(255),
  IN rate DECIMAL(10,2)
)
BEGIN
  INSERT INTO siteType (siteType, siteDescription, siteRate)
  VALUES (type, description, rate);
END;
`;

    con.query(dropAddSiteTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `addSiteType` dropped if it existed.");
        }
    });
    con.query(createAddSiteTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `addSiteType` created successfully.");
    });


    // Create Procedure addSite
    let dropAddSiteProcedureSql = "DROP PROCEDURE IF EXISTS `addSite`;";
    let createAddSiteProcedureSql = `
CREATE PROCEDURE \`addSite\`(
  IN name VARCHAR(45),
  IN maxLength INT,
  IN typeId INT,
  OUT result INT
)
BEGIN
  DECLARE existingSite VARCHAR(45);
  SELECT existingSite = (SELECT siteName FROM site WHERE siteName = name);
  IF existingSite IS NULL THEN
    INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)
    VALUES (name, maxLength, 0, typeId);
    SET result = 1;
  ELSE
    SET result = 0;
  END IF;
END;
`;

    con.query(dropAddSiteProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `addSite` dropped if it existed.");
        }
    });
    con.query(createAddSiteProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `addSite` created successfully.");
    });


    // Create Procedure addReservation (added when user checks out)
    let dropAddReservationProcedureSql = "DROP PROCEDURE IF EXISTS `addReservation`;";
    let createAddReservationProcedureSql = `
CREATE PROCEDURE \`addReservation\`(
  IN checkin DATE,
  IN checkout DATE,
  IN length INT,
  IN comments LONGTEXT,
  IN resStatus VARCHAR(45),
  IN arrival TIME,
  IN resUserId INT,
  IN resSiteId INT,
  OUT result INT
)
BEGIN
  INSERT INTO reservation (checkIn, checkOut, trailerLength, comment, status, estArrivalTime, userId, siteId)
  VALUES (checkin, checkout, length, comments, resStatus, arrival, resUserId, resSiteId);
  SET result = LAST_INSERT_ID();
END;
`;

    con.query(dropAddReservationProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `addReservation` dropped if it existed.");
        }
    });
    con.query(createAddReservationProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `addReservation` created successfully.");
    });


    // Create Procedure getAllSites (to display on main site page)
    let dropGetAllSitesProcedureSql = "DROP PROCEDURE IF EXISTS `getAllSites`;";
    let createGetAllSitesProcedureSql = `
CREATE PROCEDURE \`getAllSites\`()
BEGIN
  SELECT *
  FROM site
  LEFT JOIN sitetype ON sitetype.siteTypeId = site.siteTypeId
  ORDER BY
  CASE
    WHEN site.siteName REGEXP '^[0-9]'
    THEN CAST(site.siteName AS UNSIGNED)
    ELSE 9999
  END,
  site.siteName;
END;
`;

    con.query(dropGetAllSitesProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getAllSites` dropped if it existed.");
        }
    });
    con.query(createGetAllSitesProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getAllSites` created successfully.");
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
    let dropAdminGetReservationsProcedureSql = "DROP PROCEDURE IF EXISTS `adminGetReservations`;";
    let createAdminGetReservationsProcedureSql = `
CREATE PROCEDURE \`adminGetReservations\`(
  IN dateParam DATE
)
BEGIN
  SELECT reservation.resId, reservation.*, user.*, site.*, sitetype.*, maxTrx.maxTrxId
  FROM (
      SELECT resId, MAX(trxId) as maxTrxId
      FROM transaction
      GROUP BY resId
  ) as maxTrx
  INNER JOIN reservation ON reservation.resId = maxTrx.resId
  LEFT JOIN user ON user.userId = reservation.userId
  LEFT JOIN site ON site.siteId = reservation.siteId
  LEFT JOIN sitetype ON sitetype.siteTypeId = site.siteTypeId
  WHERE (reservation.checkIn >= dateParam OR reservation.checkOut >= dateParam)
  AND reservation.status NOT IN ('Canceled', 'Cancelled')
  ORDER BY reservation.checkIn;
END;
`;

    con.query(dropAdminGetReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `adminGetReservations` dropped if it existed.");
        }
    });
    con.query(createAdminGetReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `adminGetReservations` created successfully.");
    });


    // Create Procedure adminGetAvailableSites - accepts input parameter of date
    let dropAdminGetAvailableSitesProcedureSql = "DROP PROCEDURE IF EXISTS `adminGetAvailableSites`;";
    let createAdminGetAvailableSitesProcedureSql = `
CREATE PROCEDURE \`adminGetAvailableSites\`(
  IN date DATE
)
BEGIN
  SELECT site.*, siteType.*, 
  (SELECT MIN(reservation.checkIn)
  FROM reservation
  WHERE reservation.siteId = site.siteId AND reservation.checkIn > date) AS nextCheckinDate
  FROM site
  LEFT JOIN siteType ON siteType.siteTypeId = site.siteTypeId
  WHERE site.siteId NOT IN (
  SELECT reservation.siteId FROM reservation
  WHERE date BETWEEN reservation.checkIn AND reservation.checkOut - INTERVAL 1 DAY
  )
  AND site.siteInCart != 1
  ORDER BY
  CASE
  WHEN site.siteName REGEXP '^[0-9]'
  THEN CAST(site.siteName AS UNSIGNED)
  ELSE 9999
  END,
  site.siteName;
END;
`;

    con.query(dropAdminGetAvailableSitesProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `adminGetAvailableSites` dropped if it existed.");
        }
    });
    con.query(createAdminGetAvailableSitesProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `adminGetAvailableSites` created successfully.");
    });

    // Create Procedure getSalt
    let dropGetSaltProcedureSql = "DROP PROCEDURE IF EXISTS `getSalt`;";
    let createGetSaltProcedureSql = `
CREATE PROCEDURE \`getSalt\`(
  IN email VARCHAR(255)
)
BEGIN
  SELECT salt FROM user
  WHERE user.userEmail = email
  LIMIT 1;
END;
`;

    con.query(dropGetSaltProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `getSalt` dropped if it existed.");
        }
    });
    con.query(createGetSaltProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `getSalt` created successfully.");
    });


    // Create Procedure checkCredentials
    let dropCheckCredentialsProcedureSql = "DROP PROCEDURE IF EXISTS `checkCredentials`;";
    let createCheckCredentialsProcedureSql = `
CREATE PROCEDURE \`checkCredentials\`(
  IN email VARCHAR(255),
  IN hashPassword VARCHAR(255)
)
BEGIN
  SELECT EXISTS(
  SELECT * FROM user
  WHERE user.userEmail = email AND user.hashedPassword = hashPassword
  ) AS result;
END;
`;

    con.query(dropCheckCredentialsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `checkCredentials` dropped if it existed.");
        }
    });
    con.query(createCheckCredentialsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `checkCredentials` created successfully.");
    });
}

function addTableData() {
    console.log("addTableData() function called");

    // ----------------------- Add Data to siteType Table ------------------------------
    // Create Procedure setupSiteType (Host site type added for internal admin use only)
    let dropSetupSiteTypeProcedureSql = "DROP PROCEDURE IF EXISTS `setupSiteType`;";
    let createSetupSiteTypeProcedureSql = `
CREATE PROCEDURE \`setupSiteType\`()
BEGIN
  INSERT INTO siteType (siteType, siteTypeImage, siteDescription, siteRate)
  VALUES
  ('Standard Back-In Site', 'images/backin.jpg', 'Asphault base fits up to 46 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers.Has 30 Amp/50 Amp electrical as well as water and sewer hookups. Limited free Wifi also available.', 35.00),
  ('Premium Pull-Through Site', 'images/premium.jpg', 'Concrete base fits up to 60 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers. Has 30 Amp/50 Amp electrical as well as water and sewer hookups. Limited free Wifi also available.', 40.00),
  ('Dry Site', 'images/drysite.jpg', 'Gravel base fits up to 50 ft length. Accomodates fifth-wheel trailers, motorhomes, and travel trailers. No electrical, water, or sewer hookups. Limited free Wifi available.', 20.00),
  ('Trailer Rental Site', 'images/rental.jpg', 'Trailer Rental site has electrical and water hookups, but no sewer. Limited free Wifi available.', 50.00),
  ('Tent Site', 'images/tent.jpg', 'Accommodates a family-size tent (up to 6 people). Includes a picnic table and fire ring.', 20.00),
  ('Host Site', 'images/host.jpg', 'Host site has electrical, water, and sewer hookups. Free for host employees.', 0.00);
END;
`;

    con.query(dropSetupSiteTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `setupSiteType` dropped if it existed.");
        }
    });
    con.query(createSetupSiteTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `setupSiteType` created successfully.");
    });


    let callSetupSiteTypeSql = "CALL `setupSiteType`();";
    con.query(callSetupSiteTypeSql, function (err, results, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        } else {
            console.log("Procedure `setupSiteType` called to add data to the siteType table successfully.");
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
    let dropSetupSiteProcedureSql = "DROP PROCEDURE IF EXISTS `setupSite`;";
    let createSetupSiteProcedureSql = `
CREATE PROCEDURE \`setupSite\`()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE j INT DEFAULT 32;
  DECLARE k CHAR(1) DEFAULT 'A';
  WHILE i <= 31 DO
    IF i != 15 AND i != 16 THEN
      INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)
      VALUES (CAST(i AS CHAR), 46, 0, 1);
    END IF;
    SET i = i + 1;
  END WHILE;
  WHILE j <= 45 DO
    INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)
    VALUES (CAST(j AS CHAR), 60, 0, 2);
    SET j = j + 1;
  END WHILE;
  WHILE k <= 'D' DO
    INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)
    VALUES (k, 50, 0, 3);
    SET k = CHAR(ASCII(k) + 1);
  END WHILE;
  INSERT INTO site (siteName, maxTrailerLength, siteInCart, siteTypeId)
  VALUES ('11B', null, 0, 4),
         ('12B', null, 0, 4),
         ('TENT', null, 0, 5),
         ('HOST', null, 0, 6);
END;
`;

    con.query(dropSetupSiteProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `setupSite` dropped if it existed.");
        }
    });
    con.query(createSetupSiteProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `setupSite` created successfully.");
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
    let dropSetupUserTypeProcedureSql = "DROP PROCEDURE IF EXISTS `setupUserType`;";
    let createSetupUserTypeProcedureSql = `
CREATE PROCEDURE \`setupUserType\`()
BEGIN
  INSERT INTO userType (userType)
  VALUES ('Administrator'), ('Employee'), ('Customer');
END;
`;
    con.query(dropSetupUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `setupUserType` dropped if it existed.");
        }
    });
    con.query(createSetupUserTypeProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `setupUserType` created successfully.");
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
    let dropSeedUsersProcedureSql = "DROP PROCEDURE IF EXISTS `seedUsers`;";
    let createSeedUsersProcedureSql = `
CREATE PROCEDURE \`seedUsers\`()
BEGIN
  INSERT INTO user (userFirstName, userLastName, userEmail, userServiceBranch, userStatus, salt, hashedPassword, userTypeId, userPhone)
  VALUES
    ('Sam', 'Jones', 'samj@hafb.gov', 'Airforce', 'Active', '9068f69ec265d72f', '4b22bd39d3c3078b999c8336d4e77b6f2a1115433501fd0c06a68c85f6914255', 1, '801-589-1111'),
    ('Bob', 'Brown', 'bobb@hafb.gov', 'Airforce', 'Active', 'b0f241dad5a71191', 'c154cc2fb9d2c3a323e26742db9042c3705cad0ca1db5872b44bca2cb8fd24a3', 2, '801-589-1112'),
    ('Amy', 'Adams', 'amya@gmail.com', 'Army', 'Active', 'a3754ae0306fa4fd', 'd9c56161d5c8c7fc396665152519066fe3c359f1741a49baee5df64c729362db', 3, '801-589-1113'),
    ('Chris', 'Clark', 'chrisc@gmail.com', 'Airforce', 'Active', 'd2d7a7f11923b3c8', '9537974f13e0d488158a543f29cbbecb27283da4da8f81b582a5c6cb1bad649f', 3, '801-589-1114'),
    ('Don', 'Davis', 'dond.@hafb.gov', 'Airforce', 'Retired', '0ecaeb96980fd188', 'ffb92abbb2308fa4c1f31ec1d9e4911f4cc16eccfdfaa61f0f638c89b875092f', 3, '801-589-1115'),
    ('Eve', 'Edwards', 'evee@outlook.com', 'Navy', 'Active', '1ab68f2659283fcc', 'ba52e8324ff1e0a29024e515c7135f79c6b67945784d33a679f32e90e8397611', 3, '801-589-1116'),
    ('Fred', 'Franklin', 'fredf@gmail.com', 'Airforce', 'Active', '33b2adaf99f5265b', '4471770447a6108433f4f19a940483c760cb365e63666a9773fd5e07f7476d27', 3, '801-589-1117'),
    ('Gina', 'Green', 'ginag@hafb.gov', 'Airforce', 'Active', 'd654477f14b6c809', 'e2c9d75a802bebeb48e798d2c21770653e1c655c8d54cfe8e8eedf740125ff3a', 3, '801-589-1118'),
    ('Hal', 'Harris', 'halh@gmail.com', 'Marines', 'Retired', '8e844b354bb3b0f3', '81cba4e950e9ac4136a0070a52de7a9ac0380b6978a56cf0c02805aba17525cf', 3, '801-589-1119'),
    ('Ivy', 'Ingram', 'ivyi@gmail.com', 'Airforce', 'Active', '2bf307a5576aacce', '5760002ab6a5e52269ecf42a36e48783ec3ef14a74f051cf1818f23e0719fd54', 3, '801-589-1120'),
    ('Jen', 'Jensen', 'jenj@gmail.com', 'Airforce', 'Active', '9ea1fe9e7e75c901', 'f1ad27615ed5cb7fa848edac3353183e55f47c1dec4f97bd872ba1a886252728', 3, '801-589-1121');
END;
`;

    // Execute drop and create for seedUsers
    con.query(dropSeedUsersProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `seedUsers` dropped if it existed.");
        }
    });
    // Only create the new procedure after confirming the old one is dropped
    con.query(createSeedUsersProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `seedUsers` created successfully.");
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
    let dropSeedReservationsProcedureSql = "DROP PROCEDURE IF EXISTS `seedReservations`;";
    let createSeedReservationsProcedureSql = `
CREATE PROCEDURE \`seedReservations\`()
BEGIN
  INSERT INTO reservation (checkIn, checkOut, trailerLength, comment, status, estArrivalTime, userId, siteId)
  VALUES
    ('2023-05-09', '2023-05-22', 60, 'Reservation refunded', 'Canceled', '08:00:00', 3, 30),
    ('2023-05-10', '2023-05-18', 46, NULL, 'Paid', '22:00:00', 4, 7),
    ('2023-05-12', '2023-05-25', 50, NULL, 'Paid', '11:30:00', 5, 45),
    ('2023-05-19', '2023-05-26', 52, NULL, 'Paid', '09:30:00', 6, 34),
    ('2023-05-13', '2023-05-16', 60, NULL, 'Paid', '20:00:00', 3, 40),
    ('2023-05-14', '2023-05-26', 46, NULL, 'Paid', '18:30:00', 7, 24),
    ('2023-05-15', '2023-05-28', 50, NULL, 'Paid', '13:00:00', 8, 47),
    ('2023-05-13', '2023-05-25', 46, NULL, 'Paid', '12:30:00', 9, 17),
    ('2023-05-17', '2023-05-29', 46, 'Customer has three concurrent reservations', 'Paid', '09:00:00', 10, 8),
    ('2023-05-17', '2023-05-29', 46, 'Second reservation for adjacent site', 'Paid', '09:00:00', 10, 9),
    ('2023-05-17', '2023-05-29', NULL, 'Third reservation for tent site', 'Paid', '09:00:00', 10, 50),
    ('2023-05-24', '2023-05-28', 60, NULL, 'Paid', '09:00:00', 9, 29),
    ('2023-05-22', '2023-05-31', 46, NULL, 'Paid', '23:00:00', 8, 6),
    ('2023-05-27', '2023-06-08', 50, NULL, 'Paid', '10:30:00', 7, 43),
    ('2023-05-25', '2023-06-08', 52, NULL, 'Paid', '09:30:00', 6, 33),
    ('2023-05-21', '2023-05-31', 60, NULL, 'Paid', '18:00:00', 5, 39),
    ('2023-05-28', '2023-06-09', 46, NULL, 'Paid', '12:30:00', 4, 23),
    ('2023-06-03', '2023-06-15', 50, NULL, 'Paid', '13:00:00', 3, 46),
    ('2023-05-26', '2023-06-02', 46, NULL, 'Paid', '08:30:00', 2, 16);
END;
`;

    // Execute the drop and create for seedReservations
    con.query(dropSeedReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `seedReservations` dropped if it existed.");
        }
    });

    // Only create the new procedure after confirming the old one is dropped
    con.query(createSeedReservationsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `seedReservations` created successfully.");
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

    let dropSeedTransactionsProcedureSql = "DROP PROCEDURE IF EXISTS `seedTransactions`;";
    let createSeedTransactionsProcedureSql = `
CREATE PROCEDURE \`seedTransactions\`()
BEGIN
  INSERT INTO transaction (trxDate, trxTotal, trxDescription, trxType, trxConfirmationId, resId)
  VALUES
    ('2023-05-09', 520.00, 'Famcamp Stay - Peak Season', 'Invoice', '2487241300', 1),
    ('2023-05-10', 280.00, 'Famcamp Stay - Peak Season', 'Invoice', '4578640191', 2),
    ('2023-05-12', 260.00, 'Famcamp Stay - Peak Season', 'Invoice', '1112398763', 3),
    ('2023-05-10', 280.00, 'Famcamp Stay - Peak Season', 'Invoice', '3829211004', 4),
    ('2023-05-13', 120.00, 'Famcamp Stay - Peak Season', 'Invoice', '8537182906', 5),
    ('2023-05-09', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '6252349520', 6),
    ('2023-05-10', 260.00, 'Famcamp Stay - Peak Season', 'Invoice', '9834223791', 7),
    ('2023-05-12', 385.00, 'Famcamp Stay - Peak Season', 'Invoice', '2322497284', 8),
    ('2023-05-11', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '8862349872', 9),
    ('2023-05-24', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '9084103197', 10),
    ('2023-05-22', 240.00, 'Famcamp Stay - Peak Season', 'Invoice', '3017087428', 11),
    ('2023-05-28', 140.00, 'Famcamp Stay - Peak Season', 'Invoice', '0205163321', 12),
    ('2023-05-09', -510.00, 'Refund with cancellation fees', 'Invoice', '2165729409', 1),
    ('2023-05-25', 315.00, 'Famcamp Stay - Peak Season', 'Invoice', '1931091827', 13),
    ('2023-05-21', 480.00, 'Famcamp Stay - Peak Season', 'Invoice', '5616875485', 14),
    ('2023-05-28', 560.00, 'Famcamp Stay - Peak Season', 'Invoice', '2775270247', 15),
    ('2023-06-03', 400.00, 'Famcamp Stay - Peak Season', 'Invoice', '8582338688', 16),
    ('2023-05-26', 420.00, 'Famcamp Stay - Peak Season', 'Invoice', '5145879171', 17),
    ('2023-05-18', 240.00, 'Famcamp Stay - Peak Season', 'Invoice', '2165728930', 18),
    ('2023-05-18', 245.00, 'Famcamp Stay - Peak Season', 'Invoice', '1264578952', 19);
END;
`;

    // Execute the drop and create for seedTransactions
    con.query(dropSeedTransactionsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `seedTransactions` dropped if it existed.");
        }
    });

    // Only create the new procedure after confirming the old one is dropped
    con.query(createSeedTransactionsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `seedTransactions` created successfully.");
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
    let dropSeedTransactionItemsProcedureSql = "DROP PROCEDURE IF EXISTS `seedTransactionItems`;";
    let createSeedTransactionItemsProcedureSql = `
CREATE PROCEDURE \`seedTransactionItems\`()
BEGIN
  INSERT INTO transactionItem (trxItemAmount, trxItemQty, trxItemDescr, trxId)
  VALUES
    (40.00, 13, 'Premium Pull-Through Site #32', 1),
    (35.00, 8, 'Standard Back-In Site #7', 2),
    (20.00, 13, 'Dry Site #B', 3),
    (40.00, 7, 'Premium Pull-Through Site #36', 4),
    (40.00, 3, 'Premium Pull-Through Site #42', 5),
    (35.00, 12, 'Standard Back-In Site #26', 6),
    (20.00, 13, 'Dry Site #D', 7),
    (35.00, 11, 'Standard Back-In Site #19', 8),
    (35.00, 12, 'Standard Back-In Site #8', 9),
    (35.00, 12, 'Standard Back-In Site #9', 9),
    (20.00, 12, 'Tent Site', 9),
    (40.00, 4, 'Premium Pull-Through Site #32', 10),
    (35.00, 9, 'Standard Back-In Site #7', 11),
    (20.00, 12, 'Dry Site #B', 12),
    (-40.00, 13, 'Site #32 - Refund', 13),
    (10.00, 1, 'Cancellation Fee', 13),
    (40.00, 14, 'Premium Pull-Through Site #36', 14),
    (40.00, 10, 'Premium Pull-Through Site #42', 15),
    (35.00, 12, 'Standard Back-In Site #26', 16),
    (20.00, 12, 'Dry Site #D', 17),
    (35.00, 7, 'Standard Back-In Site #19', 18);
END;
`;

    // Execute the drop and create for seedTransactionItems
    con.query(dropSeedTransactionItemsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else {
            console.log("Procedure `seedTransactionItems` dropped if it existed.");
        }
    });

    // Only create the new procedure after confirming the old one is dropped
    con.query(createSeedTransactionItemsProcedureSql, function (err, results, fields) {
        if (err) console.log(err.message);
        else console.log("Procedure `seedTransactionItems` created successfully.");
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
