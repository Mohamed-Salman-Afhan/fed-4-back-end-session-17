import cron from 'node-cron';
import { Anomaly } from '../entities/Anomaly';
import { EnergyGenerationRecord } from '../entities/EnergyGenerationRecord';
import { SolarUnit } from '../entities/SolarUnit';

export const initializeAnomalyDetectionJob = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log("Running Anomaly Detection Job...");
        try {
            const units = await SolarUnit.find({});
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            for (const unit of units) {
                // Fetch recent generation records
                const records = await EnergyGenerationRecord.find({
                    solarUnitId: unit._id,
                    timestamp: { $gte: oneHourAgo }
                });

                if (records.length === 0) {
                    continue; // No data to analyze
                }

                // Check 1: Zero Output during daytime (6 AM - 6 PM)
                const currentHour = now.getHours();
                const isDaytime = currentHour >= 6 && currentHour <= 18;

                if (isDaytime) {
                    const recentOutput = records[records.length - 1].energyGenerated;
                    if (recentOutput === 0) {
                        // Check if active anomaly already exists
                        const existing = await Anomaly.findOne({
                            solarUnitId: unit._id,
                            issue: "Zero Output",
                            status: { $in: ["Active", "Under Review"] }
                        });

                        if (!existing) {
                            await Anomaly.create({
                                solarUnitId: unit._id,
                                issue: "Zero Output",
                                description: "Solar unit is producing 0kWh during daylight hours.",
                                severity: "Critical",
                                status: "Active"
                            });
                            console.log(`Detected Zero Output anomaly for unit ${unit.serialNumber}`);
                        }
                    }
                }

                // Check 2: Efficiency Drop (Simple heuristic: < 10% capacity during peak sun 10 AM - 2 PM)
                if (currentHour >= 10 && currentHour <= 14) {
                    const recentOutput = records[records.length - 1].energyGenerated;
                    const efficiency = (recentOutput / unit.capacity) * 100;

                    if (efficiency < 10) {
                        const existing = await Anomaly.findOne({
                            solarUnitId: unit._id,
                            issue: "Low Efficiency",
                            status: { $in: ["Active", "Under Review"] }
                        });

                        if (!existing) {
                            await Anomaly.create({
                                solarUnitId: unit._id,
                                issue: "Low Efficiency",
                                description: `Output efficiency is dangerously low (${efficiency.toFixed(1)}%) during peak hours.`,
                                severity: "High",
                                status: "Active"
                            });
                            console.log(`Detected Low Efficiency anomaly for unit ${unit.serialNumber}`);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Anomaly Detection Job Failed:", err);
        }
    });
};
