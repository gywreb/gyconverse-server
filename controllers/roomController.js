const Room = require("../database/models/Room");
const User = require("../database/models/User");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ErrorResponse = require("../models/ErrorResponse");
const SuccessResponse = require("../models/SuccessResponse");
const _ = require("lodash");

exports.getRooms = asyncMiddleware(async (req, res, next) => {
  const rooms = await Room.find({});
  res.json(new SuccessResponse(200, { rooms }));
});

exports.createSingleRoom = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { roomName, members } = req.body;
  if (members.length !== 2)
    return next(
      new ErrorResponse(
        400,
        "the members's number of this room not for single room!"
      )
    );

  if (!members.includes(`${authUser._id}`))
    return next(new ErrorResponse(401, "unable to create room"));
  let chatFriend = null;
  members.map((mem) => {
    if (
      mem !== authUser._id &&
      authUser.friends.find((friend) => friend.id == mem)
    ) {
      chatFriend = authUser.friends.find((friend) => friend.id == mem);
    }
  });
  if (!chatFriend)
    return next(new ErrorResponse(400, "this person is not your friend"));
  if (chatFriend.talked)
    return next(new ErrorResponse(400, "you already chat with this person"));
  const dbUser = await User.findOne({ _id: authUser._id });
  const dbFriend = await User.findOne({ _id: chatFriend.id });
  if (!dbFriend) {
    return next(new ErrorResponse(400, "your friend is longer existed"));
  }
  const room = new Room({
    roomName,
    type: "single",
    members,
  });
  const newRoom = await room.save();
  dbUser.friends.map((friend) => {
    if (friend.id == `${dbFriend._id}`) {
      friend.talked = true;
      friend.singleRoom = newRoom._id;
    }
  });
  dbFriend.friends.map((user) => {
    if (user.id == `${dbUser._id}`) {
      user.talked = true;
      user.singleRoom = newRoom._id;
    }
  });

  const updatedAuthUser = await dbUser.save();
  const updatedTargetUser = await dbFriend.save();
  await User.updateMany({ _id: members }, { $push: { rooms: newRoom._id } });

  const arrayOfFriendId = updatedAuthUser.friends.map((friend) => friend.id);
  const friendsInfo = await User.find({ _id: arrayOfFriendId });

  const arrayOfTargetFriendId = updatedTargetUser.friends.map(
    (friend) => friend.id
  );
  const targetFriendsInfo = await User.find({ _id: arrayOfTargetFriendId });

  const updatedAuthUserFriends = await Promise.all(
    updatedAuthUser.friends.map(async (friend) => {
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

  const updatedTargetUserFriends = await Promise.all(
    updatedTargetUser.friends.map(async (friend) => {
      let thisInfo = targetFriendsInfo.find((info) =>
        info._id.equals(friend.id)
      );
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

  const updatedAuthInfo = _.omit(
    { ...updatedAuthUser._doc, friends: [...updatedAuthUserFriends] },
    "password",
    "__v"
  );
  const updatedUserInfo = _.omit(
    { ...updatedTargetUser._doc, friends: [...updatedTargetUserFriends] },
    "password",
    "__v"
  );

  res.json(
    new SuccessResponse(201, { newRoom, updatedAuthInfo, updatedUserInfo })
  );
});

exports.createGroupRoom = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { roomName, members } = req.body;
  if (members.length < 2)
    return next(
      new ErrorResponse(400, "need more than 2 people to have a conversation")
    );
  if (!members.includes(`${authUser._id}`))
    return next(new ErrorResponse(401, "unable to create room"));
  const room = new Room({
    roomName,
    type: "group",
    members,
    roomAdmin: authUser._id,
  });
  const newRoom = await room.save();
  await User.updateMany({ _id: members }, { $push: { rooms: newRoom._id } });
  res.json(new SuccessResponse(201, { newRoom }));
});
