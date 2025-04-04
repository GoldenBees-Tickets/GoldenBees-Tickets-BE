module.exports = (sequelize, DataTypes) => {
    const Actor = sequelize.define(
        "Actor",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            dob: {
                type: DataTypes.DATE,
                allowNull: true,  // Ngày sinh có thể NULL
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,  // Bio có thể NULL
                defaultValue: null,
            },
            gender: {
                type: DataTypes.ENUM('Male', 'Female', 'Other'),
                allowNull: true,  // Giới tính có thể NULL
            },
            profile_picture: {
                type: DataTypes.STRING(255),
                allowNull: true,  // Hình ảnh có thể NULL
                defaultValue: null,
            },
        },
        {
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,    // Kích hoạt xóa mềm với `deletedAt`
        }
    );

    return Actor;
};
