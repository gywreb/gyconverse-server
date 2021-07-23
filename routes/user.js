const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", jwtAuth, userController.getRandomPeople);

module.exports = router;
