import { Request, Response, Router } from "express";
import validateUsername from "../middlewares/users";

const router = Router();

 router.post('/', validateUsername, (req: Request, res: Response) => {
    const user = req.body;
    res.status(201).json({ user });
});

router.get('/:id', (req: Request, res: Response) => {
    res.status(200).json({ user: req.params.id });
});


export default router;