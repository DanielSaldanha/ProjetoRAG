// Tamanho máximo de cada chunk em caracteres
const CHUNK_SIZE = 400;
// Quantidade de caracteres repetidos entre chunks vizinhos
// (garante que uma ideia cortada no limite continue legível no próximo chunk)
const CHUNK_OVERLAP = 60;

export function chunkText(text: string, size: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  // Normaliza o texto: quebras de linha e espaços múltiplos viram um espaço só
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    // Evita cortar uma palavra no meio: recua o fim até o último espaço
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }

    chunks.push(clean.slice(start, end).trim());

    // O próximo chunk começa `overlap` caracteres antes do fim deste
    const nextStart = end - overlap;
    start = nextStart > start ? nextStart : start + 1;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}
