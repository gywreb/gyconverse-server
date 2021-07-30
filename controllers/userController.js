const User = require("../database/models/User");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ErrorResponse = require("../models/ErrorResponse");
const SuccessResponse = require("../models/SuccessResponse");
const shuffleArray = require("../utils/shuffleArray");

exports.getRandomPeople = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user;
  const people = await User.find({ _id: { $nin: authUser._id } }).select(
    "-password"
  );
  const randomPeople = shuffleArray(people).filter((person) => {
    if (authUser.friends.find((friend) => friend.id.equals(person._id))) {
      return false;
    }
    return true;
  });
  res.json(new SuccessResponse(200, { people: randomPeople }));
});

exports.makeFriend = asyncMiddleware(async (req, res, next) => {
  const { userId } = req.params;
  const authUser = req.user._doc;
  const user = await User.findOne({ _id: userId });
  if (!user) return next(new ErrorResponse(404, "this user is not existed!"));
  const isAlreadyFriend = authUser.friends.find(
    (friend) => friend.id == userId
  );
  if (isAlreadyFriend)
    return next(new ErrorResponse(403, "you two are already friend ?!"));

  await User.updateOne(
    { _id: authUser._id },
    { $push: { friends: { id: userId, _id: userId } } }
  );
  await User.updateOne(
    { _id: userId },
    { $push: { friends: { id: authUser._id, _id: authUser._id } } }
  );
  res.json(
    new SuccessResponse(
      200,
      `you and ${user.username} are now friend, Let's chat!`
    )
  );
});
