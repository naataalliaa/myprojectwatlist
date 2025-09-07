"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import "./waitlist.css";

export default function WaitlistPage() {
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
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referral }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update state directly from signup response
        setStatus(data.message || "Successfully signed up!");
        setReferralCode(data.referral_code || null);
        setPosition(data.waitlist_position || null);
        setTop50Position(data.top_position || null);
      } else {
        setStatus(data.message || data.error || "Error signing up");
      }
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    }
  };

  return (
    <div className="waitlist-container">
      {/* Left Waitlist Column */}
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
                Your referral code: <strong>{referralCode}</strong><br />
                Share your referral link: <a href={`https://yourdomain.com/waitlist?ref=${referralCode}`} target="_blank" rel="noopener noreferrer">https://yourdomain.com/waitlist?ref={referralCode}</a>
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

      {/* Right Features Column */}
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
