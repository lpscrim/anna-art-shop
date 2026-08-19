// Stripe metadata values are capped at 500 characters each. `reserved_items`
// JSON (which includes image URLs) can exceed that for multi-item carts, so
// large values are split across `${key}_0`, `${key}_1`, ... and rejoined on read.
const CHUNK_SIZE = 480;

export function chunkMetadataValue(key: string, value: string): Record<string, string> {
  if (value.length <= 500) {
    return { [key]: value };
  }
  const chunks: Record<string, string> = {};
  let idx = 0;
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks[`${key}_${idx}`] = value.slice(i, i + CHUNK_SIZE);
    idx++;
  }
  return chunks;
}

export function readChunkedMetadataValue(
  metadata: Record<string, string> | null | undefined,
  key: string,
): string {
  if (!metadata) return '';
  if (metadata[key] !== undefined) return metadata[key];
  let result = '';
  let idx = 0;
  while (metadata[`${key}_${idx}`] !== undefined) {
    result += metadata[`${key}_${idx}`];
    idx++;
  }
  return result;
}
