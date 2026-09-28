import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import router from './routes/route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(router);


app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API rodando com TypeScript!' });
});

app.listen(PORT, () => {
    console.log(` Servidor rodando em http://localhost:${PORT}`);
});