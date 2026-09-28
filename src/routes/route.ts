import { Router, Request, Response } from 'express';
import { createDocument, search } from "../controllers/controller";

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Ingestão: recebe um documento e salva ele + os chunks
router.post('/documents', createDocument);

// Busca: ?q=pergunta&limit=5 → retorna chunks relevantes + prompt montado
router.get('/search', search);

export default router;
