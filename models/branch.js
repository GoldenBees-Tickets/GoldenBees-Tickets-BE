module.exports = (sequelize, DataTypes) => {
    const Branch = sequelize.define(
      "Branch",
      {
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        city: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        timestamps: true, // Automatically manage `createdAt` and `updatedAt`
      }
    );
  
    return Branch;
  };
  