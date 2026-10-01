import { trace, SpanStatusCode } from "@opentelemetry/api";
import { RagRepository, ChunkSearchResult, DocSearch } from "../repositories/repository";
import { chunkText } from "./chunker";
import { Log } from "../logs/createLog";

const DEFAULT_CHUNK_SIZE = 400;
const DEFAULT_CHUNK_OVERLAP = 60;

// ETAPA 1 — INGESTÃO: salva o documento e o divide em chunks
export async function ingestDocument(title: string, content: string) {
    try {
        const chunks = chunkText(content, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP);

        const document = await RagRepository.createDocument({ title, content });
        try {

            await RagRepository.createChunks(
                chunks.map((chunkContent, index) => ({
                    documentId: document.id,
                    content: chunkContent,
                    chunkIndex: index,
                    metadata: title,
                }))
            );
        } catch (error) {
            const log = Log.createChunkFailed("Erro ao criar chunk")
            throw new Error(log + " " + error)

        }
        return { document, totalChunks: chunks.length };
    }
    catch (error) {
        throw new Error("Erro ao acessar o banco " + error)

    }
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

export async function searchDocument(id: number): Promise<DocSearch | null> {
    // Cria um span manual, filho do span automático da requisição HTTP.
    // Necessário porque o driver "postgres" (postgres.js) não tem
    // auto-instrumentação oficial — sem isso, a query ficaria invisível no tracing.
    // O tracer obtido aqui já herda o contexto da requisição em andamento.
    const span = trace.getTracer('treinamento-rag').startSpan('searchDocument');
    // Anexa o ID buscado como atributo do span (visível/searchable no Jaeger)
    span.setAttribute('document.id', id);
    try {
        // A query em si — o tempo de execução dela será a duração deste span
        return await RagRepository.getDocumentById(id);
    } catch (error) {
        // Registra o stack trace da exceção dentro do span (evento de exceção)
        span.recordException(error as Error);
        // Marca o span como ERROR — a trace fica vermelha no Jaeger
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
    } finally {
        // Finaliza o span e agenda o envio ao backend.
        // Sem isso a trace nunca é exportada — roda mesmo com sucesso ou erro.
        span.end();
    }
}