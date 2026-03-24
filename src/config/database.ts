import dotenv from 'dotenv';
import type { EnvConfig } from './database.types';

dotenv.config();

const database: EnvConfig = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'assurmoidb',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mariadb',
  },
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'assurmoidb_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mariadb',
  },
  production: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'assurmoidb_prod',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mariadb',
  },
};


export = database;
