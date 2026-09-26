var ROOT_NAME = 'HSE SAFETY PATROL';
function DriveService_root() {
  var it = DriveApp.getFoldersByName(ROOT_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_NAME);
}
function DriveService_uploadEvidence(filename, base64, mime) {
  if (['image/jpeg', 'image/png', 'application/pdf'].indexOf(mime) < 0) throw new Error('MIME tidak diizinkan');
  var blob = Utilities.newBlob(Utilities.base64Decode(base64.split(',').pop()), mime, filename);
  if (blob.getBytes().length > 10 * 1024 * 1024) throw new Error('File >10MB');
  return DriveService_root().createFile(blob);
}
