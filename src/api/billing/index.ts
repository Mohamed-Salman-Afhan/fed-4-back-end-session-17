import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { getAuth } from '@clerk/express';
import { InvoiceModel } from '../../domain/models/invoice';

const billingRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

billingRouter.get('/invoices', async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        if (!auth.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const invoices = await InvoiceModel.find({ userId: auth.userId }).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error("Fetch Invoices Error:", error);
        res.status(500).json({ message: "Failed to fetch invoices" });
    }
});

billingRouter.post('/create-checkout-session', async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        if (!auth.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { invoiceId } = req.body;
        const invoice = await InvoiceModel.findOne({ _id: invoiceId, userId: auth.userId });

        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        if (invoice.status === 'PAID') {
            res.status(400).json({ message: "Invoice already paid" });
            return;
        }

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price_data: {
                        currency: invoice.currency,
                        product_data: {
                            name: `Solar Energy Bill - ${invoiceId}`,
                        },
                        unit_amount: Math.round(invoice.amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            return_url: `${process.env.CORS_ORIGIN}/invoices/return?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                invoiceId: invoiceId.toString(),
                userId: auth.userId
            }
        });

        res.json({ clientSecret: session.client_secret });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
    }
});

export default billingRouter;
