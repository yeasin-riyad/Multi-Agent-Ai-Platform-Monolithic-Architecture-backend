// src/modules/billing/billing.service.js
import { updateUserPaymentService } from "../auth/auth.service.js";

/**
 * Update user payment after successful SSLCommerz transaction.
 * Direct call — no HTTP, no internal secret.
 *
 * Throws on failure — caller must handle.
 */
export async function updateUserAfterPayment({
  userId,
  plan,
  credits,
  orderId,
}) {
  return updateUserPaymentService({
    userId,
    plan,
    credits,
    orderId,
  });
}