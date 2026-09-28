function verifyFirebaseIdToken(idToken) {
  var props = PropertiesService.getScriptProperties();
  var projectId = props.getProperty('FIREBASE_PROJECT_ID');
  var apiKey = props.getProperty('FIREBASE_API_KEY');
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID belum dikonfigurasi di Script Properties');
  if (!apiKey) throw new Error('FIREBASE_API_KEY belum dikonfigurasi di Script Properties');
  if (!idToken) throw new Error('Missing idToken');
  var payload = readJwtPayload(idToken);
  var now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('Token bukan untuk project ini (aud)');
  if (payload.iss !== 'https://securetoken.google.com/' + projectId) throw new Error('Issuer token salah (iss)');
  if (!payload.sub) throw new Error('Token tanpa sub');
  if (!payload.exp || payload.exp <= now) throw new Error('Token kedaluwarsa (exp)');
  if (payload.auth_time && payload.auth_time > now) throw new Error('Waktu auth token invalid');
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=' + apiKey, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error('Token ditolak Google: ' + resp.getResponseCode());
  var data = JSON.parse(resp.getContentText());
  var uid = data.users && data.users[0] && data.users[0].localId;
  if (!uid) throw new Error('Token tanpa uid');
  if (uid !== payload.sub) throw new Error('UID token tidak konsisten');
  return { uid: uid };
}
function readJwtPayload(idToken) {
  try {
    var parts = String(idToken).split('.');
    if (parts.length !== 3) throw new Error('format');
    var b64 = parts[1];
    while (b64.length % 4 !== 0) b64 += '=';
    var bytes = Utilities.base64DecodeWebSafe(b64, Utilities.Charset.UTF_8);
    return JSON.parse(Utilities.newBlob(bytes).getDataAsString());
  } catch (e) {
    throw new Error('Payload ID token tidak terbaca');
  }
}
