import { RagRepository, ChunkSearchResult } from "../repositories/repository";
import { chunkText } from "./chunker";

const DEFAULT_CHUNK_SIZE = 400;
const DEFAULT_CHUNK_OVERLAP = 60;

// ETAPA 1 — INGESTÃO: salva o documento e o divide em chunks
export async function ingestDocument(title: string, content: string) {
    const chunks = chunkText(content, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP);

    const document = await RagRepository.createDocument({ title, content });

    await RagRepository.createChunks(
        chunks.map((chunkContent, index) => ({
            documentId: document.id,
            content: chunkContent,
            chunkIndex: index,
            metadata: title,
        }))
    );

    return { document, totalChunks: chunks.length };
}

// ETAPA 2 — RETRIEVAL: busca os chunks mais relevantes para a pergunta
export async function retrieveChunks(query: string, limit = 5): Promise<ChunkSearchResult[]> {
    return RagRepository.searchChunksByRelevance(query, limit);
}

// ETAPA 3 — AUGMENTATION: monta o prompt final com o contexto recuperado
export function buildPrompt(query: string, chunks: ChunkSearchResult[]): string {
    const context = chunks
        .map(
            (chunk, i) =>
                `[Trecho ${i + 1} | documento: "${chunk.documentTitle}" | relevância: ${chunk.rank.toFixed(4)}]\n${chunk.content}`
        )
        .join("\n\n");

    return [
        "Você é um assistente que responde EXCLUSIVAMENTE com base no contexto abaixo.",
        "Se a resposta não estiver no contexto, responda que não possui essa informação.",
        "",
        "### CONTEXTO",
        context,
        "",
        "### PERGUNTA",
        query,
    ].join("\n");
}

// Pipeline completo: busca + prompt montado (a chamada de IA entraria aqui depois)
export async function searchAndPrompt(query: string, limit = 5) {
    const chunks = await retrieveChunks(query, limit);
    if (chunks.length === 0) {
        return null;
    }
    return { chunks, prompt: buildPrompt(query, chunks) };
}
