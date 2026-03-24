import { Sequelize } from "sequelize";

require('dotenv').config();

const dbInstance = new Sequelize(`mariadb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    dialect: 'mariadb',
    dialectOptions: {
        ssl: {
            require: true
        }
    },
});

export default dbInstance;