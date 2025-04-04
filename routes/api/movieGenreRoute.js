const express = require("express");
const router = express.Router();
const ApiMovieGenreController = require("../../controller/api/movieGenreController");

router.get("/", ApiMovieGenreController.index);
router.get("/:id", ApiMovieGenreController.show);
router.post("/",ApiMovieGenreController.create);
router.put("/:id",ApiMovieGenreController.update);
router.delete("/:id",ApiMovieGenreController.delete)

module.exports = router;
