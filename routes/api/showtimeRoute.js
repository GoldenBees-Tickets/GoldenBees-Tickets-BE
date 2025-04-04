const express = require("express");
const router = express.Router();
const ApiShowtimeController = require("../../controller/api/showtimeController");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");

router.get("/branch/:id", ApiShowtimeController.index);
router.post("/check", ApiShowtimeController.checkShowtime);
router.get("/movie/:id", ApiShowtimeController.getByMovieId);
router.post("/", AuthorizationBranchAdmin, ApiShowtimeController.create);
router.get("/:id", ApiShowtimeController.show);

module.exports = router;
