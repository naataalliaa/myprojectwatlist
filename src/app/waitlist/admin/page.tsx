"use client";
import { useEffect, useState } from "react";

interface User {
  email: string;
  referral_count: number;
  waitlist_position: number;
  in_top_50: boolean;
  top_position: number | null;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(setUsers);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Waitlist Admin</h1>
      <table className="border w-full">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Referrals</th>
            <th className="border p-2">Top 50 Position</th>
            <th className="border p-2">Overall Position</th>
            <th className="border p-2">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className={u.in_top_50 ? "bg-yellow-100" : ""}>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.referral_count}</td>
              <td className="border p-2">{u.top_position || ""}</td>
              <td className="border p-2">{u.waitlist_position || ""}</td>
              <td className="border p-2">{new Date(u.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
