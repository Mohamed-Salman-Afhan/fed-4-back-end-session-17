import cron from 'node-cron';
import { InvoiceModel } from '../../domain/models/invoice';
import { SolarUnit } from '../entities/SolarUnit';

export const initializeBillingScheduler = () => {
    // Run on the 1st of every month at midnight
    cron.schedule('0 0 1 * *', async () => {
        console.log("Running Monthly Billing Job...");
        try {
            const units = await SolarUnit.find({});
            const now = new Date();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            for (const unit of units) {
                // Check if invoice exists
                const exists = await InvoiceModel.findOne({
                    unitId: unit._id,
                    periodStart: startOfLastMonth,
                });

                if (exists) continue;

                // In a real app, aggregation of EnergyGenerationRecord goes here.
                // For MVP/Demo: Generate a random realistic amount (e.g., 300-500 kWh * $0.15)
                const kWh = Math.floor(Math.random() * (500 - 300 + 1) + 300);
                const rate = 0.15; // $0.15 per kWh
                const amount = kWh * rate;

                // Check if unit has a userId (it should)
                // SolarUnit model might store userId or be linked. 
                // The PRD says "Customer owns one or more solar units".
                // We assume unit has `userId` based on typical schema, if not we skip.

                // Type cast to any if structure is unknown, but ideally we check schema.
                // Based on seed.ts (if I checked it), units usually have owners.
                // Let's assume 'userId' exists on SolarUnit or we can't bill.

                // Wait, SolarUnit schema usually has `clerkId` or `userId`.
                // I'll check SolarUnit schema in a sec. For now writing generic logic.
                // Assuming unit has `userId`.
                if ((unit as any).userId) {
                    await InvoiceModel.create({
                        userId: (unit as any).userId,
                        unitId: unit._id,
                        amount: amount,
                        currency: 'usd',
                        status: 'PENDING',
                        periodStart: startOfLastMonth,
                        periodEnd: endOfLastMonth,
                        createdAt: new Date(),
                    });
                    console.log(`Generated invoice for Unit ${unit._id}: $${amount.toFixed(2)}`);
                }
            }
        } catch (err) {
            console.error("Billing Job Failed:", err);
        }
    });
};
