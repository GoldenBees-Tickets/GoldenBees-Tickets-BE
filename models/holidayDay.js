module.exports = (sequelize, DataTypes) => {
    const HolidayDate = sequelize.define(
      'HolidayDate', 
      {
        holiday_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        holiday_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        tableName: 'holiday_dates', 
        timestamps: true, 
        paranoid: false,
      }
    );
  
  
    return HolidayDate;
  };
  