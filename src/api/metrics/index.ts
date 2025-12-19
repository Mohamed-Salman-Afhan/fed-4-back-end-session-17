import express, { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { startOfMonth, subMonths, format } from 'date-fns';

const metricsRouter = express.Router();

metricsRouter.get('/capacity-factor', async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        if (!auth.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Mock aggregation for capacity factor (Generation / Potential)
        // In a real app, we'd join with SolarUnit capacity. 
        // Here we'll return mock data for the chart as per PRD "New Metric Visualization"

        const mockData = [
            { name: 'Mon', factor: 0.65 },
            { name: 'Tue', factor: 0.72 },
            { name: 'Wed', factor: 0.48 }, // Cloudy
            { name: 'Thu', factor: 0.81 },
            { name: 'Fri', factor: 0.75 },
            { name: 'Sat', factor: 0.88 },
            { name: 'Sun', factor: 0.90 },
        ];

        res.json(mockData);
    } catch (error) {
        console.error("Metrics Error:", error);
        res.status(500).json({ message: "Failed to fetch metrics" });
    }
});

export default metricsRouter;
