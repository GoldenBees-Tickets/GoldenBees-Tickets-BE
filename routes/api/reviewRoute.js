const express = require("express");
const router = express.Router();
const ApiReviewController = require("../../controller/api/reviewController");
const Authorization = require("../../middleware/authentication");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");

router.get("/", AuthorizationBranchAdmin, ApiReviewController.index);
router.get("/:id", ApiReviewController.show);
router.post("/", Authorization, ApiReviewController.create);

module.exports = router;
