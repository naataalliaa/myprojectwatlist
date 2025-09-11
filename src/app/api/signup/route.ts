import { supabase } from '@/lib/supbase';
import { resend } from '@/lib/resend';
import { generateReferralCode } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, referral } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Check if already signed up
    const { data: existingUser, error: existingError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error("Supabase existingUser error:", existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ message: "Already signed up!" }, { status: 400 });
    }

    const referralCode = generateReferralCode();

    // 2. Get total users to calculate waitlist_position
    const { count: totalUsers, error: countError } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error("Supabase count error:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const waitlistPosition = (totalUsers || 0) + 1;

    // 3. Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('waitlist')
      .insert([{
        email,
        referral_code: referralCode,
        referred_by: referral || null,
        waitlist_position: waitlistPosition,
        referral_count: 0
      }])
      .select('*')
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (!newUser) {
      throw new Error("No user returned after insert");
    }

    // 4. Send confirmation email to new user
    await resend.emails.send({
      from: "Waitlist <onboarding@yourdomain.com>",
      to: email,
      subject: "You joined the waitlist!",
      html: `<p>Your overall position is #${waitlistPosition}</p>
             <p>Share your referral link: 
             <a href="https://yourdomain.com/waitlist?ref=${referralCode}">Referral Link</a></p>`
    });

    // 5. Handle referral logic
    let referrerEmail: string | null = null;
    if (referral) {
      const { data: referrer } = await supabase
        .from('waitlist')
        .select('*')
        .eq('referral_code', referral)
        .single();

      if (referrer) {
        referrerEmail = referrer.email;

        // Increase referral count
        // await supabase
        //   .from('waitlist')
        //   .update({ referral_count: (referrer.referral_count || 0) + 1 })
        //   .eq('id', referrer.id);

           // ✅ Atomic referral count increment
        await supabase.rpc("increment_referral_count", { referrer_id: referrer.id });

        // ✅ Re-fetch referrer after increment
        const { data: updatedReferrer } = await supabase
        .from('waitlist')
       .select('*')
       .eq('id', referrer.id)
       .single();

       if (updatedReferrer) {
        // Move referrer up 2 spots
        // const newPosition = Math.max(referrer.waitlist_position - 2, 1);
        const newPosition = Math.max(updatedReferrer.waitlist_position - 2, 1);

        // if (newPosition < referrer.waitlist_position) {
          if (newPosition < updatedReferrer.waitlist_position) {
          // Shift other users down so positions remain unique
          await supabase.rpc("shift_users_down", {
            new_pos: newPosition,
            // old_pos: referrer.waitlist_position
            old_pos: updatedReferrer.waitlist_position
          });

          // Update referrer position
          await supabase
            .from('waitlist')
            .update({ waitlist_position: newPosition })
            .eq('id', updatedReferrer.id);
        }
      }
    }
 }

    // 6. Recalculate Top 50
    const { data: allUsers } = await supabase
      .from('waitlist')
      .select('id,email,referral_count,waitlist_position')
      .order('referral_count', { ascending: false });

    if (!allUsers) throw new Error("Failed to fetch users for Top 50");

    const top50 = allUsers.slice(0, 50);

    // Reset Top 50 flags
    await supabase.from('waitlist').update({ in_top_50: false, top_position: null });

    for (let i = 0; i < top50.length; i++) {
      const user = top50[i];
      await supabase
        .from('waitlist')
        .update({ in_top_50: true, top_position: i + 1 })
        .eq('id', user.id);
    }

    // Notify new user if in Top 50
    const newUserTop = top50.findIndex(u => u.email === email) + 1;
    if (newUserTop > 0 && newUserTop <= 50) {
      await resend.emails.send({
        from: "Waitlist <onboarding@yourdomain.com>",
        to: email,
        subject: `You're in Top 50! #${newUserTop}`,
        html: `<p>Congrats! Top 50 position: #${newUserTop}</p>
               <p>Overall position: #${waitlistPosition}</p>`
      });
    }

    // Notify referrer safely
    if (referrerEmail) {
      const { data: referrerData } = await supabase
        .from('waitlist')
        .select('waitlist_position')
        .eq('email', referrerEmail)
        .single();

      if (referrerData) {
        const referrerTop = top50.findIndex(u => u.email === referrerEmail) + 1;
        await resend.emails.send({
          from: "Waitlist <onboarding@yourdomain.com>",
          to: referrerEmail,
          subject: "Your position updated!",
          html: `<p>Your referral joined the waitlist!</p>
                 <p>Top 50: ${referrerTop > 0 ? "#" + referrerTop : "Not yet"}</p>
                 <p>Overall: #${referrerData.waitlist_position}</p>`
        });
      }
    }

    return NextResponse.json({
      message: "Signed up successfully!",
      referral_code: newUser.referral_code,
      waitlist_position: newUser.waitlist_position,
      top_position: newUser.top_position || null
    }, { status: 200 });

  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
