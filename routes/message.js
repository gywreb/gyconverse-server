const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/", jwtAuth, messageController.saveMessage);
router.get("/history", jwtAuth, messageController.loadMessageHistory);

module.exports = router;
