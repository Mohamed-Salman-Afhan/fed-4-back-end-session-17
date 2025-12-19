import express from "express";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";
import { Anomaly } from "../infrastructure/entities/Anomaly";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { User } from "../infrastructure/entities/User";
import { getAuth } from "@clerk/express";
import { NotFoundError } from "../domain/errors/errors";

const anomalyRouter = express.Router();

// Get all anomalies for the current user's solar units
anomalyRouter.get("/", authenticationMiddleware, async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const user = await User.findOne({ clerkUserId: auth.userId });

        if (!user) {
            // If lazy user creation hasn't happened yet, returning empty is safe
            return res.json([]);
        }

        // Find all solar units belonging to the user
        // Note: System seems to assume 1 unit per user in some places, but schema allows more.
        // We'll find all units for this user.
        const solarUnits = await SolarUnit.find({ userId: user._id });
        const solarUnitIds = solarUnits.map(unit => unit._id);

        const anomalies = await Anomaly.find({ solarUnitId: { $in: solarUnitIds } })
            .populate('solarUnitId')
            .sort({ detectedAt: -1 });

        res.json(anomalies);
    } catch (error) {
        next(error);
    }
});

// Create a new anomaly (mostly for testing/seeding via API if needed)
anomalyRouter.post("/", authenticationMiddleware, authorizationMiddleware, async (req, res, next) => {
    try {
        const { solarUnitId, issue, description, severity, status } = req.body;
        const anomaly = await Anomaly.create({
            solarUnitId,
            issue,
            description,
            severity,
            status: status || "Active"
        });
        res.status(201).json(anomaly);
    } catch (error) {
        next(error);
    }
});

// Update/Resolve an anomaly
anomalyRouter.patch("/:id", authenticationMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const anomaly = await Anomaly.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!anomaly) throw new NotFoundError("Anomaly not found");

        res.json(anomaly);
    } catch (error) {
        next(error);
    }
});

export default anomalyRouter;
