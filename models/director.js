module.exports = (sequelize, DataTypes) => {
    const Director = sequelize.define(
        "Director",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            dob: {
                type: DataTypes.DATE,
                allowNull: true, 
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true, 
                defaultValue: null,
            },
            gender: {
                type: DataTypes.ENUM('Male', 'Female', 'Other'),
                allowNull: true, 
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

    return Director;
};
