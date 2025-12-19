import express, { Request, Response } from 'express';

const weatherRouter = express.Router();

weatherRouter.get('/', async (req: Request, res: Response) => {
    try {
        const latitude = process.env.LATITUDE || '6.9271';
        const longitude = process.env.LONGITUDE || '79.8612';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        res.status(500).json({ command: 'Failed to fetch weather data' });
    }
});

export default weatherRouter;
