const User = require("../database/models/User");
const asyncMiddleware = require("../middlewares/asyncMiddleware");
const SuccessResponse = require("../models/SuccessResponse");
const shuffleArray = require("../utils/shuffleArray");

exports.getRandomPeople = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user;
  const people = await User.find({ _id: { $nin: authUser._id } }).select(
    "-password"
  );
  const randomPeople = shuffleArray(people);
  res.json(new SuccessResponse(200, { people: randomPeople }));
});
