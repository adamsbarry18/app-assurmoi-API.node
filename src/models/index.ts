import fs from 'fs';
import path from 'path';
import { Sequelize, ModelStatic } from 'sequelize';
import { dbInstance } from '../config/config';

const db: {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  [key: string]: ModelStatic<any> | Sequelize | typeof Sequelize;
} = {
  sequelize: dbInstance,
  Sequelize
};

const basename = path.basename(__filename);

// Charger tous les models automatiquement
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.js')
    );
  })
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file));
    const model = modelModule.default || modelModule;

    if (model && model.name) {
      db[model.name] = model;
    }
  });

// Associer les relations si elles existent
Object.keys(db).forEach((modelName) => {
  const model: any = db[modelName];

  if (model && model.associate) {
    model.associate(db);
  }
});

export default db;