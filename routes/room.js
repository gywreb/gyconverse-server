const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const roomController = require("../controllers/roomController");

router.get("/", jwtAuth, roomController.getRooms);
router.post("/single", jwtAuth, roomController.createSingleRoom);
router.post("/group", jwtAuth, roomController.createGroupRoom);

module.exports = router;
