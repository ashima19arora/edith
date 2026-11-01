import { Suspense } from "react";
import { CheckinScreen } from "@/components/checkin-screen";

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinScreen />
    </Suspense>
  );
}
