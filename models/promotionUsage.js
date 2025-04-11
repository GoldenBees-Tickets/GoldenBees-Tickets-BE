
module.exports = (sequelize, DataTypes) => {
  const PromotionUsage = sequelize.define(
    "PromotionUsage",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      promotion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "promotion_usages",
    }
  );
  return PromotionUsage;
};
