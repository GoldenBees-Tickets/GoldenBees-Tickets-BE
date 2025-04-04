module.exports = (sequelize, DataTypes) => {
    const ComboItem = sequelize.define(
        "ComboItem",
        {
            combo_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'combo_items',  // Chỉ định tên bảng trong cơ sở dữ liệu
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            paranoid: true,   // Kích hoạt xóa mềm với `deletedAt`
        }
    );
    return ComboItem;
};
