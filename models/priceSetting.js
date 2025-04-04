module.exports = (sequelize, DataTypes) => {
    const PriceSetting = sequelize.define(
        "PriceSetting",
        {
            base_ticket_price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,
            },
            weekend_ticket_price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,
            },
            holiday_ticket_price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,
            },
        },
        {
            tableName: 'price_settings', 
            timestamps: true, 
            paranoid: true, 
        }
    );

    return PriceSetting;
};
