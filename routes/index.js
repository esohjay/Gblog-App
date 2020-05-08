var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

router.get("/", function (req, res) {
  res.redirect("/blogs");
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", function (req, res) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var dob = req.body.dob;
  var email = req.body.email;
  var phone = req.body.phone;
  var username = req.body.username;
  var city = req.body.city;

  var newUser = new User({
    firstname: firstname,
    lastname: lastname,
    dob: dob,
    email: email,
    phone: phone,
    username: username,
    city: city,
  });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log("Error", err.message);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function () {
      res.redirect("/blogs");
    });
  });
});
//Show login form
router.get("/login", function (req, res) {
  res.render("login");
});
//Handling login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

//logout
router.get("/logout", function (req, res) {
  req.logout();
  // req.flash("success", "You are logged out");
  res.redirect("/");
});

module.exports = router;
