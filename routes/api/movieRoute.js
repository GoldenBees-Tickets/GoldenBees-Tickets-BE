const express = require("express");
const router = express.Router();
const ApiMovieController = require("../../controller/api/movieController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");
const upload = require("../../utils/multer");

router.get("/", ApiMovieController.index);
router.get("/getAll", ApiMovieController.getAll);
router.get("/getAllMoviesAddShowtime", AuthorizationAdmin, ApiMovieController.getMoviesByAddShowtimeController);
router.get("/getAllByAdmin", AuthorizationBranchAdmin, ApiMovieController.getAllByAdmin);
router.get("/branch/:id", AuthorizationBranchAdmin, ApiMovieController.getAllByAdmin);
router.get("/:id", ApiMovieController.show);
router.post("/", AuthorizationAdmin, upload.single("poster"), ApiMovieController.create);
router.put("/:id", AuthorizationAdmin, upload.single("poster"), ApiMovieController.update);
router.delete("/:id", AuthorizationAdmin, ApiMovieController.delete);

module.exports = router;
