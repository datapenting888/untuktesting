// api/reset-password.js
// Endpoint: POST https://untuktesting.vercel.app/api/reset-password
// Body: { "email": "user@email.com", "otp": "123456", "newPassword": "passwordbaru" }
//
// PENTING: endpoint ini WAJIB memverifikasi ulang OTP di server (jangan
// percaya begitu saja ke frontend), baru boleh mengganti password akun
// Firebase lewat Firebase Admin SDK. Client TIDAK BISA mengganti password
// akun lain secara langsung — hanya backend dengan service account yang
// boleh melakukan ini.
//
// Perlu install dependency: npm install firebase-admin
//
// Environment variable wajib di Vercel Project Settings:
//   FIREBASE_SERVICE_ACCOUNT -> isi dengan seluruh JSON service account
//     Firebase (Project Settings > Service Accounts > Generate new private
//     key), di-paste sebagai satu baris string JSON.
//   FIREBASE_DATABASE_URL -> https://datapenting888-94bc6-default-rtdb.asia-southeast1.firebasedatabase.app

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

function emailToKey(email) {
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'email, otp, dan newPassword wajib diisi' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  try {
    // 1) Verifikasi ulang OTP dari Realtime Database (jangan percaya client)
    const key = emailToKey(email);
    const snap = await admin.database().ref('otpReset/' + key).once('value');
    const data = snap.val();

    if (!data) return res.status(400).json({ error: 'Kode OTP tidak ditemukan' });
    if (Date.now() > data.expiresAt) return res.status(400).json({ error: 'Kode OTP kedaluwarsa' });
    if (String(data.otp) !== String(otp)) return res.status(400).json({ error: 'Kode OTP salah' });

    // 2) Cari user berdasarkan email, lalu ganti passwordnya
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });

    // 3) Hapus OTP supaya tidak dipakai ulang
    await admin.database().ref('otpReset/' + key).remove();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[reset-password] error:', err);
    return res.status(500).json({ error: 'Gagal reset password' });
  }
};
