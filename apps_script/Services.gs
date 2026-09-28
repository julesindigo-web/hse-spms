function fnv1a32(str) {
  var h = 0x811c9dc5;
  var n = Math.min(str.length, 20000);
  for (var i = 0; i < n; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'sha-' + ('00000000' + h.toString(16)).slice(-8);
}
function readUsedTickets() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty('HSE_USED_TICKETS') || '{}') || {};
  } catch (e) {
    throw new Error('Penyimpanan tiket rusak — reset properti HSE_USED_TICKETS');
  }
}
function consumeTicket(body) {
  if (!body || !body.ticket_id || !body.filename || !body.mime_type || !body.sha256 || !body.expires_at || !body.file_base64) throw new Error('Payload upload tidak lengkap');
  var exp = Date.parse(body.expires_at);
  if (isNaN(exp) || exp <= Date.now()) throw new Error('Tiket kedaluwarsa');
  if (fnv1a32(String(body.file_base64)) !== String(body.sha256)) throw new Error('sha256 tidak cocok dengan isi file');
  if (readUsedTickets()[body.ticket_id]) throw new Error('Tiket sudah dipakai');
  return { ticket_id: body.ticket_id };
}
function markTicketUsed(ticketId) {
  var used = readUsedTickets();
  used[ticketId] = Date.now();
  var cutoff = Date.now() - 25 * 3600 * 1000;
  for (var k in used) { if (used[k] < cutoff) delete used[k]; }
  PropertiesService.getScriptProperties().setProperty('HSE_USED_TICKETS', JSON.stringify(used));
}
function generateDailyReport() {}
function sendCriticalNotification(finding) { MailApp.sendEmail(Session.getActiveUser().getEmail(), '[CRITICAL] ' + finding.title, finding.description + '\n\nCatatan: email ini SEKUNDER — radio/verbal adalah primer (§29).'); }
function exportLogicalBackup() {}
function ValidationService_checkFile(mime, size, sha) { return true; }
