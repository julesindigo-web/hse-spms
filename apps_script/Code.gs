// Code.gs — doPost §19/§23: verify token → cek tiket → validasi file → Drive → update tiket.
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var token = verifyFirebaseIdToken(body.idToken);
    var ticketId = body.ticket_id;
    // TODO: baca tiket dari Firestore via FirestoreService (REST + service account).
    // var ticket = FirestoreService_getTicket(ticketId);
    // if (!ticket || ticket.status !== 'QUEUED') throw new Error('Tiket invalid');
    // if (new Date(ticket.expires_at) < new Date()) throw new Error('Tiket expired');
    // if (ticket.uid !== token.uid) throw new Error('Ticket uid mismatch');
    var file = DriveService_uploadEvidence(body.filename, body.file_base64, body.mime_type);
    // FirestoreService_updateTicket(ticketId, {status:'UPLOADED', drive_file_id: file.getId()});
    return ContentService.createTextOutput(JSON.stringify({ ok: true, drive_file_id: file.getId(), uid: token.uid })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() { return ContentService.createTextOutput('HSE SPMS bridge aktif. Gunakan POST + ID Token.'); }
