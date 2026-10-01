import { Request, Response } from "express";
import { ingestDocument, searchAndPrompt, searchDocument } from "../services/service";

export async function createDocument(req: Request, res: Response) {
    const { title, content } = req.body ?? {};

    if (typeof title !== "string" || typeof content !== "string" || !title.trim() || !content.trim()) {
        return res.status(400).json({ error: "Campos obrigatórios: title (string) e content (string)" });
    }

    const result = await ingestDocument(title, content);
    return res.status(201).json(result);
}

export async function search(req: Request, res: Response) {
    const query = String(req.query.q ?? "").trim();
    if (!query) {
        return res.status(400).json({ error: "Parâmetro obrigatório: ?q=sua pergunta" });
    }

    const requestedLimit = Number(req.query.limit ?? 5);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 5;

    const result = await searchAndPrompt(query, limit);

    if (result === null) {
        return res.status(404).json({ error: "Nenhum trecho relevante encontrado para essa busca" });
    }

    return res.status(200).json({
        query,
        totalChunks: result.chunks.length,
        chunks: result.chunks,
        prompt: result.prompt,
    });
}

export async function FindDocumentById(req: Request, res: Response) {
    const result = await searchDocument(Number(req.params.id));
    return res.status(200).json({ result })
}