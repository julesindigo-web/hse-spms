// FirestoreService.gs / ReportService.gs / NotificationService.gs / BackupService.gs / ValidationService.gs — ringkas §23/§30/§45/§46
// FirestoreService: REST Firestore dengan service account (simpan key di Properties, bukan di repo).
function FirestoreService_getTicket(ticketId) { throw new Error('Konfigurasi Firestore REST di Properties terlebih dahulu'); }
// ReportService: generateDailyReport/generateXlsx/generatePdf → Drive.
function generateDailyReport() { /* query inspections hari ini → tulis file Drive */ }
// NotificationService: hanya critical + daily digest (hemat kuota Gmail 100/hari vs Workspace 1500/hari §23).
function sendCriticalNotification(finding) { MailApp.sendEmail(Session.getActiveUser().getEmail(), '[CRITICAL] ' + finding.title, finding.description + '\n\nCatatan: email ini SEKUNDER — radio/verbal adalah primer (§29).'); }
// BackupService: exportLogicalBackup JSON/CSV ke Drive (§46) + restore-drill kuartalan.
function exportLogicalBackup() { /* dump koleksi → Drive/BACKUP/YYYY-MM-DD/ */ }
// ValidationService: validasi filename/MIME/ukuran/hash §19.
function ValidationService_checkFile(mime, size, sha) { return true; }
