import express from "express";
import {
  createOrder,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
  getMyPayments,
} from "./billing.controller.js";
import { authProtect } from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

/* ──────────────────────────────────────────────────────────────── */
/*  Public (SSLCommerz callbacks — no auth)                       */
/* ──────────────────────────────────────────────────────────────── */

router.post("/success", paymentSuccess);
router.post("/fail", paymentFail);
router.post("/cancel", paymentCancel);
router.post("/ipn", paymentIPN);

/* ──────────────────────────────────────────────────────────────── */
/*  Protected (logged-in user)                                    */
/* ──────────────────────────────────────────────────────────────── */

router.post("/create-order", authProtect, createOrder);
router.get("/my-payments", authProtect, getMyPayments);

export default router;