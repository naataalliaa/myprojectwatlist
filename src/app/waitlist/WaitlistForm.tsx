"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import "./waitlist.css";

export default function WaitlistForm() {
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
    // Keep referral code if already exists or comes from URL
    if (!referralCode) setReferralCode(referral || null);

    try {
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
      if (!referralCode && data.referral_code) setReferralCode(data.referral_code);

      // Only update positions, do NOT overwrite referralCode
      const posRes = await fetch("/api/users");
      const users = await posRes.json();
      const user = users.find((u: any) => u.email === email);

      if (user) {
        setPosition(user.waitlist_position);
        setTop50Position(user.top_position);
        // Only overwrite referralCode if user has it
        if (user.referral_code) setReferralCode(user.referral_code);
      }
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    }
  };

  return (
    <div className="waitlist-container">
      <div className="waitlist-column">
        {/* Logo */}
        <div className="logo">
          <img src="ok.png" alt="Platform Logo" />
          {/* <h2>BLIQZ</h2> */}
        </div>

        <h1>Secure, certify, and prove ownership of your digital content</h1>
        <p className="subtitle">
  First 50 people at launch will get 50% off any subscription
  <br /><br /> 
  Q1 2026
  </p>

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

        {(position !== null || referralCode) && (
          <div className="position-card">
            {position !== null && <p>Your overall position: <strong>#{position}</strong></p>}
            {top50Position !== null && <p>Top 50 rank: <strong>#{top50Position}</strong></p>}
            {referralCode && (
              <p>
                Your referral code: <strong>{referralCode}</strong>
                <br />
                Share your referral link:{" "}
                <a
                  href={`https://www.bliqz.com/waitlist?ref=${referralCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.bliqz.com/waitlist?ref={referralCode}
                </a>
              </p>
            )}
          </div>
        )}

        {referral && !referralCode && (
          <p className="referral-text">
            You joined using referral code: <strong>{referral}</strong>
          </p>
        )}
      </div>

      <div className="features-column">
        <h2>Why Join Us?</h2>
        <div className="feature-box">
          <p>Protect your digital assets with certified ownership records</p>
        </div>
        <div className="feature-box">
          <p>Verify originality and authorship, AI, human or hybrid</p>
        </div>
        <div className="feature-box">
          <p>Share & Transfer securely with traceable logs</p>
        </div>
        <div className="feature-box">
          <p>Get Legal Proof for disputes, DMCA takedowns, and IP enforcement</p>
        </div>
      </div>
    </div>
  );
}
