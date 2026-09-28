import { db } from '../db';
import { documents, documentChunks, queryLogs, NewDocument, NewDocumentChunk, NewQueryLog } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface ChunkSearchResult {
    id: number;
    documentId: number | null;
    chunkIndex: number;
    content: string;
    documentTitle: string;
    rank: number;
}

export class RagRepository {
    // Salva um documento base
    static async createDocument(data: NewDocument) {
        const [result] = await db.insert(documents).values(data).returning();
        return result;
    }

    // Busca documento por ID
    static async getDocumentById(id: number) {
        const [result] = await db.select().from(documents).where(eq(documents.id, id));
        return result || null;
    }

    // Lista todos os documentos
    static async listDocuments() {
        return await db.select().from(documents).orderBy(desc(documents.createdAt));
    }

    static async getDocumentsByTitle(title: string) {
        const [result] = await db.select().from(documents).where(eq(documents.title, title));
        return result || null;
    }

    // Cria um chunk/fragmento de texto com embedding opcional para RAG
    static async createChunk(data: NewDocumentChunk) {
        const [result] = await db.insert(documentChunks).values(data).returning();
        return result;
    }

    // Insere vários chunks de uma vez (usado na ingestão de documentos)
    static async createChunks(data: NewDocumentChunk[]) {
        if (data.length === 0) return [];
        return await db.insert(documentChunks).values(data).returning();
    }

    // Busca chunks associados a um documento
    static async getChunksByDocumentId(documentId: number) {
        return await db
            .select()
            .from(documentChunks)
            .where(eq(documentChunks.documentId, documentId));
    }

    // Busca textual (full-text search) nos chunks, ordenada por relevância
    static async searchChunksByRelevance(query: string, limit = 5): Promise<ChunkSearchResult[]> {
        // websearch_to_tsquery aceita texto cru do usuário (aspas, OR, -termo) sem erro de parse
        const tsQuery = sql`websearch_to_tsquery('portuguese', ${query})`;

        return await db
            .select({
                id: documentChunks.id,
                documentId: documentChunks.documentId,
                chunkIndex: documentChunks.chunkIndex,
                content: documentChunks.content,
                documentTitle: documents.title,
                // ts_rank pontua de 0 a ~0.1 o quanto o chunk casa com a busca
                rank: sql<number>`ts_rank(to_tsvector('portuguese', ${documentChunks.content}), ${tsQuery})`,
            })
            .from(documentChunks)
            .innerJoin(documents, eq(documents.id, documentChunks.documentId))
            // @@ é o operador "contém estes tokens de busca?"
            .where(sql`to_tsvector('portuguese', ${documentChunks.content}) @@ ${tsQuery}`)
            .orderBy(desc(sql`rank`))
            .limit(limit);
    }

    // Registra logs de perguntas, contextos e respostas da IA
    static async logQuery(data: NewQueryLog) {
        const [result] = await db.insert(queryLogs).values(data).returning();
        return result;
    }

    // Busca histórico recente de interações
    static async getRecentLogs(limit = 10) {
        return await db.select().from(queryLogs).orderBy(desc(queryLogs.createdAt)).limit(limit);
    }
}
