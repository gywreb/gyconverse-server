const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const GenderEnum = ["male", "femle"];

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, "Invalid email!"],
      required: [true, "email is required"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: [8, "password must be at least 8 characters"],
      required: [true, "password is required"],
      trim: true,
    },
    avatar: {
      type: String,
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: GenderEnum,
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
    friendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
  },
  { timestamps: true, id: true, toJSON: { virtuals: true } }
);

UserSchema.pre("save", async function (next) {
  const user = this;
  // not re-encrypt if not update password ==> seperate route for password
  if (!user.isModified("password")) next();
  try {
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.statics.genJwt = function (payload) {
  // gen jwt and return a token when logged in
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("User", UserSchema, "user");
