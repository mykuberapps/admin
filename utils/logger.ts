export async function logAction(action: string, details?: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    let userId = null;
    let userEmail = null;
    let userRole = "admin";

    try {
      const userSessionStr = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
      if (userSessionStr) {
        const user = JSON.parse(userSessionStr);
        userId = user.id || null;
        userEmail = user.email || null;
        userRole = user.role || "admin";
      }
    } catch (_) {}

    await fetch(`${apiUrl}/admin/logs/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "web-admin",
        userId,
        userEmail,
        userRole,
        action,
        details: details ? (typeof details === "string" ? details : JSON.stringify(details)) : null,
      }),
    });
  } catch (err) {
    console.error("Failed to post client log:", err);
  }
}
