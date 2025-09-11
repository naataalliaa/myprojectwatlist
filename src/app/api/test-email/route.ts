// src/app/api/send-waitlist-email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailData {
  email: string;
  position: number;
  top50Position: number | null;
  referralCode: string;
  type: "welcome" | "position_update";
}

export async function POST(req: Request) {
  try {
    const { email, position, top50Position, referralCode, type } = (await req.json()) as EmailData;

    // Check subscription
    const { data: user } = await supabase
      .from("waitlist")
      .select("subscribed")
      .eq("email", email)
      .single();

    if (user && user.subscribed === false) {
      return NextResponse.json({ success: false, message: "User unsubscribed" }, { status: 403 });
    }

    const subject =
      type === "welcome"
        ? "Welcome to Our Waitlist!"
        : "Your Waitlist Position Has Changed! ⚡";

    const greeting =
      type === "welcome"
        ? "Hi there, thank you for joining our waitlist! We’re excited to have you on board."
        : "Hi there, your waitlist position has been updated! Check out your latest status below.";

    const unsubscribeLink = `https://www.bliqz.com/api/unsubscribe?email=${encodeURIComponent(email)}`;

    // HTML version
    const emailHtml = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333; margin:0; padding:0; background-color:#f9fafb;">
    <div style="max-width:600px; margin:20px auto; padding:30px; border:1px solid #e5e7eb; border-radius:12px; background-color:#f9fafb;">
      <!-- Logo -->
      <div style="text-align:center; margin-bottom:25px;">
        <img src="https://www.bliqz.com/ok.png" alt="Bliqz Logo" style="width:120px; height:auto;" />
      </div>

      <!-- Heading -->
      <h1 style="color:#4F46E5; text-align:center;">${type === "welcome" ? "Welcome to Bliqz!" : "Your Waitlist Update!"}</h1>

      <!-- Greeting -->
      <p style="text-align:center;">${greeting}</p>

      <!-- Waitlist Info -->
      <div style="background:#fff; padding:20px; border-radius:10px; border:1px solid #e0e0e0; margin-bottom:25px;">
        <h2 style="color:#111827;">Your Waitlist Info</h2>
        <ul style="list-style:none; padding-left:0;">
          <li><strong>Overall position:</strong> #${position}</li>
          ${top50Position !== null ? `<li><strong>Top 50 rank:</strong> #${top50Position}</li>` : ""}
          <li><strong>Your referral code:</strong> ${referralCode}</li>
          <li><strong>Share your referral link:</strong> <a href="https://www.bliqz.com/waitlist?ref=${referralCode}" target="_blank" style="color:#4F46E5;">https://www.bliqz.com/waitlist?ref=${referralCode}</a></li>
        </ul>
      </div>

      <!-- Call to Action -->
      <p style="text-align:center;">
        ${type === "welcome"
          ? "Invite friends and climb the waitlist faster! Enjoy perks like 50% off any subscription."
          : "Keep sharing your referral link to climb higher on the waitlist!"}
      </p>

      <!-- Unsubscribe -->
      <p style="text-align:center; font-size:12px; color:#666;">
        If you want to unsubscribe, click <a href="${unsubscribeLink}" style="color:#4F46E5;">here</a>.
      </p>

      <!-- Footer -->
      <p style="text-align:center; font-size:14px; color:#999;">
        &copy; ${new Date().getFullYear()} Bliqz. The Team
      </p>
    </div>
  </body>
</html>
`;

    // Plain-text fallback
    const emailText = `
${greeting}

Your Waitlist Info:
- Overall position: #${position}
${top50Position !== null ? `- Top 50 rank: #${top50Position}` : ""}
- Your referral code: ${referralCode}
- Share your referral link: https://www.bliqz.com/waitlist?ref=${referralCode}

${type === "welcome"
  ? "Invite friends and climb the waitlist faster! Enjoy perks like 50% off any subscription."
  : "Keep sharing your referral link to climb higher on the waitlist!"}

To unsubscribe, visit: ${unsubscribeLink}

The Team
`;

    const emailResponse = await resend.emails.send({
      from: "welcome@bliqz.com",
      to: email,
      subject,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true, emailResponse });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
