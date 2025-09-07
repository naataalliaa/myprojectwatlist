"use client";

import { Suspense } from "react";
import WaitlistForm from "./WaitlistForm";

export const dynamic = "force-dynamic";

export default function WaitlistPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WaitlistForm />
    </Suspense>
  );
}
