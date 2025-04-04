const express = require("express");
const router = express.Router();
const ApiReviewController = require("../../controller/api/reviewController");

router.get("/", ApiReviewController.index);

module.exports = router;
