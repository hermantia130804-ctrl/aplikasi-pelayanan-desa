import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendVerificationEmail = async (to: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2>Verifikasi Email Anda</h2>
            <p>Terima kasih telah mendaftar di Aplikasi Pelayanan Desa Sukamaju.</p>
            <p>Klik link di bawah ini untuk memverifikasi email Anda (berlaku 1 jam):</p>
            <p><a href="${verificationUrl}" style="background:#1a1a2e; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Verifikasi Sekarang</a></p>
            <p>Atau salin link ini ke browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p style="color:#888; font-size: 12px;">Abaikan email ini jika Anda tidak merasa mendaftar.</p>
        </div>
    `;
    await transporter.sendMail({
        from: `"Aplikasi Desa Sukamaju" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Verifikasi Email - Desa Sukamaju",
        html,
    });
};
