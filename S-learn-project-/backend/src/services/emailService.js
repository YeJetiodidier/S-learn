import nodemailer from 'nodemailer';

// Load environment variables for SMTP configuration
const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.warn(`Warning: Environment variable ${key} is not set. Email service may not work.`);
    }
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify connection configuration at startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready to send messages');
    }
});

export const sendPasswordResetEmail = async (toEmail, token) => {
    // Ensure required env vars are present before attempting to send
    const missing = [];
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missing.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
    if (!process.env.FRONTEND_URL) missing.push('FRONTEND_URL');

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    if (missing.length > 0) {
        console.warn('Email service missing env vars:', missing.join(', '));
        console.log(`Would send password reset link to ${toEmail}: ${resetLink}`);
        // In development mode we just log the link instead of sending
        return;
    }

    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: 'S‑Learn Password Reset Request',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
            html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${toEmail}`);
    } catch (err) {
        console.error('Failed to send password reset email:', err);
        throw err;
    }
};
