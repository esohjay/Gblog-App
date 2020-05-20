require("dotenv").config();
var express = require("express"),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  methodOverride = require("method-override"),
  expressSanitizer = require("express-sanitizer"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose"),
  User = require("./models/user"),
  Comment = require("./models/comment"),
  Blog = require("./models/blog"),
  commentRoutes = require("./routes/comment"),
  blogRoutes = require("./routes/blog"),
  flash = require("connect-flash"),
  indexRoutes = require("./routes/index"),
  GridFsStorage = require("multer-gridfs-storage"),
  Grid = require("gridfs-stream"),
  path = require("path"),
  app = express();

/*mongoose
  .connect(process.env.DATABASEURL, {
    useUnifiedTopology: true,

    useCreateIndex: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("ERROR:", err.message);
  });*/

mongoose
  .connect(process.env.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("ERROR:", err.message);
  });
app.use(flash());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/public", express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//PASSPORT CONFIGURATION
app.locals.moment = require("moment");
app.use(
  require("express-session")({
    secret: "This is a secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function (req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.currentUser = req.user;
  next();
});

//App config

//Restful routes

//New route

app.listen(process.env.PORT, function () {
  console.log("Server is working");
});
app.use(indexRoutes);
app.use(commentRoutes);
app.use(blogRoutes);
/*app.listen(8080, function () {
  console.log("Server is working");
});*/
