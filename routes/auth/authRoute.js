
const express = require('express');
const router = express.Router()
const ApiAuthController = require("../../controller/auth/authController");

router.post("/login", ApiAuthController.login)
router.post("/verifyGoogle", ApiAuthController.verifyGoogleToken)
router.post("/register", ApiAuthController.create)
router.post("/resetPass", ApiAuthController.resetPass)
router.post("/newPass", ApiAuthController.newPassword)
router.post("/refresh-token", ApiAuthController.refreshToken)


module.exports = router