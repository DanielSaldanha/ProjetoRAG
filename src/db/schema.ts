import { pgTable, serial, text, timestamp, jsonb, integer, vector } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documentChunks = pgTable('document_chunks', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),//conteudo
  chunkIndex: integer('chunk_index').notNull().default(0),
  // Suporte a embeddings de vetores (ex: 1536 dimensões para modelos OpenAI text-embedding-3-small/ada-002 ou 768 para BERT/outros)
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata'),//dados complementares, como urls, fontes.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const queryLogs = pgTable('query_logs', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  contextRetrieved: text('context_retrieved'),
  response: text('response'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type QueryLog = typeof queryLogs.$inferSelect;
export type NewQueryLog = typeof queryLogs.$inferInsert;
