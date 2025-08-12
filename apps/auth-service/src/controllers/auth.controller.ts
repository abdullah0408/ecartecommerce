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
import { AuthError, ValidationError } from '@libs/middleware/error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';

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

export const userForgotPassword = async (
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
      return next(new AuthError('User not found'));
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
