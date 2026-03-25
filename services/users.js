const { Op } = require('sequelize');
const { User, dbInstance } = require('../models')

const getAllUsers = async (req, res) => {
    let queryParam = {};
    if(req.query?.search) {
        queryParam = {
            where: {
                firstname : {
                    [Op.like]: `%${req.query.search}%`
                }
            }
        }
    }
    const users = await User.findAll(queryParam);
    res.status(200).json({
        users
    })
}

const getUser = async (req, res) => {
    const id = req.params.id;
    // const user = await User.findByPk(id);
    const user = await User.findOne({
        where: { id }
    })
    res.status(200).json({
        user
    })
}

const createUser = async (req, res) => {
    const transaction = await dbInstance.transaction();
    try {
        const { username, firstname, lastname, email, password } = req.body
        const user = await User.create({
            username,
            firstname,
            lastname,
            email,
            password
        }, { transaction })

        transaction.commit();
        return res.status(201).json({
            user
        })
    } catch(err) {
        transaction.rollback();
        return res.status(400).json({
            message: 'Error on user creation',
            stacktrace: err.errors
        })
    }
}

const updateUser = async (req, res) => {
    const transaction = await dbInstance.transaction();
    try {
        const { username, firstname, lastname, email, password } = req.body
        const user_id = req.params.id
        // meilleur manière de mettre à jour :
        const user = await User.update({
            username,
            firstname,
            lastname,
            email,
            password
        }, {
            where: { id: user_id },
            transaction
        })

        // autre option :
        // const user = await User.findOne({
        //     where: { id: user_id }
        // }, { transaction })
        // user.firstname = firstname
        // user.username = username
        // user.lastname = lastname
        // user.email = email
        // user.password = password
        // await user.save()

        transaction.commit();
        return res.status(200).json({
            message: "Successfuly updated",
            user
        })
    } catch(err) {
        transaction.rollback();
        return res.status(400).json({
            message: 'Error on user update',
            stacktrace: err.errors
        })
    }
}

const deleteUser = async (req, res) => {
    const transaction = await dbInstance.transaction();
    try {
        const user_id = req.params.id
        
        const status = await User.destroy({
            where: { id: user_id },
            transaction
        })

        transaction.commit();
        return res.status(200).json({
            message: "Successfuly deleted",
            status
        })
    } catch(err) {
        transaction.rollback();
        return res.status(400).json({
            message: 'Error on user deletion',
            stacktrace: err.errors
        })
    }
}

module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
}