import { Request, Response, Router } from "express";
import validateUsername from "../middlewares/users";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../services/users";

const router = Router();

router.get('/', getAllUsers);

router.get('/:id', getUserById);

router.post('/', validateUsername, createUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);


export default router;