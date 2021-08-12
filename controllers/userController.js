const Room = require("../database/models/Room");
const User = require("../database/models/User");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ErrorResponse = require("../models/ErrorResponse");
const SuccessResponse = require("../models/SuccessResponse");
const shuffleArray = require("../utils/shuffleArray");
const _ = require("lodash");

exports.getRandomPeople = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user;
  const people = await User.find({ _id: { $nin: authUser._id } }).select(
    "-password"
  );
  const randomPeople = shuffleArray(people).filter((person) => {
    if (
      authUser.friends.find((friend) => friend.id.equals(person._id)) ||
      authUser.friendRequests.find((request) => request.id.equals(person._id))
    ) {
      return false;
    }
    return true;
  });
  res.json(new SuccessResponse(200, { people: randomPeople }));
});

exports.sendFriendRequest = asyncMiddleware(async (req, res, next) => {
  const { userId } = req.params;
  const authUser = req.user._doc;
  const user = await User.findOne({ _id: userId });
  if (!user) return next(new ErrorResponse(404, "this user is not existed!"));
  const isAlreadyRequested = authUser.pendingRequests.find(
    (pending) => pending == userId
  );
  if (isAlreadyRequested)
    return next(
      new ErrorResponse(
        403,
        "you have already sent friend request to this person!"
      )
    );
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        friendRequests: {
          _id: authUser._id,
          id: authUser._id,
          username: authUser.username,
          avatar: authUser.avatar,
        },
      },
    }
  );
  await User.updateOne(
    { _id: authUser._id },
    { $push: { pendingRequests: userId } }
  );

  res.json(
    new SuccessResponse(200, `Sent befriend request to ${user.username}!`)
  );
});

exports.makeFriend = asyncMiddleware(async (req, res, next) => {
  const { userId } = req.params;
  const authUser = req.user._doc;
  const user = await User.findOne({ _id: userId });
  if (!user) return next(new ErrorResponse(404, "this user is not existed!"));
  const isInFriendReqs = authUser.friendRequests.find(
    (request) => request.id == userId
  );
  if (!isInFriendReqs)
    return next(
      new ErrorResponse(
        400,
        "this person is not request to be friends with you :("
      )
    );
  const isAlreadyFriend = authUser.friends.find(
    (friend) => friend.id == userId
  );
  if (isAlreadyFriend)
    return next(new ErrorResponse(403, "you two are already friend ?!"));

  await User.updateOne(
    { _id: authUser._id },
    {
      $push: { friends: { id: userId, _id: userId } },
      $pull: { friendRequests: { id: userId } },
    }
  );
  await User.updateOne(
    { _id: userId },
    {
      $push: { friends: { id: authUser._id, _id: authUser._id } },
      $pull: { pendingRequests: userId },
    }
  );
  const updatedAuthUser = await User.findById(authUser._id);
  const updatedTargetUser = await User.findById(userId);

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
    new SuccessResponse(200, {
      message: `you and ${user.username} are now friend, Let's chat!`,
      updatedAuthUser: {
        ...updatedAuthInfo,
      },
      updatedTargetUser: {
        ...updatedUserInfo,
      },
    })
  );
});
