// src/app/api/send-waitlist-email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface EmailData {
  email: string;
  position: number;
  top50Position: number | null;
  referralCode: string;
  type: "welcome" | "position_update"; // distinguish the type of email
}

export async function POST(req: Request) {
  try {
    const { email, position, top50Position, referralCode, type } = (await req.json()) as EmailData;

    const subject =
      type === "welcome"
        ? "Welcome to Our Waitlist!"
        : "Your Waitlist Position Has Changed! ⚡";

    const greeting =
      type === "welcome"
        ? "Hi there, thank you for joining our waitlist! We’re excited to have you on board."
        : "Hi there, your waitlist position has been updated! Check out your latest status below.";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #f9fafb;">
        
        <!-- Logo / Photo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.bliqz.com/ok.png" alt="Bliqz Logo" style="width: 120px; height: auto;" />
        </div> 

        <h1 style="color: #4F46E5;">${type === "welcome" ? "Welcome!" : "Update Alert!"}</h1>
        <p>${greeting}</p>

        <h2 style="margin-top: 20px;">Your Waitlist Info:</h2>
        <ul>
          <li><strong>Overall position:</strong> #${position}</li>
          ${top50Position !== null ? `<li><strong>Top 50 rank:</strong> #${top50Position}</li>` : ""}
          <li><strong>Your referral code:</strong> ${referralCode}</li>
          <li><strong>Share your referral link:</strong> <a href="https://www.bliqz.com/waitlist?ref=${referralCode}" target="_blank">https://www.bliqz.com/waitlist?ref=${referralCode}</a></li>
        </ul>

        <p style="margin-top: 20px;">
          ${type === "welcome"
            ? "Keep inviting friends to increase your position and get 50% off any subscription!"
            : "Keep sharing your referral link to climb higher on the waitlist!"}
        </p>

        <p><br/>The Team</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "welcome@bliqz.com", 
      to: email,
      subject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, emailResponse });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
