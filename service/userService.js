const { User, Branch } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const getAllUsers = async () => {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    console.error("Error fetching list users", error);
    throw error;
  }
};

const getAllAdminBranches = async () => {
  try {
    const adminBranches = await User.findAll({
      where: {
        role: "branch_admin",
        branch_id: { [Op.ne]: null }, // Chỉ lấy admin có branch_id
      },
      include: {
        model: Branch,
        attributes: ["name"], 
      },
    });

    return adminBranches;
  } catch (error) {
    console.error("Error fetching list of branch admins:", error);
    throw new Error("Failed to fetch branch admins. Please try again.");
  }
};


const createAdminBranch = async ({username, email, password, role, branch_id}) => {
  try {
    const check = await User.findOne({where: {email}});
    if (check) {
      return {status: 401, message: "Email đã tồn tại trong hệ thống!"};
    }

    const salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);
    
    const user = await User.create({username, email, password, role, branch_id});
    return {status: 200, message: "Tạo nhân viên thành công!", user};
  } catch (error) {
    console.error("Error create admin branch", error);
    throw new Error("Error", error.message);
  }
}
const getUser = async (id) => {
  try {
    const user = await User.findOne({ where: { id } });
    return user;
  } catch (error) {
    console.error("Error fetching User", error);
    throw new Error("Error", error.message);
  }
};

const updateUser = async ({ id, ...data }) => {
  try {
    const checkUser = await User.findOne({ where: { id } });
    
    if (!checkUser) {
      return { status: 404, message: "Người dùng không tồn tại!" };
    }

    const updateFields = {};
    
    if (data.userData.email) updateFields.email = data.userData.email;
    if (data.userData.phone) updateFields.phone = data.userData.phone;
    if (data.userData.image) updateFields.image = data.userData.image;
    if (data.userData.newPassword) {
      if(data.userData.password) {
        const checkPass = bcrypt.compareSync(data.userData.password, checkUser.password);
        if (!checkPass) {
          return { status: 401, message: "Mật khẩu không đúng!" };
        }
      }
      updateFields.password = bcrypt.hashSync(data.userData.newPassword, 10); 
    }    

    if (Object.keys(updateFields).length > 0) {
      await User.update(updateFields, { where: { id } });
      return { status: 200, message: "Cập nhật thành công", updatedFields: updateFields };
    }

    return { status: 400, message: "Không có dữ liệu để cập nhật!" };
  } catch (error) {
    console.error("Error fetching User", error);
    throw new Error("Error", error.message);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  createAdminBranch,
  getAllAdminBranches
};
