import { DataTypes, Model } from 'sequelize';
import dbInstance from '../config/database';

class User extends Model {

    /* 
    static associate(models: any) {
       Define associations here if needed
        this.belongsToMany(models.Person, 
            { 
                foreignKey: 'person_id',
                as: 'Person',
                through: 'Person' // Nom de la table de jonction
            });
    }
    */
}

User.init(
  {
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: dbInstance,
    tableName: 'users'
  }
);

export default User;