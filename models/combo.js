module.exports = (sequelize, DataTypes) => {
    const Combo = sequelize.define(
        "Combo",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,  // Giá có thể NULL nếu không có giá cụ thể
            },
            profile_picture: {
                type: DataTypes.TEXT,
                allowNull: true,  // Hình ảnh có thể NULL
                defaultValue: null,
            },
        },
        {
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,    // Kích hoạt xóa mềm với `deletedAt`
        }
    );
    return Combo;
};
