import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMISSIONS_EMAIL,
        pass: process.env.ADMISSIONS_EMAIL_PASSWORD,
    },
});

export interface PaymentEmailPayload {
    to: string;
    fullName: string;
    courseName: string;
    paymentCode: string;
    amountCents: number;
    qrImageUrl?: string | null;
}

export async function sendPaymentInstructionsEmail(payload: PaymentEmailPayload) {
    const amount = payload.amountCents / 100;
    
    // Create HTML content
    let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Complete Your Payment</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi <strong>${payload.fullName}</strong>,</p>
                <p style="font-size: 16px; color: #374151;">Thank you for registering for <strong>${payload.courseName}</strong>.</p>
                
                <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                    <p style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: #4338ca; letter-spacing: 0.05em; margin-top: 0;">Your Payment Reference Code</p>
                    <div style="background-color: white; border: 2px dashed #a5b4fc; border-radius: 8px; padding: 16px; display: inline-block; margin-bottom: 8px;">
                        <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #4338ca; letter-spacing: 0.1em;">${payload.paymentCode}</span>
                    </div>
                </div>

                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="color: #92400e; margin-top: 0; margin-bottom: 16px;">Payment Instructions</h3>
                    <ol style="color: #92400e; margin: 0; padding-left: 20px; font-family: Arial, sans-serif; line-height: 1.5;">
                        <li style="margin-bottom: 8px;">Scan the QR code below or use UPI/Bank Transfer.</li>
                        <li style="margin-bottom: 8px;">Enter the amount: <strong>₹${amount}</strong></li>
                        <li style="margin-bottom: 8px;">In the <strong>payment note/reference</strong> field, paste exactly this code: <strong><code style="background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #4338ca;">${payload.paymentCode}</code></strong></li>
                        <li style="margin-bottom: 0;">Complete the payment.</li>
                    </ol>
                </div>
    `;

    if (payload.qrImageUrl) {
        html += `
                <div style="text-align: center; border: 2px dashed #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="color: #111827; margin-top: 0; margin-bottom: 16px;">Scan QR Code to Pay</h3>
                    <img src="${payload.qrImageUrl}" alt="Payment QR Code" style="max-width: 200px; height: auto;" />
                    <p style="font-size: 14px; font-weight: bold; color: #111827; margin-bottom: 0; margin-top: 16px;">Merchant: Ottobon Academy Private Limited</p>
                </div>
        `;
    }

    html += `
                <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 0;">
                    Once your payment is verified using the unique code above, you will receive a confirmation email with access details for your program.
                </p>
            </div>
            <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Ottobon Academy Private Limited. All rights reserved.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: '"Ottobon Admissions" <' + process.env.ADMISSIONS_EMAIL + '>',
        to: payload.to,
        subject: `Payment Instructions for ${payload.courseName}`,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Payment email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending payment email:', error);
        return false;
    }
}
