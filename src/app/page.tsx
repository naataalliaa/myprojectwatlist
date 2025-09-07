"use client";

import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to /waitlist
  redirect("/waitlist");
}

