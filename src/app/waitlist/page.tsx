"use client";

export const dynamic = 'force-dynamic'; // <-- add this line at the top

import { Suspense } from "react";
import WaitlistFormComponent from "./WaitlistForm"; // renamed import

export default function WaitlistForm() { // wrapper
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WaitlistFormComponent />
    </Suspense>
  );
}

