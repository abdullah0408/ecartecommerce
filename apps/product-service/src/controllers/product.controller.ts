import { NotFoundError, ValidationError } from '@libs/middleware/error-handler';
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

export const createDiscountCode = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const { publicName, discountType, discountValue, discountCode } =
      request.body;
    const sellerId = request.user?.id;

    if (
      !publicName ||
      !discountType ||
      !discountValue ||
      !discountCode ||
      !sellerId
    ) {
      return next(new ValidationError('Invalid request.'));
    }

    const isDiscountCodeExists = await prisma.discountCode.findUnique({
      where: { discountCode },
    });

    if (isDiscountCodeExists) {
      return next(
        new ValidationError(
          'Discount code already exists, please choose another one.'
        )
      );
    }

    const discountCodesCount = await prisma.discountCode.count({
      where: { sellerId },
    });

    if (discountCodesCount >= 8) {
      return next(
        new ValidationError('You can only have a maximum of 8 discount codes.')
      );
    }

    const newDiscountCode = await prisma.discountCode.create({
      data: {
        publicName,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId,
      },
    });

    return response.status(201).json({
      success: true,
      newDiscountCode,
    });
  } catch (error) {
    console.error('Error creating discount code:', error);
    return next(error);
  }
};

export const getDiscountCodes = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const sellerId = request.user?.id;

    if (!sellerId) {
      return next(new ValidationError('Invalid request.'));
    }

    const discountCodes = await prisma.discountCode.findMany({
      where: { sellerId },
    });

    return response.status(200).json({
      success: true,
      discountCodes,
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return next(error);
  }
};

export const deleteDiscountCode = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const { id } = request.params;
    const sellerId = request.user?.id;

    if (!id || !sellerId) {
      return next(new ValidationError('Invalid request.'));
    }

    const discountCode = await prisma.discountCode.findFirst({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!discountCode) {
      return next(new NotFoundError('Discount code not found.'));
    }

    if (discountCode.sellerId !== sellerId) {
      return next(
        new ValidationError(
          'You are not authorized to delete this discount code.'
        )
      );
    }

    await prisma.discountCode.delete({
      where: { id, sellerId },
    });

    return response
      .status(200)
      .json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return next(error);
  }
};
