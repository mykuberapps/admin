"use client";

import { useEffect } from "react";

export default function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleWindowError = async (event: ErrorEvent) => {
      // Prevent reporting issues from reporting tool itself
      if (event.filename && event.filename.includes("GlobalErrorHandler")) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const errorMsg = event.message || (event.error && event.error.message) || "Unknown Client Error";
      const stack = event.error && event.error.stack;
      const culprit = event.filename 
        ? `${event.filename}:${event.lineno}:${event.colno}` 
        : "unknown client source";

      try {
        await fetch(`${apiUrl}/admin/sentry/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: "web-admin",
            title: `UncaughtError: ${errorMsg}`,
            culprit,
            stack,
            level: "error",
          }),
        });
      } catch (e) {
        // Fallback to console
        console.error("Failed to report global error:", e);
      }
    };

    const handlePromiseRejection = async (event: PromiseRejectionEvent) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const error = event.reason;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const culprit = "unhandled promise rejection";

      try {
        await fetch(`${apiUrl}/admin/sentry/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: "web-admin",
            title: `UnhandledRejection: ${errorMsg}`,
            culprit,
            stack,
            level: "error",
          }),
        });
      } catch (e) {
        console.error("Failed to report unhandled rejection:", e);
      }
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handlePromiseRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handlePromiseRejection);
    };
  }, []);

  return <>{children}</>;
}
