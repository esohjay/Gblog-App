var express = require("express");
var router = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware");
//COMMENT
router.get("/blogs/:id/comment/new", middleware.isLoggedIn, function (
  req,
  res
) {
  //find the blog u want to comment on and store whatever u find in foundBlog
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log("Error", err.message);
    } else {
      res.render("comment/new", { foundBlog: foundBlog });
    }
  });
});

router.post("/blogs/:id/comment", middleware.isLoggedIn, function (req, res) {
  // get the name and content coming from the form
  var author = req.body.author;
  var content = req.body.content;
  // first get the blog post
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log("Error");
    } else {
      Comment.create({ author: author, content: content }, function (
        err,
        comment
      ) {
        if (err) {
          res.redirect("/blogs");
        } else {
          //add username and id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          //save comment

          comment.save();
          foundBlog.comments.push(comment);
          foundBlog.save();
          res.redirect("/blogs/" + foundBlog._id);
        }
      });
    }
    // then use it to create a comment
  });
});

//EDIT ROUTER
router.get(
  "/blogs/:id/comment/:comment_id/edit",
  middleware.isLoggedIn,
  middleware.checkCommentOwnership,
  function (req, res) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err) {
        console.log("ERROR:", err.message);
      } else {
        res.render("comment/edit", {
          campground_id: req.params.id,
          comment: foundComment,
        });
      }
    });
  }
);

router.put(
  "/blogs/:id/comment/:comment_id",
  middleware.isLoggedIn,
  middleware.checkCommentOwnership,
  function (req, res) {
    Comment.findByIdAndUpdate(
      req.params.comment_id,
      req.body.comment,
      function (err, updatedComment) {
        if (err) {
          res.redirect("back");
        } else {
          res.redirect("/blogs/" + req.params.id);
        }
      }
    );
  }
);
// Delete
router.delete(
  "/blogs/:id/comment/:comment_id",
  middleware.isLoggedIn,
  middleware.checkCommentOwnership,
  function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.redirect("/blogs/" + req.params.id);
      }
    });
  }
);

module.exports = router;
