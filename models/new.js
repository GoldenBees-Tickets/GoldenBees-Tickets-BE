module.exports = (sequelize, DataTypes) => {
    const New = sequelize.define(
        "New",
        {
            title: {
                type: DataTypes.STRING(255),
                allowNull: false, 
            },
          
            content: {
                type: DataTypes.JSON,
                allowNull: false,
            },
        },
        {
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,    // Kích hoạt xóa mềm với `deletedAt`
        }
    );

    return New;
};
