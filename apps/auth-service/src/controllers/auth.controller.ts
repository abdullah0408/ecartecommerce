import { NextFunction, Request, Response } from 'express';
import {
  checkOptRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from '../utils/auth.helper';
import prisma from '@libs/prisma/index';
import {
  AuthError,
  NotFoundError,
  ValidationError,
} from '@libs/middleware/error-handler';
import bcrypt from 'bcryptjs';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';
import stripe from '../utils/stripe';

export const userRegistration = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(request.body, 'user');
    const { name, email } = request.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError('User already exists with this email'));
    }

    await checkOptRestrictions(email);
    await trackOtpRequests(email);

    await sendOtp(name, email, 'user-activation');

    return response.status(200).json({
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    console.error('Error occurred during user registration:', error);
    return next(error);
  }
};

export const userVerification = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = request.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError('Missing required fields'));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError('User already exists with this email'));
    }

    await verifyOtp(email, otp);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    response.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Error occurred during user verification:', error);
    return next(error);
  }
};

export const userLogin = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required'));
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return next(new AuthError('Invalid email or password'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return next(new AuthError('Invalid email or password'));
    }

    const accessToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET_ACCESS_TOKEN as string,
      {
        expiresIn: '15m',
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET_REFRESH_TOKEN as string,
      {
        expiresIn: '7d',
      }
    );

    setCookie(response, 'access_token', accessToken);
    setCookie(response, 'refresh_token', refreshToken);

    response.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error occurred during user login:', error);
    return next(error);
  }
};

export const refreshToken = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = request.cookies.refresh_token;

    if (!refreshToken) {
      return next(
        new ValidationError('Unauthorized, refresh token is missing')
      );
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH_TOKEN as string
    ) as { id: string; role: 'user' | 'seller' };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError('Forbidden, Invalid refresh token'));
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return next(new NotFoundError('User/Seller not found'));
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET_ACCESS_TOKEN as string,
      { expiresIn: '15m' }
    );

    setCookie(response, 'access_token', newAccessToken);

    response.status(201).json({
      success: true,
    });
  } catch (error) {
    console.log('Error occurred during token refresh:', error);
    return next(error);
  }
};

export const getUser = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const user = request.user;

    response.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotUserPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await handleForgotPassword(request, response, next, 'user');
};

export const forgotPasswordOtpVerification = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(request, response, next);
};

export const resetUserPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = request.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Email and new password are required'));
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password || ''
    );

    if (isSamePassword) {
      return next(
        new ValidationError(
          'New password must be different from the old password'
        )
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    response.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error occurred during password reset:', error);
    return next(error);
  }
};

export const sellerRegistration = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(request.body, 'seller');
    const { name, email } = request.body;
    const existingSeller = await prisma.seller.findUnique({ where: { email } });
    if (existingSeller) {
      return next(new ValidationError('Seller already exists with this email'));
    }
    await checkOptRestrictions(email);
    await trackOtpRequests(email);

    await sendOtp(name, email, 'seller-activation');

    return response.status(200).json({
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    console.error('Error occurred during seller registration:', error);
    return next(error);
  }
};

export const sellerLogin = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required'));
    }

    const seller = await prisma.seller.findUnique({ where: { email } });

    if (!seller) {
      return next(new AuthError('Invalid email or password'));
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      seller.password || ''
    );
    if (!isPasswordValid) {
      return next(new AuthError('Invalid email or password'));
    }

    const accessToken = jwt.sign(
      { id: seller.id, role: 'seller' },
      process.env.JWT_SECRET_ACCESS_TOKEN as string,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: seller.id, role: 'seller' },
      process.env.JWT_SECRET_REFRESH_TOKEN as string,
      { expiresIn: '7d' }
    );

    setCookie(response, 'seller_access_token', accessToken);
    setCookie(response, 'seller_refresh_token', refreshToken);

    response.status(200).json({
      success: true,
      message: 'User logged in successfully',
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
      },
    });
  } catch (error) {
    console.error('Error occurred during seller login:', error);
    return next(error);
  }
};

export const getSeller = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  response: Response,
  next: NextFunction
) => {
  try {
    const seller = request.user;

    response.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    next(error);
  }
};

export const sellerVerification = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = request.body;

    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(
        new ValidationError('Email, OTP, and all required fields are required')
      );
    }

    const existingSeller = await prisma.seller.findUnique({ where: { email } });

    if (existingSeller) {
      return next(new ValidationError('Seller already exists with this email'));
    }

    await verifyOtp(email, otp);

    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.seller.create({
      data: {
        email,
        name,
        phoneNumber: phone_number,
        country,
        password: hashedPassword,
      },
    });

    response.status(200).json({
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
      },
      success: true,
      message: 'Seller registered successfully',
    });
  } catch (error) {
    console.error('Error occurred during seller verification:', error);
    return next(error);
  }
};

export const createShop = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description = null,
      address,
      openingHours = null,
      website = null,
      category,
      sellerId,
    } = request.body;

    if (!sellerId) {
      return next(new ValidationError('Seller ID is missing'));
    }

    if (!name || !address || !category) {
      return next(
        new ValidationError('Name, address, and category are required')
      );
    }

    const shopData = {
      name,
      description,
      address,
      openingHours,
      category,
      sellerId,
      website: null,
    };

    if (website && website.trim() !== '') {
      shopData.website = website.trim();
    }

    const shop = await prisma.shop.create({
      data: shopData,
    });

    response.status(201).json({
      success: true,
      message: 'Shop created successfully',
      shop,
    });
  } catch (error) {
    console.error('Error occurred during shop creation:', error);
    return next(error);
  }
};

export const createStripeConnectLink = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = request.body;

    if (!sellerId) {
      return next(new ValidationError('Seller ID is required'));
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });

    if (!seller) {
      return next(new NotFoundError('Seller not found'));
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: seller.country,
      email: seller.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.seller.update({
      where: { id: sellerId },
      data: { stripeId: account.id },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.SELLER_FRONTEND_URL}/stripe-success`,
      return_url: `${process.env.SELLER_FRONTEND_URL}/stripe-success`,
      type: 'account_onboarding',
    });

    response.status(200).json({
      success: true,
      message: 'Stripe account created successfully',
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error occurred during Stripe account creation:', error);
    return next(error);
  }
};

export const resetSellerPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = request.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Email and new password are required'));
    }

    const seller = await prisma.seller.findUnique({ where: { email } });

    if (!seller) {
      return next(new NotFoundError('Seller not found'));
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      seller.password || ''
    );

    if (isSamePassword) {
      return next(
        new ValidationError(
          'New password must be different from the old password'
        )
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.seller.update({
      where: { email },
      data: { password: hashedPassword },
    });

    response.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error occurred during password reset:', error);
    return next(error);
  }
};

export const forgotSellerPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await handleForgotPassword(request, response, next, 'seller');
};
