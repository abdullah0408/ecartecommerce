import { AuthError, ValidationError } from '@libs/middleware/error-handler';
import redis from '@libs/redis';
import crypto from 'crypto';
import { sendEmail } from './sendMail';
import { NextFunction, Request, Response } from 'express';
import prisma from '@libs/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country))
  ) {
    throw new ValidationError('Missing required fields');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const checkOptRestrictions = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      'Account locked due to multiple failed OTP attempts. Try again after 30 minutes.'
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      'Too many OTP requests. Please wait 1 hour before requesting a new OTP.'
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      'Please wait 1 minute before requesting a new OTP.'
    );
  }
};

export const trackOtpRequests = async (email: string) => {
  const otpRequestKey = `otp_request_count:${email}`;

  const otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'true', 'EX', 3600); // Lock for 1 hour

    throw new ValidationError(
      'Too many OTP requests. Please wait 1 hour before requesting a new OTP.'
    );
  }

  await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600); // Reset count after 1 hour
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(100000, 999999).toString();

  await sendEmail(email, 'Verify your email', template, { name, otp });

  await redis.set(`otp:${email}`, otp, 'EX', 300); // Store OTP for 5 minutes
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown for 1 minute
};

export const verifyOtp = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError('OTP has expired or is invalid');
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, 'true', 'EX', 1800); // Lock for 30 minutes
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        'Account locked due to multiple failed OTP attempts. Try again after 30 minutes.'
      );
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 300); // Reset after 5 minutes
    throw new ValidationError(
      `Invalid OTP. You have ${2 - failedAttempts} attempts left.`
    );
  }
  await redis.del(`otp:${email}`, failedAttemptsKey); // Clear OTP and attempts on success
};

export const verifyForgotPasswordOtp = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = request.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    await verifyOtp(email, otp);

    response.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    });
  } catch (error) {
    console.error(
      'Error occurred during forgot password OTP verification:',
      error
    );
    return next(error);
  }
};

export const handleForgotPassword = async (
  require: Request,
  response: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
) => {
  try {
    const { email } = require.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user =
      userType === 'user' &&
      (await prisma.user.findUnique({ where: { email } }));
    if (!user) {
      throw new AuthError(
        `${userType.charAt(0).toUpperCase()}${userType.slice(1)} not found`
      );
    }

    await checkOptRestrictions(email);
    await trackOtpRequests(email);

    await sendOtp(user.name, email, 'user-forgot-password');

    response.status(200).json({
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    console.error('Error occurred during forgot password:', error);
    return next(error);
  }
};
