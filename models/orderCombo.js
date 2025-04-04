module.exports = (sequelize, DataTypes) => {
    const OrderCombo = sequelize.define(
        "OrderCombo",
        {
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            combo_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // Số lượng combo mặc định là 1
            },
        },
        {
            timestamps: false, // Không dùng createdAt, updatedAt
            tableName: "order_combos", // Đảm bảo tên bảng trùng với SQL
        }
    );

    return OrderCombo;
};
