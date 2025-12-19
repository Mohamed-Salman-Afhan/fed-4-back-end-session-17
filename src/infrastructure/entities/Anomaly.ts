import mongoose from "mongoose";

const anomalySchema = new mongoose.Schema({
    solarUnitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolarUnit",
        required: true,
    },
    issue: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        required: true,
    },
    status: {
        type: String,
        enum: ["Active", "Under Review", "Resolved"],
        default: "Active",
    },
    detectedAt: {
        type: Date,
        default: Date.now,
    },
});

export const Anomaly = mongoose.model("Anomaly", anomalySchema);
