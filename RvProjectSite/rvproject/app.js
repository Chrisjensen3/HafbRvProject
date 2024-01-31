//  start code: DEBUG='rvproject:*express-mysql-session*'; npm start

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);

var homeRouter = require("./routes/home");
var { router: loginRouter, getSaltRoute } = require("./routes/login");
var registerRouter = require("./routes/register");
var sitesRouter = require("./routes/sites");
var adminRouter = require("./routes/admin");
var adminRegister = require("./routes/adminregister");
var checkoutRouter = require("./routes/checkout");
var reservationRouter = require("./routes/reservations");
var invoiceRouter = require("./routes/invoice");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap-icons/")));
app.use(express.static(path.join(__dirname, "node_modules/crypto-js/")));
app.use("/node_modules", express.static("node_modules"));
app.use(
  express.static(path.join(__dirname, "node_modules/bootstrap-datepicker/dist"))
);

var dbCon = require("./lib/database");

// Session management to store cookies in a MySQL server (this has a bug, so we assist it by creating the database for it)
var dbSessionPool = require("./lib/sessionPool.js");
var sessionStore = new MySQLStore({}, dbSessionPool);

// Necessary middleware to store session cookies in MySQL
app.use(
  session({
    key: "session_cookie_name",
    secret: "session_cookie_secret1234",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict",
    },
  })
);

// Middleware to make session variables available in .ejs template files
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use("/", homeRouter);
app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/sites", sitesRouter);
app.use("/admin", adminRouter);
app.use("/adminregister", adminRegister);
app.use("/checkout", checkoutRouter);
app.use("/reservations", reservationRouter);
app.use("/invoice", invoiceRouter);

// Call the getSaltRoute function with the app instance from login.js file
getSaltRoute(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
