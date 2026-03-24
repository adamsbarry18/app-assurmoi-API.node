import sequelize from '../config/database';
import User from './user';

const db = {
  sequelize,
  User,
};

export default db;