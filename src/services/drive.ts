export { queuePhoto as createUploadTicketCompat, pseudoSha as sha256Hex } from './photos';
import { queuePhoto } from './photos';

export async function createUploadTicket(uidUser: string, inspection_id: string, filename: string, mime: string, dataUrl: string): Promise<string> {
  await queuePhoto({ uidUser, inspection_id, filename, mime, dataUrl });
  return inspection_id;
}
