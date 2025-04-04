const { resErrors, resData } = require("../common/common");
const { getAllBranches, createBranch, updateBranch, deleteBranch, getBranch } = require("../../service/branchSevice");

class ApiBranchController {
    static async index(req, res) {
        try {
            const branches = await getAllBranches();
            const message = "Get branches successfully";
            res.json({ message, branches });
        } catch (error) {
            console.error("Error fetching branches", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const branch = await getBranch(id);
            if (branch) {
                const message = "Get branch successfully";
                res.json({ message, branch });
            } else {
                resErrors(res, 404, "Branch not found");
            }
        } catch (error) {
            console.error("Error fetching branch", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { name, city } = req.body;
            const branch = await createBranch({ name, city });
            res.json({ branch });
        } catch (error) {
            console.error("Error creating branch", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, city } = req.body;
            const branch = await updateBranch({ id, name, city });
            if (branch[0] === 0) {
                resErrors(res, 404, "Branch not found or no changes made");
            } else {
                res.json({ message: "Branch updated successfully", branch });
            }
        } catch (error) {
            console.error("Error updating branch", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const branch = await deleteBranch(id);
            if (branch === 0) {
                resErrors(res, 404, "Branch not found");
            } else {
                res.json({ message: "Branch deleted successfully" });
            }
        } catch (error) {
            console.error("Error deleting branch", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiBranchController;
