import express, { Router } from 'express';
import {
  createDiscountCode,
  deleteDiscountCode,
  deleteProductImage,
  getCategories,
  getDiscountCodes,
  uploadProductImage,
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
router.post(
  '/upload-product-image',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  uploadProductImage
);
router.delete(
  '/delete-product-image',
  isAuthenticatedMiddleware,
  isSellerMiddleware,
  deleteProductImage
);

export default router;
