const express = require("express");
const router = express.Router();
const ApiMovieController = require("../../controller/api/movieController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
const upload = require("../../utils/multer");


router.get("/", ApiMovieController.index);
router.get("/:id", ApiMovieController.show);
router.post("/", AuthorizationAdmin, upload.single("poster"), ApiMovieController.create);
router.put("/:id", AuthorizationAdmin, upload.single("poster"), ApiMovieController.update);
router.delete("/:id", AuthorizationAdmin, ApiMovieController.delete);

module.exports = router;
