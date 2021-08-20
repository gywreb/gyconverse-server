const express = require("express");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();
const messageController = require("../controllers/messageController");
const uploadFile = require("../middlewares/uploadFile");

router.post(
  "/save",
  jwtAuth,
  uploadFile.single("content"),
  messageController.saveMessage
);
router.get("/history/:roomId", jwtAuth, messageController.loadMessageHistory);

module.exports = router;
