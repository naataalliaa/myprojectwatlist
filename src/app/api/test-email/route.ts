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

    // Check if user is subscribed
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

    // Add unsubscribe link
    const unsubscribeLink = `https://www.bliqz.com/api/unsubscribe?email=${encodeURIComponent(email)}`;

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
  
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 25px;">
        <img src="https://www.bliqz.com/ok.png" alt="Bliqz Logo" style="width: 120px; height: auto;" />
      </div>
  
      <!-- Heading -->
      <h1 style="color: #4F46E5; font-size: 24px; margin-bottom: 15px; text-align: center;">
        ${type === "welcome" ? "Welcome to Bliqz!" : "Your Waitlist Update!"}
      </h1>
  
      <!-- Greeting -->
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
        ${greeting}
      </p>
  
      <!-- Waitlist Info Card -->
      <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; border: 1px solid #e0e0e0; margin-bottom: 25px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #111827;">Your Waitlist Info</h2>
        <ul style="list-style: none; padding-left: 0; line-height: 1.6; font-size: 16px;">
          <li><strong>Overall position:</strong> #${position}</li>
          ${top50Position !== null ? `<li><strong>Top 50 rank:</strong> #${top50Position}</li>` : ""}
          <li><strong>Your referral code:</strong> ${referralCode}</li>
          <li><strong>Share your referral link:</strong> <a href="https://www.bliqz.com/waitlist?ref=${referralCode}" target="_blank" style="color: #4F46E5; text-decoration: none;">https://www.bliqz.com/waitlist?ref=${referralCode}</a></li>
        </ul>
      </div>
  
      <!-- Call to Action -->
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
        ${type === "welcome"
          ? "Invite friends and climb the waitlist faster! Enjoy perks like 50% off any subscription."
          : "Keep sharing your referral link to climb higher on the waitlist!"}
      </p>
  
      <!-- Unsubscribe -->
      <p style="font-size: 12px; color: #666; text-align: center; margin-bottom: 0;">
        If you want to unsubscribe from these emails, click <a href="${unsubscribeLink}" style="color: #4F46E5; text-decoration: none;">here</a>.
      </p>
  
      <!-- Footer -->
      <p style="font-size: 14px; color: #999; text-align: center; margin-top: 10px;">
        &copy; ${new Date().getFullYear()} Bliqz. All rights reserved.
      </p>
    </div>

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
