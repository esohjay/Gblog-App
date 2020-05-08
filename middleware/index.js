var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkBlogOwnership = function (req, res, next) {
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err || !foundBlog) {
      req.flash("error", "Campground not found, check the url");
      res.redirect("back");
    } else if (
      //does user created the campground
      foundBlog.author.id.equals(req.user._id)
    ) {
      req.blog = foundBlog;
      next();
    } else {
      req.flash("error", "You dont have permission to do that, please go back");
      res.redirect("back");
    }
  });
};
middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to do that");
  res.redirect("/login");
};

module.exports = middlewareObj;

middlewareObj.checkCommentOwnership = function (req, res, next) {
  Comment.findById(req.params.comment_id, function (err, foundComment) {
    if (err || !foundComment) {
      req.flash("error", "The comment does not exist");
      res.redirect("back");
    } else if (
      //does user created the comment
      foundComment.author.id.equals(req.user._id)
    ) {
      req.comment = foundComment;
      next();
    } else {
      req.flash("error", "You did not create this comment");
      res.redirect("back");
    }
  });
};
