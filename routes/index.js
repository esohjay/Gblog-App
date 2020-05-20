var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");

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
  if (req.body.username === "Georgina" && req.body.phone === "08135256188") {
    newUser.isAdmin = true;
  }
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
          service: "Gmail",
          auth: {
            user: process.env.BLOGEMAIL,
            pass: process.env.PASS,
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
          service: "Gmail",
          auth: {
            user: process.env.BLOGEMAIL,
            pass: process.env.PASS,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.BLOGEMAIL,
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

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.BLOGEMAIL,
      pass: process.env.PASS,
    },
  });

  var mailOptions = {
    from: process.env.BLOGEMAIL,
    to: "mgbemenajoan@gmail.com",
    subject: "Message from my blog",
    html: output,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash(
        "success",
        "Thanks for Contacting me, your meassage has been successfull sent"
      );
      console.log("Email sent: " + info.response);
    }
  });
});
router.post("/subscribe", function (req, res) {
  const output = ` <p>You have a new subscriber</p>
  
  <ul>
    <li>Email: ${req.body.email}</li>
    </ul>`;

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    secure: false,
    auth: {
      user: process.env.BLOGEMAIL,
      pass: process.env.PASS,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  var mailOptions = {
    from: process.env.BLOGEMAIL,
    to: "mgbemenajoan@gmail.com",
    subject: "New subscriber notification",
    html: output,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash("success", "Thanks for subscribing");
      console.log("Email sent: " + info.response);
      console.log(process.env.BLOGEMAIL);
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

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SOJI,
      pass: process.env.PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.SOJI,
    to: "esohjay3@gmail.com",
    subject: "Message from a customer",
    html: output,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      req.flash(
        "success",
        "Thanks for Contacting me, your meassage has been successfull sent"
      );
      console.log("Email sent: " + info.response);
    }
  });
});
module.exports = router;
