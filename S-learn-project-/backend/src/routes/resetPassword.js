import express from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
// import { sendPasswordResetEmail } from '../services/emailService.js'; // removed email flow

const router = express.Router();

// POST /request - send reset email
router.post('/request', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    try {
        const userResult = await pool.query('SELECT * FROM accounts WHERE phone = $1', [phone]);
        if (userResult.rows.length === 0) {
            // Do not reveal whether the phone exists
            return res.status(200).json({ message: 'If the phone exists, an OTP will be sent' });
        }
        // Generate 6‑digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const exp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await pool.query('UPDATE accounts SET reset_otp = $1, reset_otp_exp = $2 WHERE phone = $3', [otp, exp, phone]);
        // Send OTP via SMS (smsService will handle provider specifics)
        const { sendOTP } = await import('../services/smsService.js');
        await sendOTP(phone, otp);
        res.json({ message: 'If the phone exists, an OTP will be sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process OTP request' });
    }
});

// GET /verify?token=...
router.post('/verify', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE phone = $1 AND reset_otp = $2 AND reset_otp_exp > NOW()', [phone, otp]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });
        // OTP is valid – client can now allow password reset
        res.json({ valid: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'OTP verification failed' });
    }
});

// POST /reset - set new password
router.post('/reset', async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) return res.status(400).json({ error: 'Phone, OTP and new password required' });
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE phone = $1 AND reset_otp = $2 AND reset_otp_exp > NOW()', [phone, otp]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE accounts SET password = $1, reset_otp = NULL, reset_otp_exp = NULL WHERE phone = $2', [hashed, phone]);
        res.json({ message: 'Password has been reset' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
