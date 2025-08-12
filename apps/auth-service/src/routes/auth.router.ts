import express, { Router } from 'express';
import {
  forgotPasswordOtpVerification,
  userLogin,
  userForgotPassword,
  userRegistration,
  userVerification,
  resetUserPassword,
} from '../controllers/auth.controller';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', userVerification);
router.post('/user-login', userLogin);
router.post('/forgot-password', userForgotPassword);
router.post('/forgot-password-otp-verification', forgotPasswordOtpVerification);
router.post('/reset-user-password', resetUserPassword);

export default router;
