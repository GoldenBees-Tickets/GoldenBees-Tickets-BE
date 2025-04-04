const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: false
    },
    orderInfo: {
      type: DataTypes.STRING
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Momo'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending'
    },
    transactionId: {
      type: DataTypes.STRING
    },
    paymentTime: {
      type: DataTypes.DATE
    },
    responseData: {
      type: DataTypes.TEXT
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'payments',
    paranoid: true,
    timestamps: true,
    deletedAt: 'deletedAt'
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Payment;
}; 