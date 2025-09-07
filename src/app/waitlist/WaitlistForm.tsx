"use client"; // Must be at the very top

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import "./waitlist.css";

export default function waitlistform() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [top50Position, setTop50Position] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const referral = useSearchParams().get("ref");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    setPosition(null);
    setTop50Position(null);
    setReferralCode(null);

    try {
      // Signup API
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referral }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || data.error || "Error signing up");
        return;
      }

      setStatus(data.message || "Successfully signed up!");
      setReferralCode(data.referral_code || null);

      // Fetch latest user info to get positions
      const posRes = await fetch("/api/users");
      const users = await posRes.json();
      const user = users.find((u: any) => u.email === email);

      if (user) {
        setPosition(user.waitlist_position);
        setTop50Position(user.top_position);
        setReferralCode(user.referral_code);
      }
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    }
  };

  return (
    <div className="waitlist-container">
      <div className="waitlist-column">
        <h1>Join the Waitlist</h1>
        <p className="subtitle">Be part of the first 50 to get exclusive benefits!</p>

        <form onSubmit={handleSubmit} className="waitlist-form">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Join Now</button>
        </form>

        {status && <p className="status-text">{status}</p>}

        {(position || referralCode) && (
          <div className="position-card">
            {position && <p>Your overall position: <strong>#{position}</strong></p>}
            {top50Position && <p>Top 50 rank: <strong>#{top50Position}</strong></p>}
            {referralCode && (
              <p>
                Your referral code: <strong>{referralCode}</strong>
                <br />
                Share your referral link:{" "}
                <a
                  href={`https://yourdomain.com/waitlist?ref=${referralCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://yourdomain.com/waitlist?ref={referralCode}
                </a>
              </p>
            )}
          </div>
        )}

        {referral && (
          <p className="referral-text">
            You joined using referral code: <strong>{referral}</strong>
          </p>
        )}
      </div>

      <div className="features-column">
        <h2>Why Join Us?</h2>
        <div className="feature-box">
          <span>🚀</span>
          <p>Early access to cutting-edge features</p>
        </div>
        <div className="feature-box">
          <span>💡</span>
          <p>Exclusive referral rewards</p>
        </div>
        <div className="feature-box">
          <span>📈</span>
          <p>Track your waitlist position in real-time</p>
        </div>
        <div className="feature-box">
          <span>🔒</span>
          <p>Secure and private email management</p>
        </div>
      </div>
    </div>
  );
}
