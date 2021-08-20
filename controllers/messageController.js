const moment = require("moment");
const Message = require("../database/models/Message");
const Room = require("../database/models/Room");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ErrorResponse = require("../models/ErrorResponse");
const SuccessResponse = require("../models/SuccessResponse");

exports.saveMessage = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { content, type, room, sender } = req.body;
  const roomExist = await Room.findOne({ _id: room });
  if (!roomExist)
    return next(new ErrorResponse(404, "this conversation is not exist"));
  console.log(authUser._id);
  if (!authUser._id.equals(sender))
    return next(new ErrorResponse(401, "unauthorized to send message"));
  if (!roomExist.members.includes(sender))
    return next(
      new ErrorResponse(400, "you are not a member in this conversation")
    );
  let message;
  if (type === "TEXT" || type === "VIDEO_CALL") {
    message = new Message({
      content,
      type,
      room,
      sender,
      timestamps: moment(),
    });
  } else if (type === "IMAGE" || type === "FILE") {
    message = new Message({
      content: req.file ? req.file.filename : "",
      type,
      room,
      sender,
      timestamps: moment(),
    });
  }
  const newMessage = await message.save();
  await Room.updateOne(
    { _id: newMessage.room },
    { lastMessage: newMessage.content }
  );
  res.json(new SuccessResponse(201, { newMessage }));
});

exports.loadMessageHistory = asyncMiddleware(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await Room.findOne({ _id: roomId });
  if (!room) return next(new ErrorResponse(404, "room is not found"));
  // get from the last message
  const messages = await Message.find({ room: roomId }).sort({ _id: -1 });
  res.json(new SuccessResponse(200, { messages }));
});
