const { User, Branch } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const getAllUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = {
      role: "user",
      ...(search && {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      })
    };

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error("Error fetching list users", error);
    throw error;
  }
};

const getAllAdminBranches = async (page = 1, limit = 10, search = '') => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = {
      role: "branch_admin",
      branch_id: { [Op.ne]: null },
      ...(search && {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      })
    };

    const { count, rows: adminBranches } = await User.findAndCountAll({
      where: whereClause,
      include: {
        model: Branch,
        attributes: ["name"],
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      adminBranches,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error("Error fetching list of branch admins:", error);
    throw new Error("Failed to fetch branch admins. Please try again.");
  }
};

const createAdminBranch = async ({username, email, password, role, branch_id}) => {
  try {
    const check = await User.findOne({where: {email}});
    if (check) {
      return {status: 409, success: false, error: true, message: "Email đã tồn tại trong hệ thống!"};
    }

    const salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);
    
    const user = await User.create({username, email, password, role, branch_id});
    return {status: 200, success: true, error: false, message: "Tạo nhân viên thành công!", user};
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
      return { status: 404, message: "Người dùng không tồn tại!", success: false, error: true };
    }

    const updateFields = {};
    
    if (data.userData.email) updateFields.email = data.userData.email;
    if (data.userData.phone) updateFields.phone = data.userData.phone;
    if (data.userData.image) updateFields.image = data.userData.image;
    if (data.userData.newPassword) {
      if(data.userData.password) {
        const checkPass = bcrypt.compareSync(data.userData.password, checkUser.password);
        if (!checkPass) {
          return { status: 401, message: "Mật khẩu không đúng!", success: false, error: true };
        }
      }
      updateFields.password = bcrypt.hashSync(data.userData.newPassword, 10); 
    }    

    if (Object.keys(updateFields).length > 0) {
      await User.update(updateFields, { where: { id } });
      return { status: 200, message: "Cập nhật thành công", updateFields, success: true, error: false };
    }

    return { status: 400, message: "Không có dữ liệu để cập nhật!", success: false, error: true };
  } catch (error) {
    console.error("Error fetching User", error);
    return { status: 500, message: error.message, success: false, error: true };
  }
};

const getStarUser = async (id) => {
  try {
    const user = await User.findOne({
      attributes: ["id", "star"],
      where: { id },
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching User", error);
    throw new Error("Error", error.message);
  }
};

const updateStatusForAdmin = async ({id, status}) => {
  try {
    const user = await User.findOne({ where: { id } });
    
    if (!user) {
      return { status: 404, message: "Người dùng không tồn tại!", success: false, error: true };
    }

    await User.update({ is_active: status }, { where: { id } });
    return { status: 200, message: "Cập nhật trạng thái thành công", success: true, error: false };
  } catch (error) {
    console.error("Error updating user status", error);
    throw new Error("Error", error.message);
  }
};

const updateDataAdmin = async ({ id, ...data }) => {  
  try {
    const checkUser = await User.findOne({ where: { id } });
    
    if (!checkUser) {
      return { status: 404, message: "Người dùng không tồn tại!", success: false, error: true };
    }

    const updateFields = {};
    
    if (data.userData.email) updateFields.email = data.userData.email;
    if (data.userData.username) updateFields.username = data.userData.username;
    if (data.userData.password) updateFields.password = bcrypt.hashSync(data.userData.password, 10);  
    
    if (Object.keys(updateFields).length > 0) {
      await User.update(updateFields, { where: { id } });
      return { status: 200, message: "Cập nhật thành công", updateFields, success: true, error: false };
    }

    return { status: 400, message: "Không có dữ liệu để cập nhật!", success: false, error: true };
  } catch (error) {
    console.error("Error fetching User", error);
    return { status: 500, message: error.message, success: false, error: true };
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  createAdminBranch,
  getAllAdminBranches,
  getStarUser,
  updateStatusForAdmin,
  updateDataAdmin
};
