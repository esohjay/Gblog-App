var mongoose = require("mongoose");
var blogSchema = new mongoose.Schema({
  title: String,
  text: String,
  showimage: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
    firstname: String,
    lastname: String,
  },

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  created: { type: Date, default: Date.now },
  blogImage: String,
  imageId: String,
});
module.exports = mongoose.model("Blog", blogSchema);
