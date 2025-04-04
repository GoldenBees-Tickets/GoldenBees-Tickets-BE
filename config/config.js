require('dotenv').config();

module.exports = {
  development: {
    username: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    host: process.env.MYSQLHOST,
    dialect: "mysql",
    timezone: "+07:00",
    dialectOptions: {
      useUTC: false,
      dateStrings: true,
      typeCast: true
    },
    logging: true
  }
};

