// api/send-otp.js
// Endpoint: POST https://untuktesting.vercel.app/api/send-otp
// Body: { "email": "user@email.com", "otp": "123456" }
//
// Tugas endpoint ini HANYA mengirim email berisi kode OTP.
// Kode OTP sendiri sudah dibuat & disimpan oleh frontend (index.html) di
// Firebase Realtime Database path "otpReset/{emailKey}".
//
// Perlu install dependency: npm install nodemailer
//
// Environment variables yang wajib di-set di Vercel Project Settings:
//   SMTP_HOST      -> contoh: smtp.gmail.com
//   SMTP_PORT      -> contoh: 465
//   SMTP_USER      -> alamat email pengirim
//   SMTP_PASS      -> App Password email pengirim (bukan password biasa)

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Izinkan dipanggil dari index.html (sesuaikan origin kalau perlu lebih ketat)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'email dan otp wajib diisi' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"UY LAB" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Kode OTP Reset Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;">
          <h2>Kode OTP Reset Password</h2>
          <p>Gunakan kode berikut untuk reset password akun Anda:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;">${otp}</p>
          <p>Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapa pun.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-otp] error:', err);
    return res.status(500).json({ error: 'Gagal mengirim email' });
  }
};
