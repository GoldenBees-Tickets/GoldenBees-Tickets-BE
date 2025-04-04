module.exports = (sequelize, DataTypes) => {
    const PaymentSetting = sequelize.define(
        "PaymentSetting",
        {
            provider_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            payment_method: {
                type: DataTypes.ENUM('e-wallet', 'bank_transfer', 'credit_card'),
                allowNull: false,
            },
            api_url: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            sandbox_mode: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            timestamps: true,
            paranoid: false,   
        }
    );

    return PaymentSetting;
};
