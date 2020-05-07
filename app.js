var express = require("express"),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  methodOverride = require("method-override"),
  expressSanitizer = require("express-sanitizer"),
  app = express();

mongoose.connect("mongodb://localhost/BlogApp", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

/*mongoose
  .connect(
    "mongodb+srv://olusoji1:3766inatlas@cluster0-pb3o1.mongodb.net/test?retryWrites=true&w=majority",
    { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true }
  )
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("ERROR:", err.message);
  });*/
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//App config
var blogSchema = new mongoose.Schema({
  title: String,
  image: String,
  body: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  created: { type: Date, default: Date.now },
});
var Blog = mongoose.model("Blog", blogSchema);

var commentSchema = new mongoose.Schema({
  author: String,
  content: String,
});
var Comment = mongoose.model("Comment", commentSchema);

//Restful routes
app.get("/", function (req, res) {
  res.redirect("/blogs");
});

app.get("/blogs", function (req, res) {
  Blog.find({}, function (err, blogs) {
    if (err) {
      console.log("ERROR PAGE");
    } else {
      res.render("index", { blogs: blogs });
    }
  });
});

//New route
app.get("/new", function (req, res) {
  res.render("new");
});

app.post("/blogs", function (req, res) {
  req.body.blog.body = req.sanitize(req.body.blog.body);

  //create blog
  var data = req.body.blog;
  Blog.create(data, function (err, newBlog) {
    if (err) {
      res.render("new");
    } else {
      res.redirect("/");
    }
  });
});

//SHOW ROUTE
app.get("/blogs/:id", function (req, res) {
  Blog.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundBlog) {
      if (err) {
        res.render("/blogs");
      } else {
        res.render("show", { blog: foundBlog });
      }
    });
});

//EDIT ROUTE
app.get("/blogs/:id/edit", function (req, res) {
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.render("edit", { blog: foundBlog });
    }
  });
});

//UPDATE ROUTE
app.put("/blogs/:id", function (req, res) {
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
});

//DELETE ROUTE
app.delete("/blogs/:id", function (req, res) {
  Blog.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  });
});
//COMMENT
app.get("/blogs/:id/comment/new", function (req, res) {
  //find the blog u want to comment on and store whatever u find in foundBlog
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log("Error", err.message);
    } else {
      res.render("newcomment", { foundBlog: foundBlog });
    }
  });
});

app.post("/blogs/:id/comment", function (req, res) {
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
          //comment.save();
          foundBlog.comments.push(comment);
          foundBlog.save();
          res.redirect("/blogs/" + foundBlog._id);
        }
      });
    }
    // then use it to create a comment
  });
});

/*app.listen(process.env.PORT, function () {
  console.log("Server is working");
});*/
app.listen(8080, function () {
  console.log("Server is working");
});
