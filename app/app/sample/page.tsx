"use client";

import { useEffect } from "react";
import { SAMPLE_TEXT } from "@/lib/labels";
import { buildSampleData } from "@/lib/sample";
import { startSample } from "@/lib/storage";
import { nowIST } from "@/lib/time";

// The link that turns on sample mode. A full page load so every screen starts from the sample.
export default function SamplePage() {
  useEffect(() => {
    startSample(buildSampleData(nowIST().date));
    window.location.replace("/app");
  }, []);

  return <p className="sample-loading">{SAMPLE_TEXT.loading}</p>;
}
