import crypto from "crypto";
import axios from "axios"; // ⚠️ শুধু SSLCommerz validation-এ লাগবে
import SSLCommerzPayment from "sslcommerz-lts";

import Payment from "./payment.model.js";
import { PLANS } from "./config/Plan.js";
import { updateUserAfterPayment } from "./billing.service.js";

/* ──────────────────────────────────────────────────────────────── */
/*  Config                                                       */
/* ──────────────────────────────────────────────────────────────── */

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWD;
const is_live = process.env.IS_LIVE === "true";
const BASE_URL = process.env.BASE_URL || "http://localhost:8000";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const VALIDATION_API = is_live
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

/* ================================================================ */
/*  CREATE ORDER                                                  */
/* ================================================================ */

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user?.userId; // ⭐ authProtect থেকে

    if (!userId) {
      return res.status(401).json({ message: "User ID missing" });
    }

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    /* ─── Free plan — no gateway ──────────────────────────────── */
    if (selectedPlan.amount === 0) {
      const orderId = `FREE_${Date.now()}`;

      const payment = await Payment.create({
        userId,
        orderId,
        amount: 0,
        credits: selectedPlan.credits,
        plan: selectedPlan.id,
        status: "paid",
        paidAt: new Date(),
      });

      // ⭐ Direct call — auth module-এ credit add
      try {
        await updateUserAfterPayment({
          userId,
          plan: selectedPlan.id,
          credits: selectedPlan.credits,
          orderId,
        });
      } catch (err) {
        console.error("❌ Failed to activate free plan:", err.message);
      }

      return res.status(200).json({
        success: true,
        message: "Free plan activated",
        data: payment,
      });
    }

    /* ─── Paid plan — SSLCommerz ──────────────────────────────── */
    const tran_id = `TXN_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const payment = await Payment.create({
      userId,
      orderId: tran_id,
      amount: selectedPlan.amount,
      currency: "BDT",
      credits: selectedPlan.credits,
      plan: selectedPlan.id,
      status: "created",
    });

    const data = {
      total_amount: selectedPlan.amount,
      currency: "BDT",
      tran_id,

      success_url: `${BASE_URL}/api/billing/success`,
      fail_url: `${BASE_URL}/api/billing/fail`,
      cancel_url: `${BASE_URL}/api/billing/cancel`,
      ipn_url: `${BASE_URL}/api/billing/ipn`,

      shipping_method: "No",
      product_name: selectedPlan.name,
      product_category: "Subscription",
      product_profile: "non-physical-goods",

      cus_name: req.user?.name || req.body.name || "Customer",
      cus_email: req.user?.email || req.body.email || "customer@example.com",
      cus_add1: "N/A",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: req.body.phone || "01711111111",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (!apiResponse?.GatewayPageURL) {
      payment.status = "failed";
      await payment.save();
      return res.status(502).json({ message: "Gateway init failed" });
    }

    payment.paymentId = apiResponse.sessionkey;
    await payment.save();

    return res.status(200).json({
      success: true,
      url: apiResponse.GatewayPageURL,
      orderId: tran_id,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ================================================================ */
/*  VALIDATION HELPER                                             */
/* ================================================================ */

async function validateWithSSLCommerz(val_id) {
  const { data } = await axios.get(VALIDATION_API, {
    params: { val_id, store_id, store_passwd, format: "json" },
  });
  return data;
}

/* ================================================================ */
/*  FULFILL ORDER                                                 */
/* ================================================================ */

async function fulfillOrder({ val_id, tran_id }) {
  const payment = await Payment.findOne({ orderId: tran_id });

  if (!payment) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  /* ─── Idempotency guard ─────────────────────────────────────── */
  if (payment.status === "paid") {
    return { ok: true, payment, alreadyPaid: true };
  }

  /* ─── Validate with SSLCommerz ──────────────────────────────── */
  const validation = await validateWithSSLCommerz(val_id);

  if (!["VALID", "VALIDATED"].includes(validation.status)) {
    payment.status = "failed";
    payment.rawResponse = validation;
    await payment.save();
    return { ok: false, reason: validation.status };
  }

  /* ─── Amount + currency check ───────────────────────────────── */
  if (Number(validation.amount) < Number(payment.amount)) {
    payment.status = "failed";
    payment.rawResponse = validation;
    await payment.save();
    return { ok: false, reason: "AMOUNT_MISMATCH" };
  }

  if (validation.currency !== "BDT") {
    payment.status = "failed";
    payment.rawResponse = validation;
    await payment.save();
    return { ok: false, reason: "CURRENCY_MISMATCH" };
  }

  /* ─── Mark paid ─────────────────────────────────────────────── */
  payment.status = "paid";
  payment.valId = validation.val_id;
  payment.bankTranId = validation.bank_tran_id;
  payment.paidAt = new Date();
  payment.rawResponse = validation;
  await payment.save();

  /* ⭐ Direct call — auth module-এ user update */
  try {
    await updateUserAfterPayment({
      userId: payment.userId,
      plan: payment.plan,
      credits: payment.credits,
      orderId: payment.orderId,
    });
  } catch (err) {
    console.error("❌ Failed to update user:", err.message);
    // Throw করো না — payment already paid
    // TODO: retry queue / cron
  }

  console.log(
    `✅ Payment fulfilled: ${tran_id} (${payment.credits} credits)`,
  );

  return { ok: true, payment };
}

/* ================================================================ */
/*  SUCCESS / FAIL / CANCEL / IPN                                 */
/* ================================================================ */

export const paymentSuccess = async (req, res) => {
  try {
    const { val_id, tran_id } = req.body;
    const result = await fulfillOrder({ val_id, tran_id });

    if (result.ok) {
      return res.redirect(
        `${CLIENT_URL}/payment/success?tran_id=${tran_id}`,
      );
    }
    return res.redirect(
      `${CLIENT_URL}/payment/failed?tran_id=${tran_id}&reason=${result.reason}`,
    );
  } catch (error) {
    console.error("paymentSuccess error:", error);
    return res.redirect(`${CLIENT_URL}/payment/failed`);
  }
};

export const paymentIPN = async (req, res) => {
  try {
    const { val_id, tran_id, status } = req.body;

    if (status !== "VALID" && status !== "VALIDATED") {
      return res.status(200).send("Ignored");
    }

    await fulfillOrder({ val_id, tran_id });
    return res.status(200).send("OK");
  } catch (error) {
    console.error("paymentIPN error:", error);
    return res.status(200).send("Error logged");
  }
};

export const paymentFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    await Payment.findOneAndUpdate(
      { orderId: tran_id },
      { status: "failed", rawResponse: req.body },
    );
    return res.redirect(`${CLIENT_URL}/payment/failed?tran_id=${tran_id}`);
  } catch (error) {
    console.error("paymentFail error:", error);
    return res.redirect(`${CLIENT_URL}/payment/failed`);
  }
};

export const paymentCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    await Payment.findOneAndUpdate(
      { orderId: tran_id },
      { status: "cancelled", rawResponse: req.body },
    );
    return res.redirect(`${CLIENT_URL}/payment/cancelled?tran_id=${tran_id}`);
  } catch (error) {
    console.error("paymentCancel error:", error);
    return res.redirect(`${CLIENT_URL}/payment/cancelled`);
  }
};

/* ================================================================ */
/*  GET MY PAYMENTS                                               */
/* ================================================================ */

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("getMyPayments error:", error);
    return res.status(500).json({ message: error.message });
  }
};