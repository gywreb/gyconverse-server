const express = require("express");
const basicAuth = require("../middlewares/basicAuth");
const authController = require("../controllers/authController");
const jwtAuth = require("../middlewares/jwtAuth");
const router = express.Router();

router.post("/register", basicAuth, authController.register);
router.post("/login", basicAuth, authController.login);
router.get("/getCurrent", jwtAuth, authController.getCurrent);

module.exports = router;
