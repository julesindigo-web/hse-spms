function FirestoreService_getTicket(ticketId) { throw new Error('Konfigurasi Firestore REST di Properties terlebih dahulu'); }
function generateDailyReport() {}
function sendCriticalNotification(finding) { MailApp.sendEmail(Session.getActiveUser().getEmail(), '[CRITICAL] ' + finding.title, finding.description + '\n\nCatatan: email ini SEKUNDER — radio/verbal adalah primer (§29).'); }
function exportLogicalBackup() {}
function ValidationService_checkFile(mime, size, sha) { return true; }
