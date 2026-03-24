import { Request, Response } from 'express';

function getAllUsers(req: Request, res: Response) {
    res.status(200).json({ 
        users: [] 
    });
}

function getUserById(req: Request, res: Response) {
    res.status(200).json({ user: req.params.id });    
}

function createUser(req: Request, res: Response) {
    const user = req.body;
    res.status(201).json({ user });
}

function updateUser(req: Request, res: Response) {
    const userUpdate = req.body;
    res.status(200).json({ 
        user: userUpdate, 
        message: `User with id ${req.params.id} successfully updated` 
    });
}

function deleteUser(req: Request, res: Response) {
    res.status(200).send({
        message: `User with id ${req.params.id} successfully deleted`
    });
}

export {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
}