export const SPEND_UPLOADS_BUCKET = "spend-uploads";

export function spendWorkbookStoragePath(
  userId: string,
  batchId: string,
  filename: string,
): string {
  const safeName = filename.replace(/[^\w.\-() ]+/g, "_").slice(0, 180);
  return `${userId}/${batchId}/${safeName}`;
}

export function spendParsedStoragePath(userId: string, batchId: string): string {
  return `${userId}/${batchId}/parsed.json`;
}
