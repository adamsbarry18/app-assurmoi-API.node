const { Model, DataTypes, Sequelize } = require('sequelize')

const User = (dbInstance, DataTypes) => {
    class User extends Model {
        // static associate(models) {
        //     this.belongsTo(models.Person, {
        //         foreignKey: 'person_id',
        //         as: 'Person'
        //     })
        // }
    }

    User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            firstname: {
                type: DataTypes.STRING,
                allowNull: true
            },
            lastname: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: DataTypes.STRING
        },
        {
            sequelize: dbInstance,
            modelName: 'User',
            tableName: 'User',
            timestamps: false
        }
    )

    return User;
}

module.exports = User