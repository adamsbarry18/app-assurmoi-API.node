const fs = require('fs')
const path = require('path')
const process = require('process')
const basename = path.basename(__filename)
const db = {}

const { Sequelize } = require('sequelize')
const User = require('./user')
require('dotenv').config()

// const db_username = process.env.DB_USERNAME || 'root';

const dbInstance = new Sequelize(`mariadb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    dialect: 'mariadb',
    dialectOptions: {
        ssl: {
            require: true
        }
    }
})

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(dbInstance, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = {
    dbInstance,
    ...db
}