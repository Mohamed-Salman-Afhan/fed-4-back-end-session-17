import mongoose from "mongoose";
import { z } from "zod";

export const InvoiceSchema = z.object({
    userId: z.string(),
    unitId: z.string(),
    amount: z.number(),
    currency: z.string().default("usd"),
    status: z.enum(["PENDING", "PAID", "FAILED"]),
    stripeSessionId: z.string().optional(),
    periodStart: z.date(),
    periodEnd: z.date(),
    createdAt: z.date().default(() => new Date()),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

const invoiceSchema = new mongoose.Schema<Invoice>({
    userId: { type: String, required: true },
    unitId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
    stripeSessionId: { type: String },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const InvoiceModel = mongoose.model<Invoice>("Invoice", invoiceSchema);
