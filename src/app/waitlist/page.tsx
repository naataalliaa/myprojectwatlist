"use client";

import { Suspense } from "react";
import WaitlistFormComponent from "./WaitlistForm"; // rename import

export default function WaitlistForm() { // wrapper
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WaitlistFormComponent />
    </Suspense>
  );
}
