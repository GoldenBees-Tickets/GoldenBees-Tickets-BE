module.exports = (sequelize, DataTypes) => {
    const FoodAndDrink = sequelize.define(
        "FoodAndDrink",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM('food', 'drink'),
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,
            },
            profile_picture: {
                type: DataTypes.STRING(255),
                allowNull: true,  // Hình ảnh có thể NULL
                defaultValue: null,
            },
        },
        {
            tableName: 'food_and_drinks',  // Chỉ định tên bảng trong cơ sở dữ liệu
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,    // Kích hoạt xóa mềm với `deletedAt`
        }
    );

    return FoodAndDrink;
};
