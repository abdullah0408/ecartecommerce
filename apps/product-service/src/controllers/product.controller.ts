import prisma from '@libs/prisma';
import { NextFunction, Request, Response } from 'express';

export const getCategories = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.siteConfig.findFirst();

    if (!config) {
      return response.status(404).json({ error: 'categories not found' });
    }

    return response.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return next(error);
  }
};
