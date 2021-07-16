const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullname: {
    type: String,
    required: [true, "fullname is required"],
    trim: true,
  },
  email: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, "Invalid email!"],
    required: [true, "email is required"],
    trim: true,
  },
  password: {
    type: String,
    minlength: [8, "password must be at least 8 characters"],
    required: [true, "password is required"],
  },
  friends: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      talked: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema, "user");
