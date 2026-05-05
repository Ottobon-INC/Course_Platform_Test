import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
    console.log('Testing email with:', process.env.ADMISSIONS_EMAIL);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMISSIONS_EMAIL,
            pass: process.env.ADMISSIONS_EMAIL_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.ADMISSIONS_EMAIL,
            to: process.env.ADMISSIONS_EMAIL,
            subject: 'Test Email',
            text: 'This is a test email to verify credentials.',
        });
        console.log('Success:', info.messageId);
    } catch (error) {
        console.error('Failed:', error);
    }
}

testEmail();
