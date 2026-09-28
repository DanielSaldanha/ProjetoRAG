import { ingestDocument, searchAndPrompt } from './src/services/service';

async function main() {
  const ing = await ingestDocument(
    'Guia Rápido de TypeScript',
    'TypeScript é um superset de JavaScript que adiciona tipagem estática ao linguagem. ' +
    'Os tipos ajudam a evitar erros em tempo de compilação antes do código rodar. ' +
    'Interfaces descrevem a forma de objetos e contratos entre partes do código. ' +
    'O compilador tsc transforma TypeScript em JavaScript puro que roda em qualquer navegador. ' +
    'Generics permitem criar componentes reutilizáveis com segurança de tipos. ' +
    'TypeScript foi criado pela Microsoft e é mantido em código aberto.'
  );
  console.log('Ingestão OK — documento id:', ing.document.id, '| chunks criados:', ing.totalChunks);

  const result = await searchAndPrompt('o que TypeScript adiciona ao JavaScript', 3);
  if (!result) {
    console.log('NADA ENCONTRADO');
    return;
  }
  console.log('Chunks encontrados:', result.chunks.length);
  console.log('--- PROMPT MONTADO ---');
  console.log(result.prompt);
  process.exit(0);
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
