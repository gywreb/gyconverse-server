const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageTypeEnum = ["TEXT", "IMAGE", "FILE"];

const MessageSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "content is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: MessageTypeEnum,
      required: [true, "message type is required"],
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
  },
  { timestamps: true, id: true, toJSON: { virtuals: true } }
);
module.exports = mongoose.model("Message", MessageSchema, "message");
