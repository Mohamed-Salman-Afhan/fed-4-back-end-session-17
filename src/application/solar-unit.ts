import { z } from "zod";
import { CreateSolarUnitDto, UpdateSolarUnitDto } from "../domain/dtos/solar-unit";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../domain/errors/errors";
import { User } from "../infrastructure/entities/User";
import { getAuth } from "@clerk/express";

export const getAllSolarUnits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const solarUnits = await SolarUnit.find();
    res.status(200).json(solarUnits);
  } catch (error) {
    next(error);
  }
};

export const createSolarUnitValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = CreateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};

export const createSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: z.infer<typeof CreateSolarUnitDto> = req.body;

    const newSolarUnit = {
      serialNumber: data.serialNumber,
      installationDate: new Date(data.installationDate),
      capacity: data.capacity,
      status: data.status,
    };

    const createdSolarUnit = await SolarUnit.create(newSolarUnit);
    res.status(201).json(createdSolarUnit);
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;

    let user = await User.findOne({ clerkUserId });
    if (!user) {
      // Lazy create user
      console.log(`Lazy creating user for ${clerkUserId}`);
      user = await User.create({
        clerkUserId,
        email: `user_${clerkUserId}@voltaris.local`, // Placeholder email
        firstName: "Solar",
        lastName: "User",
        role: "staff"
      });
    }

    let solarUnit = await SolarUnit.findOne({ userId: user._id });
    if (!solarUnit) {
      // Lazy create solar unit
      console.log(`Lazy creating solar unit for user ${user._id}`);
      solarUnit = await SolarUnit.create({
        userId: user._id,
        serialNumber: `SU-${Date.now()}`,
        installationDate: new Date(),
        capacity: 5000,
        status: "ACTIVE"
      });
    }

    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};

export const updateSolarUnitValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = UpdateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};

export const updateSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { serialNumber, installationDate, capacity, status, userId } = req.body;
  const solarUnit = await SolarUnit.findById(id);

  if (!solarUnit) {
    throw new NotFoundError("Solar unit not found");
  }

  const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(id, {
    serialNumber,
    installationDate,
    capacity,
    status,
    userId,
  });

  res.status(200).json(updatedSolarUnit);
};

export const deleteSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }

    await SolarUnit.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
