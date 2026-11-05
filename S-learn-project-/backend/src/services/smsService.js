import twilio from 'twilio';

// Load credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('Twilio credentials not set – SMS will not be sent.');
}

/**
 * Send an OTP SMS to the given phone number.
 * @param {string} toPhone - Recipient phone number in E.164 format (e.g. +15551234567)
 * @param {string} otp - 6‑digit OTP string
 */
export const sendOTP = async (toPhone, otp) => {
    if (!client) {
        console.log(`[SMS MOCK] Would send OTP ${otp} to ${toPhone}`);
        return;
    }
    try {
        await client.messages.create({
            body: `Your S‑Learn password reset code is ${otp}. It expires in 10 minutes.`,
            from: fromNumber,
            to: toPhone,
        });
        console.log(`OTP sent to ${toPhone}`);
    } catch (err) {
        console.error('Failed to send SMS:', err);
        throw err;
    }
};
