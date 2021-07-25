const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoomTypeEnum = ["single", "group"];

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
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "user is required"],
      },
    ],
    roomAdmin: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Room", RoomSchema, "room");
