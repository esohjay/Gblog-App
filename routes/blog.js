var express = require("express");
var router = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware");

router.get("/blogs", function (req, res) {
  Blog.find({}, function (err, blogs) {
    if (err) {
      console.log("ERROR PAGE");
    } else {
      res.render("index", { blogs: blogs });
    }
  });
});
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("blog/new");
});

router.post("/blogs", middleware.isLoggedIn, function (req, res) {
  //req.body.blog.body = req.sanitize(req.body.blog.body);
  //create blog

  var text = req.body.text;
  var title = req.body.title;
  var image = req.body.image;
  var author = {
    id: req.user._id,
    username: req.user.username,
  };
  var newUser = {
    text: text,
    title: title,
    image: image,
    author: author,
  };
  console.log(req.user);
  Blog.create(newUser, function (err, newBlog) {
    if (err) {
      console.log("error", err.message);
      res.render("blog/new");
    } else {
      res.redirect("/");
    }
  });
});

//SHOW ROUTE
router.get("/blogs/:id", function (req, res) {
  Blog.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundBlog) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.render("blog/show", { blog: foundBlog });
      }
    });
});

//EDIT ROUTE
router.get(
  "/blogs/:id/edit",
  middleware.isLoggedIn,
  middleware.checkBlogOwnership,
  function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.render("blog/edit", { blog: foundBlog });
      }
    });
  }
);

//UPDATE ROUTE
router.put(
  "/blogs/:id",
  middleware.isLoggedIn,
  middleware.checkBlogOwnership,
  function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (
      err,
      updatedBlog
    ) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.redirect("/blogs/" + req.params.id);
      }
    });
  }
);

//DELETE ROUTE
router.delete(
  "/blogs/:id",
  middleware.isLoggedIn,
  middleware.checkBlogOwnership,
  function (req, res) {
    Blog.findByIdAndRemove(req.params.id, function (err) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.redirect("/blogs");
      }
    });
  }
);
module.exports = router;
