module.exports = (sequelize, DataTypes) => {
    const Promotion = sequelize.define(
        "Promotion",
        {
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            discount_type: {
                type: DataTypes.ENUM('percentage', 'fixed_amount'),
                allowNull: false,
            },
            discount_value: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: false,
            },
            applicable_to: {
                type: DataTypes.ENUM('ticket', 'food', 'total_bill', 'other'),
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING(50),
                allowNull: true,
                unique: true,  
            },
            min_order_value: {
                type: DataTypes.DECIMAL(10, 0),
                defaultValue: 0, 
            },
            max_discount: { //giảm tối đa bao nhiêu (áp dụng cho %)
                type: DataTypes.DECIMAL(10, 0),
                defaultValue: null, 
            },
            usage_limit: {
                type: DataTypes.INTEGER, //giới hạn số lượng dùng tổng cộng
                defaultValue: null, 
            },
            per_user_limit: { //giới hạn số lần dùng của 1 user
                type: DataTypes.INTEGER,
                defaultValue: null, 
            },
        },
        {
            timestamps: true,
            paranoid: true, 
        }
    );

    Promotion.beforeCreate((promotion) => {
        if (!promotion.code) { // Chỉ tạo code nếu chưa có
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            promotion.code = `DISCOUNT${randomSuffix}`;
        }
    });

    return Promotion;
};
