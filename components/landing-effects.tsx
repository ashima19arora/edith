"use client";

import { useEffect } from "react";

// Scroll-in, count-up and the closing skyline. The page is complete without this: it only adds motion,
// and only to things not yet on screen, so nothing is ever hidden if scripts don't run.
export function LandingEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const offscreen = (el: Element) => el.getBoundingClientRect().top > window.innerHeight;
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("lp-shown");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!offscreen(el)) return;
      el.classList.add("lp-hidden");
      reveal.observe(el);
    });

    const frames: number[] = [];
    function countUp(el: HTMLElement) {
      const target = Number(el.dataset.count);
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / 1500);
        el.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
        if (progress < 1) frames.push(requestAnimationFrame(step));
      };
      frames.push(requestAnimationFrame(step));
    }
    const counts = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target as HTMLElement);
        counts.unobserve(entry.target);
      }
    });
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      if (Number(el.dataset.count) > 0) counts.observe(el);
    });

    const skyline = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("lp-run");
        skyline.unobserve(entry.target);
      }
    }, { threshold: 0.2 });
    document.querySelectorAll(".lp-sequence").forEach((el) => {
      el.classList.add("lp-armed");
      skyline.observe(el);
    });

    return () => {
      reveal.disconnect();
      counts.disconnect();
      skyline.disconnect();
      frames.forEach(cancelAnimationFrame);
    };
  }, []);

  return null;
}
