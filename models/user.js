const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String }
});

var User = mongoose.model("User", userSchema);

module.exports = User;