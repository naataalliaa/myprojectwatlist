// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const email = await resend.emails.send({
      from: 'yourname@example.com',       // ✅ Must be a verified sender
      to: 'youremail@example.com',        // ✅ Your email for testing
      subject: 'Test Email from Resend',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #4F46E5;">Hello!</h1>
          <p>This is a test email sent from your Next.js app using Resend.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
