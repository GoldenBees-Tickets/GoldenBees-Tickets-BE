const express = require("express");
const router = express.Router();
const ApiBranchController = require("../../controller/api/branchController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiBranchController.index);
router.get("/:id", ApiBranchController.show);
router.post("/", AuthorizationAdmin, ApiBranchController.create);
router.put("/:id", AuthorizationAdmin, ApiBranchController.update);
router.delete("/:id", AuthorizationAdmin, ApiBranchController.delete)

module.exports = router;
