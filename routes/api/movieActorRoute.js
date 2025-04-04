const express = require("express");
const router = express.Router();
const ApiMovieActorController = require("../../controller/api/movieActorController");

router.post("/",ApiMovieActorController.create);

router.delete("/:id",ApiMovieActorController.delete)


module.exports = router;
