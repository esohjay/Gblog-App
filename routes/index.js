var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var mg = require("nodemailer-mailgun-transport");
var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;
var oath2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oath2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
var accessToken = oath2Client.getAccessToken();

router.get("/", function (req, res) {
  res.redirect("/blogs");
});

router.get("/register", function (req, res) {
  var mes = null;
  res.render("register", { mes: mes });
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
  if (
    (req.body.username === "Admin" && req.body.password === "1458ingblog") ||
    (req.body.username === "Admin1" && req.body.password === "3766ingblog") ||
    (req.body.username === "Admin2" && req.body.password === "0000ingblog")
  ) {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      req.flash("error", +err.message);
      console.log(err);
      return res.render("register", { mes: err.message });
    }
    passport.authenticate("local")(req, res, function () {
      req.flash(
        "success",
        "Congratulations " + user.username + ", you have been registered"
      );
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
  req.flash("success", "You are logged out");
  req.logout();
  req.flash("success", "You are logged out");
  res.redirect("/");
});
//PASSWORD RESET
router.get("/forgot", function (req, res) {
  res.render("forgot");
});
router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.BLOGEMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: process.env.ACCESS_TOKEN,
          },
        });

        var mailOptions = {
          to: user.email,
          from: process.env.BLOGEMAIL,
          subject: "Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset/:token", function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.BLOGEMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: process.env.ACCESS_TOKEN,
          },
        });
        var mailOptions = {
          to: user.email,
          from: " 'Gblog' <gblog1458@gmail.com>",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/campgrounds");
    }
  );
});

// USER PROFILE
router.get("/users/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err) {
      req.flash("error", "Something went wrong.");
      res.redirect("/");
    }
    Campground.find()
      .where("author.id")
      .equals(foundUser._id)
      .exec(function (err, campgrounds) {
        if (err) {
          req.flash("error", "Something went wrong.");
          res.redirect("/");
        }
        res.render("users/show", { user: foundUser, campgrounds: campgrounds });
      });
  });
});
//USER PROFILE
router.get("/user/:id", function (req, res) {
  User.findById(req.params.id, function (err, founduser) {
    if (err) {
      req.flash("error", "Something went wrong");
      res.render("back");
    } else {
      res.render("user/show", { user: founduser });
    }
  });
});

router.get("/contact", function (req, res) {
  res.render("contact");
});

router.post("/contact", function (req, res) {
  const output = ` <p>You have a new message</p>
  <h3>Contact details</h3>
  <ul>
    <li>Name: ${req.body.name}</li>
    <li>Email: ${req.body.email}</li>
    <li>Phone: ${req.body.phone}</li>
  </ul>
  <h3>Message</h3>
<p>${req.body.message}</p>`;

  var smtpTransport = nodemailer.createTransport({
    service: "gmail",

    auth: {
      type: "OAuth2",
      user: process.env.BLOGEMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: process.env.ACCESS_TOKEN,
    },
  });
  var mailOptions = {
    from: process.env.BLOGEMAIL,
    to: "mgbemenajoan@gmail.com",
    subject: "Message from my blog",
    html: output,
  };

  smtpTransport.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash(
        "success",
        "Thanks for Contacting me, your meassage has been successfull sent"
      );
      console.log("Email sent: " + info.response);
      res.redirect("/blogs");
    }
  });
});
router.post("/subscribe", function (req, res) {
  const output = ` <p>You have a new subscriber</p>
  
  <ul>
    <li>Email: ${req.body.email}</li>
    </ul>`;

  var smtpTransport = nodemailer.createTransport({
    service: "gmail",

    auth: {
      type: "OAuth2",
      user: process.env.BLOGEMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: process.env.ACCESS_TOKEN,
    },
  });
  var mailOptions = {
    from: process.env.BLOGEMAIL,
    to: "mgbemenajoan@gmail.com",
    subject: "Notification for a new subscriber",
    html: output,
  };

  smtpTransport.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash("success", "Thanks for Subscribing");
      console.log("Email sent: " + info.response);
      res.redirect("/blogs");
    }
  });
});

router.post("/contactsoji", function (req, res) {
  const output = ` <p>You have a new message</p>
  <h3>Contact details</h3>
  <ul>
    <li>Name: ${req.body.name}</li>
    <li>Email: ${req.body.email}</li>
    <li>Phone: ${req.body.phone}</li>
  </ul>
  <h3>Message</h3>
<p>${req.body.message}</p>`;

  var OAuth2 = google.auth.OAuth2;
  var oath2Client = new OAuth2(
    process.env.CLIENT_ID1,
    process.env.CLIENT_SECRET1,
    "https://developers.google.com/oauthplayground"
  );
  oath2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN1,
  });

  var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      clientId: process.env.CLIENT_ID1,
      clientSecret: process.env.CLIENT_SECRET1,
      refreshToken: process.env.REFRESH_TOKEN1,
      accessToken: process.env.ACCESS_TOKEN1,
      user: "esohjay3@gmail.com",
    },
  });

  var mailOptions = {
    from: "esohjay3@gmail.com",
    to: "olusoji.webdev3766@gmail.com",
    subject: "Message from a customer",
    html: output,
  };

  smtpTransport.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash(
        "success",
        "Thanks for Contacting me, your meassage has been successfull sent"
      );
      console.log("Email sent: " + info.response);
      res.redirect("/blogs");
    }
  });
});
module.exports = router;
