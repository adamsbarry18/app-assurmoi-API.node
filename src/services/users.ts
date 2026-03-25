import { Request, Response } from 'express';
import User from '../models/user';
import { dbInstance } from '../config/config';
import { Op } from 'sequelize';

async function getAllUsers(req: Request, res: Response) {
  let queryParams = {};

  if(req.query?.search) {
    queryParams = { 
        where: {
            firstName: {
                [Op.like]: `%${req.query.search}%`
            }
        }
    };
  }

  try {
    const users = await User.findAll(queryParams);
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
}

async function getUserById(req: Request, res: Response) {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l’utilisateur' });
  }
}


async function createUser(req: Request, res: Response) {
    // pour plusieurs opérations de base de données(ex: créer un utilisateur et associer des rôles)
    const transaction = await dbInstance.transaction();
  try {
    const { userName, password, email, firstName, lastName } = req.body;
    const user = await User.create({ userName, password, email, firstName, lastName }, { transaction });
    await transaction?.commit();
    res.status(201).json({ user });
  } catch (err: any) {
    await transaction?.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de l’utilisateur', stacktrace: err.errors });
  }
}

async function updateUser(req: Request, res: Response) {
  const transaction = await dbInstance.transaction();

  try {
    const { userName, password, email, firstName, lastName } = req.body;

    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }
    await user.update({ userName, password, email, firstName, lastName }, { transaction });
    await transaction?.commit();

    res.status(200).json({
      user,
      message: `User with id ${req.params.id} successfully updated`,
    });
  } catch (err:any) {
    await transaction?.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour', stacktrace: err.errors });
  }
}

async function deleteUser(req: Request, res: Response) {
  const transaction = await dbInstance.transaction();
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }
    await user.destroy();
    await transaction?.commit();
    res.status(200).json({
      message: `User with id ${req.params.id} successfully deleted`,
    });
  } catch (err:any) {
    await transaction?.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression', stacktrace: err.errors });
  }
}

export {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
