import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: String,
    valId: String,
    bankTranId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    credits: { type: Number, default: 0 },
    plan: { type: String, required: true },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    paidAt: Date,
    rawResponse: { type: Object }, // gateway response সংরক্ষণ (debugging এর জন্য)
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;