const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", jwtAuth, userController.getRandomPeople);
router.patch("/makeFriend/:userId", jwtAuth, userController.makeFriend);

module.exports = router;
