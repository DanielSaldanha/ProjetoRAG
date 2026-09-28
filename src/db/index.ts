import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ AVISO: A variável de ambiente DATABASE_URL não foi definida no arquivo .env');
}

// Cliente de conexão PostgreSQL com postgres.js
export const queryClient = postgres(connectionString || 'postgresql://postgres:postgres@localhost:5432/rag_db', {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Instância do Drizzle ORM com o schema tipado
export const db = drizzle(queryClient, { schema });

export * from './schema';
