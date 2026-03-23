import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import initRoutes from './routes';

dotenv.config();

const app: Express = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(cors( {
    credentials: true, // Autoriser les cookies et les informations d'identification
    origin: ['http://localhost:8000', 'https://yourdomain.com', '*'], // whitelist des origines autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
    allowedHeaders: ['Content-Type', 'Authorization'] // En-têtes autorisés
}));

initRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
