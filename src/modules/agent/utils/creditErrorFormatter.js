// agent-service/utils/creditErrorFormatter.js

export function formatCreditError(error) {
  const { code, details = {} } = error;

  if (code === "INSUFFICIENT_CREDITS") {
    return `
## 💳 Insufficient Credits

You need **${details.required ?? "more"}** credits, but you only have **${details.available ?? 0}**.

[**Buy Credits**](/billing) to continue.
    `.trim();
  }

  if (code === "PLAN_EXPIRED") {
    return `
## ⏰ Plan Expired

Your plan has expired${
      details.planExpiresAt
        ? ` on **${new Date(details.planExpiresAt).toLocaleDateString()}**`
        : ""
    }.

[**Renew Plan**](/billing) to continue.
    `.trim();
  }

  if (code === "SERVICE_UNAVAILABLE") {
    return `
## 🔌 Service Temporarily Unavailable

We couldn't process your credits right now. Please try again in a moment.
    `.trim();
  }

  if (code === "USER_NOT_FOUND") {
    return `
## 👤 User Not Found

Your account couldn't be found. Please log in again.
    `.trim();
  }

  return `
## ❌ Credit Error

${error.message}
  `.trim();
}