var express = require("express");
var router = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware");
//var crypto = require("crypto");
//var GridFsStorage = require("multer-gridfs-storage");
//var Grid = require("gridfs-stream");
//var path = require("path");
//var   mongoose = require("mongoose"),

//MULTER AND CLOUDINARY CONFIG
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./public");
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: imageFilter,
});
var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "olusoji",
  //api_key: "263835951632721",
  api_key: process.env.APIKEY,
  // api_secret: "_kiWuYw5axWzybKGp6vcTe_aJd4",
  api_secret: process.env.SECRET,
});

router.get("/blogs", function (req, res) {
  var perPage = 15;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    Blog.find({ title: regex })

      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function (err, blogs) {
        Blog.count({ title: regex }).exec(function (err, count) {
          if (err) {
            console.log("back");
          } else {
            if (blogs.length < 1) {
              req.flash("error", "No result found");
              res.render("index", {
                blogs: blogs,
                pages: Math.ceil(count / perPage),
              });
            }
            res.render("index", {
              blogs: blogs,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search,
            });
          }
        });
      });
  } else {
    Blog.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .sort({ created: -1 })
      .exec(function (err, blogs) {
        Blog.count().exec(function (err, count) {
          if (err) {
            console.log("err", err.message);
          } else {
            res.render("index", {
              blogs: blogs,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false,
            });
          }
        });
      });
  }
});
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("blog/new");
});

router.post(
  "/blogs",
  middleware.isLoggedIn,
  upload.single("blogImage"),
  function (req, res) {
    req.body.blog = req.sanitize(req.body.blog);
    //create blog

    var text = req.body.text;
    var title = req.body.title;
    var showimage = req.body.showimage;
    var blogImage = req.file.path;
    var author = {
      id: req.user._id,
      username: req.user.username,
    };
    var newUser = {
      text: text,
      title: title,
      showimage: showimage,
      blogImage: blogImage,
      author: author,
    };
    console.log(req.user);
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.blogImage = result.secure_url;
    });
    Blog.create(newUser, function (err, newBlog) {
      if (err) {
        console.log("error", err.message);
        res.render("blog/new");
      } else {
        res.redirect("/blogs/" + newBlog._id);
      }
    });
  }
);

//SHOW ROUTE
router.get("/blogs/:id", function (req, res) {
  Blog.findById(req.params.id)
    .populate("comments req.body.blogImage")
    .exec(function (err, foundBlog) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.render("show", { blog: foundBlog });
      }
    });
});

//EDIT ROUTE
router.get(
  "/blogs/:id/edit",
  middleware.isLoggedIn,
  middleware.checkBlogOwnership,
  upload.single("blogImage"),
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
  upload.single("blogImage"),
  function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findById(req.params.id, async function (err, blog) {
      if (err) {
        res.redirect("/blogs");
      } else {
        if (req.file) {
          try {
            await cloudinary.v2.uploader.destroy(blog.imageId);
            var result = await cloudinary.v2.uploader.upload(req.file.path);
            blog.imageId = result.public_id;
            blog.blogImage = result.secure_url;
          } catch (err) {
            req.flash("error", "error");
            return res.redirect("back");
          }
        }
        blog.title = req.body.title;
        blog.text = req.body.text;
        blog.save();
        res.redirect("/blogs/" + blog);
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
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
