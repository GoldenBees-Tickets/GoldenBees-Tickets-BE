const { uniq } = require("lodash");

module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define(
        "Order",
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            total: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: false,
            },
            showtime_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('pending', 'completed', 'canceled', 'paid'),
                allowNull: true, 
                defaultValue: 'pending',  
            },
            order_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            refund_status: {
                type: DataTypes.ENUM('none', 'requested', 'approved', 'rejected'),
                allowNull: false,
                defaultValue: 'none',  
            },
            qr_code: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: '',  
            },
        },
        {
            timestamps: true, 
        }
    );

    return Order;
};
