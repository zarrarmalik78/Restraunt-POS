import { db } from '../db/database';
import bcrypt from 'bcryptjs';

export const seedSampleData = async () => {
  const shopId = 'default_shop';

  // 1. Prevent double seeding
  if ((await db.products.count()) > 0) {
    return { success: true, message: 'Already seeded' };
  }

  // Clear default categories created by the backend
  await db.categories.delete();

  // 2. Create Restaurant Categories
  const categories = [
    { id: 'cat_burgers', shopId, name: 'Burgers', color: '#f59e0b', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_pizza', shopId, name: 'Pizza', color: '#ef4444', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_chicken', shopId, name: 'Fried Chicken', color: '#f97316', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_sides', shopId, name: 'Fries & Sides', color: '#eab308', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_rolls', shopId, name: 'Rolls & Shawarma', color: '#84cc16', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_pasta', shopId, name: 'Pasta', color: '#10b981', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_rice', shopId, name: 'Rice', color: '#0ea5e9', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_chat', shopId, name: 'Fruit Chat', color: '#d946ef', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_drinks', shopId, name: 'Drinks', color: '#3b82f6', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat_deals', shopId, name: 'Combo Deals', color: '#6366f1', createdAt: new Date(), updatedAt: new Date() }
  ];
  await db.categories.bulkAdd(categories);

  // Removed vendors and customers logic. Proceeding directly to Products.

  // 5. Create Menu Products (CostPrice set to 0 for all)
  const products: any[] = [];
  const addP = (id: string, name: string, cat: string, price: number, variants: any[] = []) => {
    products.push({
      id, shopId, name, categoryId: cat, costPrice: 0, sellingPrice: price, image: '', variants, createdAt: new Date(), updatedAt: new Date()
    });
  };

  // Pizza
  const pVariants = [
    { name: 'Regular', price: 800, cost: 0 }, { name: 'Medium', price: 1450, cost: 0 }, { name: 'Large', price: 1950, cost: 0 }, { name: 'XL', price: 2700, cost: 0 }
  ];
  const sVariants = [
    { name: 'Regular', price: 900, cost: 0 }, { name: 'Medium', price: 1800, cost: 0 }, { name: 'Large', price: 2500, cost: 0 }, { name: 'XL', price: 3150, cost: 0 }
  ];
  
  addP('p_tikka', 'Chicken Tikka Pizza', 'cat_pizza', 0, pVariants);
  addP('p_fajita', 'Chicken Fajita Pizza', 'cat_pizza', 0, pVariants);
  addP('p_spicy', 'Hot & Spicy Pizza', 'cat_pizza', 0, pVariants);
  addP('p_achari', 'Chicken Achari Pizza', 'cat_pizza', 0, pVariants);
  addP('p_tandori', 'Tandori Pizza', 'cat_pizza', 0, pVariants);
  addP('p_special', 'Pizza Hut Special', 'cat_pizza', 0, sVariants);
  addP('p_kabab', 'Kabab Crust Pizza', 'cat_pizza', 0, sVariants);
  addP('p_malai', 'Malai Boti Pizza', 'cat_pizza', 0, sVariants);
  addP('p_creamy_p', 'Creamy Pizza', 'cat_pizza', 0, sVariants);
  addP('p_crown', 'Crown Crust Pizza', 'cat_pizza', 0, sVariants);
  addP('p_cheese_stick', 'Cheese Stick Pizza', 'cat_pizza', 0, [{ name: 'Medium', price: 1800, cost: 0 }]);

  // Burgers
  addP('b_zinger', 'Zinger Burger', 'cat_burgers', 500);
  addP('b_zcheese', 'Zinger Cheese Burger', 'cat_burgers', 570);
  addP('b_chicken', 'Chicken Burger', 'cat_burgers', 430);
  addP('b_ccheese', 'Chicken Cheese Burger', 'cat_burgers', 500);
  addP('b_grill', 'Grill Tikka Cheese Burger', 'cat_burgers', 500);
  addP('b_tower', 'Tower Burger', 'cat_burgers', 720);
  addP('b_tcheese', 'Tower Cheese Burger', 'cat_burgers', 800);

  // Fried Chicken & Roast
  addP('fc_1', '1 Pc Chicken', 'cat_chicken', 350);
  addP('fc_2', '2 Pc Chicken', 'cat_chicken', 700);
  addP('fc_5', '5 Pc Chicken', 'cat_chicken', 1800);
  addP('fc_10', '10 Pc Chicken', 'cat_chicken', 1000);
  addP('fc_w10', '10 Pc Hot Wings', 'cat_chicken', 1000);
  addP('fc_s10', '10 Pc Hot Shot', 'cat_chicken', 1000);
  addP('fc_bbq', '10 BBQ Wings', 'cat_chicken', 1100);
  addP('r_full', 'Full Steam Roast', 'cat_chicken', 2850);
  addP('r_half', 'Half Steam Roast', 'cat_chicken', 1700);

  // Fries
  addP('f_french', 'French Fries', 'cat_sides', 0, [{ name: 'Medium', price: 350, cost: 0 }, { name: 'Family', price: 500, cost: 0 }]);
  addP('f_pizza', 'Pizza Fries', 'cat_sides', 0, [{ name: 'Medium', price: 570, cost: 0 }, { name: 'Large', price: 990, cost: 0 }]);
  addP('f_loaded', 'Loaded Fries', 'cat_sides', 0, [{ name: 'Medium', price: 570, cost: 0 }, { name: 'Large', price: 990, cost: 0 }]);

  // Rolls & Shawarma
  addP('rs_zp', 'Zinger Paratha / Shawarma', 'cat_rolls', 500);
  addP('rs_zcp', 'Zinger Cheese Paratha / Shawarma', 'cat_rolls', 570);
  addP('rs_cp', 'Chicken Paratha / Shawarma', 'cat_rolls', 350);
  addP('rs_ccp', 'Chicken Cheese Paratha / Shawarma', 'cat_rolls', 430);
  addP('rs_mp', 'Mayo Paratha / Shawarma', 'cat_rolls', 350);
  addP('rs_ps', 'Platter Shawarma', 'cat_rolls', 650);
  addP('rs_br', 'Bihari Roll', 'cat_rolls', 850);

  // Pasta
  addP('pa_al', 'Alfredo Pasta', 'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);
  addP('pa_cr', 'Crunch Pasta', 'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);
  addP('pa_sp', 'Pizza Hut Special Pasta', 'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);

  // Rice
  addP('ri_cfr', 'Chicken Fried Rice', 'cat_rice', 650);
  addP('ri_mfr', 'Masala Fried Rice', 'cat_rice', 650);
  addP('ri_sfr', 'Special Fried Rice', 'cat_rice', 650);

  // Fruit Chat
  addP('ch_cr', 'Creamy Fruit Chat', 'cat_chat', 430);
  addP('ch_pa', 'Pine Apple Fruit Chat', 'cat_chat', 500);
  addP('ch_sp', 'Pizza Hut Special Fruit Chat', 'cat_chat', 500);

  // Drinks & Extras for Deals
  addP('d_reg', 'Regular Drink', 'cat_drinks', 150);
  addP('d_1', '1 Ltr Drink', 'cat_drinks', 250);
  addP('d_15', '1.5 Ltr Drink', 'cat_drinks', 300);
  addP('e_nug', 'Nuggets (5 Pcs)', 'cat_sides', 300);
  addP('e_cake', 'Pound Cake', 'cat_desserts', 1000);
  await db.products.bulkAdd(products);

  // 6. Create Combo Deals (Featured in POS Quick Access)
  const deals: any[] = [];
  const addD = (id: string, name: string, price: number, itemIds: string[]) => {
    deals.push({
      id, shopId, name, categoryId: 'cat_deals', price, 
      items: itemIds.map(pid => ({ productId: pid, quantity: 1 })),
      isFeatured: true, createdAt: new Date(), updatedAt: new Date()
    });
  };

  addD('d_b1', 'Birthday Deal 1', 8850, ['p_tikka', 'b_zinger', 'fc_w10', 'f_french', 'e_cake', 'd_15']);
  addD('d_b2', 'Birthday Deal 2', 15700, ['p_tikka', 'b_zinger', 'fc_w10', 'f_french', 'ch_cr', 'e_cake', 'd_15']);
  
  addD('d_f1', 'Family Deal 1', 5700, ['p_tikka', 'b_zinger', 'rs_cp', 'fc_w10', 'f_french', 'd_15']);
  addD('d_f2', 'Family Deal 2', 2850, ['p_tikka', 'b_zinger', 'rs_cp', 'fc_w10', 'f_french', 'd_15']);

  addD('d_sd1', 'Super Deal 1', 2350, ['p_tikka', 'p_fajita', 'd_1']);
  addD('d_sd2', 'Super Deal 2', 4150, ['p_tikka', 'p_fajita', 'd_15']);
  addD('d_sd3', 'Super Deal 3', 5850, ['p_tikka', 'p_fajita', 'd_15']);
  addD('d_sd4', 'Super Deal 4', 7450, ['p_tikka', 'p_fajita', 'd_15']);

  addD('d_deal1', 'Deal 1', 850, ['p_tikka', 'd_reg']);
  addD('d_deal2', 'Deal 2', 1550, ['p_tikka', 'd_1']);
  addD('d_deal3', 'Deal 3', 2150, ['p_tikka', 'd_1']);
  addD('d_deal4', 'Deal 4', 850, ['b_zinger', 'f_french', 'd_reg']);
  addD('d_deal5', 'Deal 5', 1200, ['b_zinger', 'fc_1', 'f_french', 'd_reg']);
  addD('d_deal6', 'Deal 6', 1550, ['b_zinger', 'e_nug', 'd_reg']);
  addD('d_deal7', 'Deal 7', 2700, ['p_tikka', 'fc_w10', 'e_nug', 'f_french', 'd_1']);
  addD('d_deal8', 'Deal 8', 1550, ['b_zinger', 'd_1']);
  addD('d_deal9', 'Deal 9', 3000, ['p_tikka', 'd_15']);
  addD('d_deal10', 'Deal 10', 2700, ['b_zinger', 'd_15']);
  addD('d_deal11', 'Deal 11', 2800, ['p_tikka', 'd_15']);
  addD('d_deal12', 'Deal 12', 2150, ['p_tikka', 'b_zinger', 'f_french', 'd_1']);
  await db.deals.bulkAdd(deals);

  // 7. Seed Settings
  await db.settings.put({
    id: shopId,
    shopId,
    shopName: 'Pizza Hut',
    shopAddress: 'A-32 Al-Khayam Building, Near Shell Pump, Opposite Naeem Electronic, Khanna Road, Rawalpindi',
    shopPhone: '051-4471762',
    showShopAddress: true,
    showShopPhone: true,
    footerMessage: 'Thank you for dining with us! Drive safe.',
    shopLogo: '/logo.png',
    currency: 'Rs.',
    cardDiscountPercentage: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 8. Seed Default Admin (if not present, put/update)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  await db.users.put({
    id: 'admin_user',
    shopId,
    username: 'admin',
    passwordHash,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });



  return { success: true };
};
