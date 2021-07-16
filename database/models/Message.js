const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  content: {
    type: String,
    required: [true, "content is required"],
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    required: [true, "room is required"],
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "sender is required"],
  },
});
