import express, { Router } from 'express';
import {
  createDiscountCode,
  deleteDiscountCode,
  getCategories,
  getDiscountCodes,
} from '../controllers/product.controller';
import {
  isAuthenticatedMiddleware,
  isSellerMiddleware,
} from '@libs/middleware/auth.middleware';

const router: Router = express.Router();

router.get('/get-categories', getCategories);
router.post(
  '/create-discount-code',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  createDiscountCode
);
router.get(
  '/get-discount-codes',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  getDiscountCodes
);
router.delete(
  '/delete-discount-code/:id',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  deleteDiscountCode
);

export default router;
