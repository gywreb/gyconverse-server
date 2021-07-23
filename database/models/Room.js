const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoomTypeEnum = ["single", "room"];

const RoomSchema = new Schema(
  {
    roomName: {
      type: String,
      required: [true, "room name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: RoomTypeEnum,
      required: [true, "room type is required"],
    },
    lastMessage: {
      type: String,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "user is required"],
      },
    ],
  },
  { timestamps: true, id: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Room", RoomSchema, "room");
