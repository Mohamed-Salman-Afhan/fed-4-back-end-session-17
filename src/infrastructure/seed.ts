import mongoose from "mongoose";
import { SolarUnit } from "./entities/SolarUnit";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

async function seed() {
  try {
    // Connect to DB
    await connectDB();

    // Clear existing data
    await SolarUnit.deleteMany({});

    // Create a new solar unit
    const solarUnit = await SolarUnit.create({
      serialNumber: "SU-0001",
      installationDate: new Date("2025-08-01"),
      capacity: 5000,
      status: "ACTIVE",
    });

    // Create sample anomalies
    const { Anomaly } = await import("./entities/Anomaly");
    await Anomaly.deleteMany({});

    await Anomaly.create([
      {
        solarUnitId: solarUnit._id,
        issue: "Efficiency Drop > 10%",
        description: "Detailed analysis shows 12% drop in energy conversion efficiency during peak hours.",
        severity: "High",
        status: "Active",
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        solarUnitId: solarUnit._id,
        issue: "Inverter Offline",
        description: "Inverter stopped communicating with main control unit.",
        severity: "Critical",
        status: "Active",
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        solarUnitId: solarUnit._id,
        issue: "Panel Obstruction",
        description: "Potential debris or shading detected on Sector B.",
        severity: "Low",
        status: "Resolved",
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ]);

    console.log(
      `Database seeded successfully. Created solar unit: ${solarUnit.serialNumber}`
    );
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
