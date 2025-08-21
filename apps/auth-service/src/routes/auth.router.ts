import express, { Router } from 'express';
import {
  forgotPasswordOtpVerification,
  userLogin,
  userRegistration,
  userVerification,
  resetUserPassword,
  refreshToken,
  getUser,
  sellerRegistration,
  sellerVerification,
  createShop,
  createStripeConnectLink,
  sellerLogin,
  getSeller,
  resetSellerPassword,
  forgotUserPassword,
  forgotSellerPassword,
} from '../controllers/auth.controller';
import {
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  isUserMiddleware,
} from '@libs/middleware/auth.middleware';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', userVerification);
router.post('/user-login', userLogin);
router.post('/user-refresh-token', refreshToken);
router.get(
  '/get-logged-in-user',
  isAuthenticatedMiddleware,
  isUserMiddleware,
  getUser
);
router.post('/forgot-user-password', forgotUserPassword);
router.post('/forgot-seller-password', forgotSellerPassword);
router.post('/forgot-password-otp-verification', forgotPasswordOtpVerification);
router.post('/reset-user-password', resetUserPassword);
router.post('/seller-registration', sellerRegistration);
router.post('/verify-seller', sellerVerification);
router.post('/create-shop', createShop);
router.post('/create-stripe-connect-link', createStripeConnectLink);
router.post('/seller-login', sellerLogin);
router.get(
  '/get-logged-in-seller',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  getSeller
);
router.post('/reset-seller-password', resetSellerPassword);

export default router;
