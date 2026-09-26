// TokenVerificationService.gs — §23 RULE-023: verifikasi Firebase ID Token independen.
// JANGAN percaya uid client / tiket saja. Secrets di Properties (§23).
function verifyFirebaseIdToken(idToken) {
  var props = PropertiesService.getScriptProperties();
  var projectId = props.getProperty('FIREBASE_PROJECT_ID');
  if (!idToken) throw new Error('Missing idToken');
  // Validasi via Google Identity Toolkit (sederhana, tanpa library eksternal):
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=' + props.getProperty('FIREBASE_API_KEY'), {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  if (code !== 200) throw new Error('Invalid ID token: ' + code);
  var data = JSON.parse(resp.getContentText());
  var uid = data.users && data.users[0] && data.users[0].localId;
  if (!uid) throw new Error('Token tanpa uid');
  // TODO produksi: cek aud==projectId, exp, auth_time via cert JWT penuh.
  return { uid: uid };
}
