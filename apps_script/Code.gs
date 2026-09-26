function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var token = verifyFirebaseIdToken(body.idToken);
    var ticketId = body.ticket_id;
    var file = DriveService_uploadEvidence(body.filename, body.file_base64, body.mime_type);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, drive_file_id: file.getId(), uid: token.uid })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() { return ContentService.createTextOutput('HSE SPMS bridge aktif. Gunakan POST + ID Token.'); }
