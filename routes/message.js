const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/save", jwtAuth, messageController.saveMessage);
router.get("/history/:roomId", jwtAuth, messageController.loadMessageHistory);

module.exports = router;
