import prisma from '@libs/prisma';

export const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      // Create default site configuration
      const defaultConfig = await prisma.siteConfig.create({
        data: {
          categories: [
            'Electronics',
            'Clothing & Fashion',
            'Home & Garden',
            'Sports & Outdoors',
            'Books & Media',
            'Health & Beauty',
            'Automotive',
            'Food & Beverages',
          ],
          subCategories: {
            'Electronics': ['Smartphones', 'Laptops', 'Headphones', 'Cameras'],
            'Clothing & Fashion': [
              "Men's Clothing",
              "Women's Clothing",
              'Shoes',
              'Accessories',
            ],
            'Home & Garden': ['Furniture', 'Kitchen', 'Garden Tools', 'Decor'],
            'Sports & Outdoors': [
              'Fitness Equipment',
              'Outdoor Gear',
              'Sports Apparel',
            ],
            'Books & Media': ['Books', 'Movies', 'Music', 'Games'],
            'Health & Beauty': ['Skincare', 'Makeup', 'Health Supplements'],
            'Automotive': ['Car Parts', 'Motorcycle Parts', 'Car Care'],
            'Food & Beverages': ['Snacks', 'Beverages', 'Organic Food'],
          },
        },
      });
      console.log('Default site configuration created:', defaultConfig);
    }
  } catch (error) {
    console.error('Error initializing site configuration:', error);
  }
};

export default initializeSiteConfig;
