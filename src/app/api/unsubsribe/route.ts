import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("waitlist")
      .update({ subscribed: false })
      .eq("email", email);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return new Response(
      `<html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>You have been unsubscribed ✅</h2>
        <p>${email} will no longer receive waitlist updates.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
