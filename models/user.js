var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: String,
  dob: String,
  email: String,
  phone: String,
  city: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
