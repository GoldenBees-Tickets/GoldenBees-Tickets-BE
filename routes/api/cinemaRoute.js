const express = require("express");
const router = express.Router();
const ApiCenimaController = require("../../controller/api/cinemaController");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiCenimaController.index);
router.get("/getAll", ApiCenimaController.getAllCinemaNoPagination);
router.get("/:id", ApiCenimaController.show);
router.get("/branch/:id", ApiCenimaController.getByBranchId);
router.get("/dashboard/:id", ApiCenimaController.getCinemasForDashboardByBranch);
router.post("/", AuthorizationBranchAdmin, ApiCenimaController.create);
router.put("/:id", AuthorizationBranchAdmin, ApiCenimaController.update);
router.delete("/:id", AuthorizationAdmin, ApiCenimaController.delete)

module.exports = router;
