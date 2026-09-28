function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '');
    var ticket = consumeTicket(body);
    var boundUid = null;
    if (body.idToken) boundUid = verifyFirebaseIdToken(body.idToken).uid;
    var file = DriveService_uploadEvidence(body.filename, body.file_base64, body.mime_type);
    markTicketUsed(ticket.ticket_id);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, drive_file_id: file.getId(), ticket_id: ticket.ticket_id, token_uid: boundUid })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String((err && err.message) || err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() { return ContentService.createTextOutput('HSE SPMS bridge aktif. Gunakan POST + ID Token.'); }
