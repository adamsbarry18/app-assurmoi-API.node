import { Sequelize } from 'sequelize';
import database = require('./database');
import type { EnvConfig } from './database.types';

const env = process.env.NODE_ENV || 'development';
const dbConfig = database[env as keyof EnvConfig];

const dbInstance = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: env === 'development' ? console.log : false,
  }
);

export default database;
export { dbInstance };
