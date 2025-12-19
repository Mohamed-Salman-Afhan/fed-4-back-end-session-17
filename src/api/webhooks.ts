import express from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { User } from "../infrastructure/entities/User";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const evt = await verifyWebhook(req);

      // Do something with payload
      // For this guide, log payload to console
      const { id } = evt.data;
      const eventType = evt.type;
      console.log(
        `Received webhook with ID ${id} and event type of ${eventType}`
      );
      console.log("Webhook payload:", evt.data);

      if (eventType === "user.created") {
        const { id } = evt.data;
        const user = await User.findOne({ clerkUserId: id });
        if (user) {
          console.log("User already exists");
          return;
        }
        await User.create({
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          email: evt.data.email_addresses[0].email_address,
          clerkUserId: id,
        });
      }

      if (eventType === "user.updated") {
        const { id } = evt.data;
        const user = await User.findOneAndUpdate({ clerkUserId: id }, {
          role: evt.data.public_metadata.role,
        });
      }

      if (eventType === "user.deleted") {
        const { id } = evt.data;
        await User.findOneAndDelete({ clerkUserId: id });
      }

      return res.send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error verifying webhook");
    }
  }
);

import Stripe from "stripe";
import { InvoiceModel } from "../domain/models/invoice";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

webhooksRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.invoiceId) {
        await InvoiceModel.findByIdAndUpdate(session.metadata.invoiceId, {
          status: "PAID",
          stripeSessionId: session.id,
        });
        console.log(`Invoice ${session.metadata.invoiceId} marked as PAID`);
      }
    }

    res.send();
  }
);

export default webhooksRouter;
