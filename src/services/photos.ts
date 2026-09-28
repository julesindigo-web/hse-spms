import { put, uid, metaGet, metaPut, list, get } from './store';
import { APPS_SCRIPT_URL } from './firebase';

export interface DriveSettings { appsScriptUrl: string; driveFolder: string; updated_at: string; updated_by: string; }

export async function getDriveSettings(): Promise<DriveSettings> {
  const s = await metaGet('drive_settings');
  if (s) return s;
  return { appsScriptUrl: APPS_SCRIPT_URL ?? '', driveFolder: 'HSE SAFETY PATROL', updated_at: '', updated_by: '' };
}
export async function saveDriveSettings(s: DriveSettings): Promise<void> {
  await metaPut('drive_settings', s);
}

export async function testDriveConnection(): Promise<{ ok: boolean; msg: string }> {
  const s = await getDriveSettings();
  if (!s.appsScriptUrl) return { ok: false, msg: 'Belum dikonfigurasi: isi Apps Script Web App URL di Admin → Drive (lihat README). Foto tetap tersimpan aman di antrean lokal.' };
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(s.appsScriptUrl, { method: 'GET', signal: ctrl.signal });
    clearTimeout(to);
    if (r.ok) return { ok: true, msg: 'Bridge Apps Script reachable (GET 200). Upload memakai POST + tiket sekali pakai.' };
    return { ok: false, msg: `Bridge merespons HTTP ${r.status}. Periksa deployment Web App (Execute as: Me, Access: Anyone).` };
  } catch (e: any) {
    return { ok: false, msg: `Tidak dapat menjangkau bridge (${e?.message ?? e}). Foto aman di antrean lokal, akan retry saat online.` };
  }
}

export async function compressPhoto(file: File, maxDim = 1600, quality = 0.82): Promise<{ dataUrl: string; width: number; height: number; size_kb: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, w, h);
  let q = quality, dataUrl = cv.toDataURL('image/jpeg', q);
  while (dataUrl.length / 1024 > 800 && q > 0.55) { q -= 0.08; dataUrl = cv.toDataURL('image/jpeg', q); }
  return { dataUrl, width: w, height: h, size_kb: Math.round(dataUrl.length / 1024) };
}

export function pseudoSha(s: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < Math.min(s.length, 20000); i++) { h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 0x01000193) >>> 0; }
  return 'sha-' + h1.toString(16).padStart(8, '0');
}

export async function queuePhoto(opts: {
  uidUser: string; inspection_id: string; checklist_id?: string; filename: string; mime: string;
  dataUrl: string; lat?: number; lng?: number; acc?: number;
}): Promise<string> {
  const id = uid('att');
  const size_kb = Math.round(opts.dataUrl.length / 1024);
  const sha256 = pseudoSha(opts.dataUrl);
  const expires_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await put('attachments', {
    id, inspection_id: opts.inspection_id, checklist_id: opts.checklist_id,
    filename: opts.filename, mime: opts.mime, sha256,
    size_kb, drive_file_id: '', upload_status: 'QUEUED',
    dataUrl: opts.dataUrl, lat: opts.lat, lng: opts.lng, acc: opts.acc,
    taken_by: opts.uidUser, taken_at: new Date().toISOString()
  });
  const ticket_id = uid('tkt');
  await put('tickets', {
    id: ticket_id, ticket_id, uid: opts.uidUser, inspection_id: opts.inspection_id,
    filename: opts.filename, mime_type: opts.mime, sha256,
    status: 'QUEUED', expires_at, attachment_id: id
  });
  try {
    const s = await getDriveSettings();
    if (s.appsScriptUrl) {
      await fetch(s.appsScriptUrl, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ticket_id, filename: opts.filename, mime_type: opts.mime, sha256, expires_at, file_base64: opts.dataUrl, note: 'hse-spms-upload' })
      });
    }
  } catch {}
  return id;
}

export async function retryTicket(ticket_id: string): Promise<string> {
  const s = await getDriveSettings();
  if (!s.appsScriptUrl) return 'Bridge belum dikonfigurasi — foto tetap aman lokal.';
  const t = (await list('tickets')).find((x: any) => x.ticket_id === ticket_id);
  if (!t) return 'Tiket tidak ditemukan di antrean lokal.';
  const a = await get('attachments', t.attachment_id);
  if (!a?.dataUrl) return 'File lokal tidak ditemukan — foto ulang diperlukan.';
  try {
    const r = await fetch(s.appsScriptUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ ticket_id, filename: t.filename, mime_type: t.mime_type, sha256: t.sha256, expires_at: t.expires_at, file_base64: a.dataUrl, note: 'retry' })
    });
    return r.ok ? 'Retry terkirim ke bridge.' : `Bridge HTTP ${r.status}.`;
  } catch (e: any) { return `Gagal retry: ${e?.message ?? e}`; }
}
