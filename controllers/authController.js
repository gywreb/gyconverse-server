const User = require("../database/models/User");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ErrorResponse = require("../models/ErrorResponse");
const SuccessResponse = require("../models/SuccessResponse");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const Room = require("../database/models/Room");

exports.editProfile = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const updateParams = req.body;
  const user = await User.findOne({ _id: authUser._id });

  if (updateParams.password) updateParams = _.omit(updateParams, "password");
  if (updateParams.email) updateParams = _.omit(updateParams, "email");
  if (updateParams.username === user.username)
    return next(
      new ErrorResponse(400, "new username must be different from old one")
    );
  if (req.file) user.avatar = req.file.filename;

  for (let property in updateParams) {
    user[property] = updateParams[property];
  }

  const updatedUser = await user.save();

  const arrayOfFriendId = updatedUser.friends.map((friend) => friend.id);
  const friendsInfo = await User.find({ _id: arrayOfFriendId });

  const updatedAuthUserFriends = await Promise.all(
    updatedUser.friends.map(async (friend) => {
      let thisInfo = friendsInfo.find((info) => info._id.equals(friend.id));
      let thisRoom = await Room.findOne({ _id: friend.singleRoom });
      if (thisInfo) {
        return {
          ...friend._doc,
          ..._.pick(thisInfo._doc, "username", "avatar"),
          lastMessage: thisRoom ? thisRoom.lastMessage : null,
        };
      }
    })
  );

  const updatedAuthUserRooms = await Promise.all(
    updatedUser.rooms.map(async (room) => {
      let roomInfo = await Room.findOne({ _id: room });
      if (roomInfo)
        return {
          ...roomInfo._doc,
        };
    })
  );

  const userInfo = _.omit(
    {
      ...updatedUser._doc,
      friends: [...updatedAuthUserFriends],
      rooms: [...updatedAuthUserRooms],
    },
    "password",
    "__v"
  );

  res.json(new SuccessResponse(200, { userInfo }));
});

exports.register = asyncMiddleware(async (req, res, next) => {
  const { username, email, password } = req.body;
  const user = new User({
    username,
    email,
    password,
  });
  const newUser = await user.save();
  res.json(new SuccessResponse(201, { newUser }));
});

exports.getCurrent = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, "unauthorized"));
  const arrayOfFriendId = authUser.friends.map((friend) => friend.id);
  const friendsInfo = await User.find({ _id: arrayOfFriendId });
  authUser.friends = await Promise.all(
    authUser.friends.map(async (friend) => {
      let thisInfo = friendsInfo.find((info) => info._id.equals(friend.id));
      let thisRoom = await Room.findOne({ _id: friend.singleRoom });
      if (thisInfo)
        return {
          ...friend._doc,
          ..._.pick(thisInfo._doc, "username", "avatar"),
          lastMessage: thisRoom ? thisRoom.lastMessage : null,
        };
    })
  );
  authUser.rooms = await Promise.all(
    authUser.rooms.map(async (room) => {
      let roomInfo = await Room.findOne({ _id: room });
      if (roomInfo)
        return {
          ...roomInfo._doc,
        };
    })
  );

  const userInfo = _.omit(authUser, "password", "__v");
  res.json(new SuccessResponse(200, { userInfo }));
});

exports.login = asyncMiddleware(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return next(new ErrorResponse(404, `no user with email: ${email} found`));
  console.log(user);
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new ErrorResponse(400, "password is incorrect"));
  const payload = _.omit(user._doc, "password", "__v");
  const token = User.genJwt(payload);
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };
  const arrayOfFriendId = payload.friends.map((friend) => friend.id);
  const friendsInfo = await User.find({ _id: arrayOfFriendId });
  payload.friends = await Promise.all(
    payload.friends.map(async (friend) => {
      let thisInfo = friendsInfo.find((info) => info._id.equals(friend.id));
      let thisRoom = await Room.findOne({ _id: friend.singleRoom });
      if (thisInfo)
        return {
          ...friend._doc,
          ..._.pick(thisInfo._doc, "username", "avatar"),
          lastMessage: thisRoom ? thisRoom.lastMessage : null,
        };
    })
  );
  payload.rooms = await Promise.all(
    payload.rooms.map(async (room) => {
      let roomInfo = await Room.findOne({ _id: room });
      if (roomInfo)
        return {
          ...roomInfo._doc,
        };
    })
  );
  res
    .cookie("token", token, options)
    .json(new SuccessResponse(200, { token, userInfo: payload }));
});
