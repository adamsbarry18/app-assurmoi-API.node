import { Express } from 'express';
import { Request, Response, NextFunction } from 'express';
import userRoutes from './users';

function initRoutes(app: Express) {
 // Définition des routes par métier
app.use('/user', userRoutes);

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Middleware
    console.log('middleware 1 homepage');
    next();
}, (req: Request, res: Response) => {
    // Controller
    console.log('controller homepage');
    res.status(200).json({ message: 'Bienvenue sur la route d\'accueil' });
});
}

export default initRoutes;
