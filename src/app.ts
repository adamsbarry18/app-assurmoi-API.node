import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World! This is a TypeScript Express server.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
