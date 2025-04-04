module.exports = (sequelize, DataTypes) => {
    const Producer = sequelize.define(
        "Producer",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true, 
                defaultValue: null,
            },
            profile_picture: {
                type: DataTypes.STRING(255),
                allowNull: true, 
                defaultValue: null,
            },
        },
        {
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,    // Kích hoạt xóa mềm với `deletedAt`
        }
    );

    return Producer;
};
