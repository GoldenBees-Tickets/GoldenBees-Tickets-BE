const express = require("express");
const router = express.Router();
const ApiMovieProducerController = require("../../controller/api/movieProducerController");

router.post("/",ApiMovieProducerController.create);

router.delete("/:id",ApiMovieProducerController.delete)


module.exports = router;
