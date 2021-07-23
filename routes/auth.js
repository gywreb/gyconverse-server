const express = require("express");
const basicAuth = require("../middlewares/basicAuth");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/register", basicAuth, authController.register);
router.post("/login", basicAuth, authController.login);

module.exports = router;
