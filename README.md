# Backend OTP Email — untuktesting.vercel.app

Backend kecil untuk 2 kebutuhan `index.html`:
1. **Kirim email OTP** saat user klik "Lupa Password".
2. **Ganti password akun Firebase** setelah OTP diverifikasi ulang di server.

## Struktur folder
```
vercel-otp-backend/
  api/
    send-otp.js         -> POST /api/send-otp
    reset-password.js   -> POST /api/reset-password
  package.json
```

## Cara pakai
1. `npm install` di folder ini (butuh `nodemailer` dan `firebase-admin`).
2. Deploy ke project Vercel `untuktesting` (`vercel --prod`, atau hubungkan repo ke Vercel).
3. Set Environment Variables di Vercel Project Settings → Environment Variables:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (untuk kirim email — bisa pakai Gmail App Password, atau provider seperti Resend/SendGrid SMTP)
   - `FIREBASE_SERVICE_ACCOUNT` (isi JSON service account Firebase, dari Firebase Console → Project Settings → Service Accounts → Generate new private key — paste sebagai satu baris)
   - `FIREBASE_DATABASE_URL` = `https://datapenting888-94bc6-default-rtdb.asia-southeast1.firebasedatabase.app`
4. Redeploy setelah env variable diisi.

## Kenapa perlu backend (tidak bisa full client-side)?
- Mengirim email butuh kredensial SMTP/API key yang **tidak boleh** ditaruh di kode client (index.html), karena siapa pun bisa lihat lewat "View Source".
- Mengganti password akun Firebase milik user lain (saat itu user belum login) **hanya bisa** lewat Firebase Admin SDK di server — client biasa tidak punya izin ini walaupun sudah tahu OTP-nya benar.

Kalau endpoint di `untuktesting.vercel.app` sudah punya nama path yang beda dari `/api/send-otp` dan `/api/reset-password`, tinggal ubah dua baris ini di `index.html`:
```js
const OTP_SEND_URL       = OTP_BACKEND_BASE + "/api/send-otp";
const OTP_RESET_PASS_URL = OTP_BACKEND_BASE + "/api/reset-password";
```
