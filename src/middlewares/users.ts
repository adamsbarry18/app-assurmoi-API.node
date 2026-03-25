
import express, { Express, Request, Response, NextFunction } from 'express';
import { checkSchema } from "express-validator";


async function validateUsername(req: Request, res: Response, next: NextFunction) {
    const [ hasError ] = await checkSchema({
        userName: { notEmpty: true }
    }).run(req);

    if (hasError.isEmpty()) {
        return next();
    } 

    return res.status(400).json({ message: 'Username is missing' });
    
}

export default validateUsername;