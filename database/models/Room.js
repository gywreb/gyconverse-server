const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  roomName: {
    type: String,
    required: [true, "room name is required"],
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required"],
    },
  ],
});

module.exports = mongoose.model("Room", RoomSchema, "room");
