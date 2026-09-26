// Kompatibilitas: API lama dialihkan ke engine foto produksi (src/services/photos.ts).
export { queuePhoto as createUploadTicketCompat, pseudoSha as sha256Hex } from './photos';
import { queuePhoto } from './photos';

// Signature lama (uid, inspection_id, filename, mime, dataUrl) → antrean produksi.
export async function createUploadTicket(uidUser: string, inspection_id: string, filename: string, mime: string, dataUrl: string): Promise<string> {
  await queuePhoto({ uidUser, inspection_id, filename, mime, dataUrl });
  return inspection_id;
}
