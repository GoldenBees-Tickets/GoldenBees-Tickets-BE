const express = require("express");
const router = express.Router();
const ApiGenreController = require("../../controller/api/genreController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiGenreController.index);
router.get("/getAll", ApiGenreController.getAllForDashboard);
router.get("/:id", ApiGenreController.show);
router.post("/", AuthorizationAdmin, ApiGenreController.create);
router.put("/:id", AuthorizationAdmin, ApiGenreController.update);
router.delete("/:id",AuthorizationAdmin, ApiGenreController.delete)

module.exports = router;
