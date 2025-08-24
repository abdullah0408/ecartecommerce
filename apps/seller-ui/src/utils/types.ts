export interface DiscountCode {
  id: string;
  publicName: string;
  discountType: string;
  discountValue: number;
  discountCode: string;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}
