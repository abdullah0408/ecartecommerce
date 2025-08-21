import prisma from '@libs/prisma';
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from './error-handler';

export const isAuthenticatedMiddleware = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const token =
      request.cookies['access_token'] ||
      request.cookies['seller_access_token'] ||
      request.headers.authorization?.split(' ')[1];

    if (!token)
      return response
        .status(401)
        .json({ message: 'Unauthorized, token is missing' });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_ACCESS_TOKEN as string
    ) as { id: string; role: 'user' | 'seller' };

    if (!decoded || !decoded.id || !decoded.role)
      return response
        .status(401)
        .json({ message: 'Unauthorized, Invalid token payload' });

    let account;

    if (decoded.role === 'seller') {
      account = await prisma.seller.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });
      request.user = account;
    } else if (decoded.role === 'user') {
      account = await prisma.user.findUnique({ where: { id: decoded.id } });
      request.user = account;
    }

    if (!account)
      return response.status(404).json({ message: 'Account not found' });

    request.role = decoded.role;
    return next();
  } catch (error) {
    console.error('Error occurred during authentication:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ message: 'Token has expired' });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return response
        .status(401)
        .json({ message: 'Invalid token format or signature' });
    }

    return response.status(500).json({ message: 'Internal server error' });
  }
};

export const isSellerMiddleware = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  if (request.role !== 'seller') {
    return next(new AuthError('Access denied, seller account required'));
  }
  next();
};

export const isUserMiddleware = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  if (request.role !== 'user') {
    return next(new AuthError('Access denied, user account required'));
  }
  next();
};
