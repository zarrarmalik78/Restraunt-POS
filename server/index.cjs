const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Data Directory Setup ──────────────────────────────────────────────────────
let dataDir = process.env.GTRAX_DATA_DIR;

if (!dataDir) {
  try {
    const globalConfigPath = path.join(
      process.env.PROGRAMDATA || 'C:\\ProgramData',
      'PizzaHutPOS',
      'config.json'
    );
    if (fs.existsSync(globalConfigPath)) {
      const configData = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
      if (configData.dataDir) {
        dataDir = configData.dataDir;
      }
    }
  } catch (err) {
    console.error('Failed to read ProgramData config:', err);
  }
}

if (!dataDir) {
  dataDir = path.join(__dirname, '../data');
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'generaltrax.sqlite');
console.log('[Server] Database path:', dbPath);

// ─── Schema Setup ──────────────────────────────────────────────────────────────
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    collectionName TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collectionName, id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS serial_registry (
    serialNumber TEXT NOT NULL,
    shopId TEXT NOT NULL,
    productId TEXT NOT NULL,
    PRIMARY KEY (serialNumber, shopId)
  );
`);

// ─── Seed on Fresh Database ────────────────────────────────────────────────────
const userCount = db.prepare("SELECT count(*) as count FROM documents WHERE collectionName = 'users'").get();

if (userCount.count === 0) {
  console.log('[Server] Fresh database detected. Seeding full Pizza Hut data...');

  const shopId = 'default_shop';
  const now = new Date().toISOString();
  const insert = db.prepare('INSERT INTO documents (collectionName, id, data) VALUES (?, ?, ?)');

  const seedAll = db.transaction(() => {

    // 1. Shop Settings
    insert.run('settings', shopId, JSON.stringify({
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
      createdAt: now,
      updatedAt: now
    }));

    // 2. Default Admin User (username: admin, password: admin123)
    const passwordHash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));
    insert.run('users', 'admin_user', JSON.stringify({
      shopId,
      username: 'admin',
      passwordHash,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }));

    // 3. Categories
    const cats = [
      { id: 'cat_burgers',  name: 'Burgers',         color: '#f59e0b' },
      { id: 'cat_pizza',    name: 'Pizza',            color: '#ef4444' },
      { id: 'cat_chicken',  name: 'Fried Chicken',    color: '#f97316' },
      { id: 'cat_sides',    name: 'Fries & Sides',    color: '#eab308' },
      { id: 'cat_rolls',    name: 'Rolls & Shawarma', color: '#84cc16' },
      { id: 'cat_pasta',    name: 'Pasta',            color: '#10b981' },
      { id: 'cat_rice',     name: 'Rice',             color: '#0ea5e9' },
      { id: 'cat_chat',     name: 'Fruit Chat',       color: '#d946ef' },
      { id: 'cat_drinks',   name: 'Drinks',           color: '#3b82f6' },
      { id: 'cat_deals',    name: 'Combo Deals',      color: '#6366f1' },
      { id: 'cat_desserts', name: 'Desserts',         color: '#ec4899' },
    ];
    for (const cat of cats) {
      insert.run('categories', cat.id, JSON.stringify({
        shopId, name: cat.name, color: cat.color, createdAt: now, updatedAt: now
      }));
    }

    // 4. Products
    const pV = [
      { name: 'Regular', price: 800,  cost: 0 },
      { name: 'Medium',  price: 1450, cost: 0 },
      { name: 'Large',   price: 1950, cost: 0 },
      { name: 'XL',      price: 2700, cost: 0 },
    ];
    const sV = [
      { name: 'Regular', price: 900,  cost: 0 },
      { name: 'Medium',  price: 1800, cost: 0 },
      { name: 'Large',   price: 2500, cost: 0 },
      { name: 'XL',      price: 3150, cost: 0 },
    ];

    const addP = (id, name, categoryId, sellingPrice, variants) => {
      insert.run('products', id, JSON.stringify({
        shopId, name, categoryId,
        costPrice: 0, sellingPrice,
        image: '', variants: variants || [],
        createdAt: now, updatedAt: now
      }));
    };

    // Pizza
    addP('p_tikka',       'Chicken Tikka Pizza',  'cat_pizza', 0, pV);
    addP('p_fajita',      'Chicken Fajita Pizza', 'cat_pizza', 0, pV);
    addP('p_spicy',       'Hot & Spicy Pizza',    'cat_pizza', 0, pV);
    addP('p_achari',      'Chicken Achari Pizza', 'cat_pizza', 0, pV);
    addP('p_tandori',     'Tandori Pizza',        'cat_pizza', 0, pV);
    addP('p_special',     'Pizza Hut Special',    'cat_pizza', 0, sV);
    addP('p_kabab',       'Kabab Crust Pizza',    'cat_pizza', 0, sV);
    addP('p_malai',       'Malai Boti Pizza',     'cat_pizza', 0, sV);
    addP('p_creamy_p',    'Creamy Pizza',         'cat_pizza', 0, sV);
    addP('p_crown',       'Crown Crust Pizza',    'cat_pizza', 0, sV);
    addP('p_cheese_stick','Cheese Stick Pizza',   'cat_pizza', 0, [{ name: 'Medium', price: 1800, cost: 0 }]);

    // Burgers
    addP('b_zinger',  'Zinger Burger',             'cat_burgers', 500);
    addP('b_zcheese', 'Zinger Cheese Burger',      'cat_burgers', 570);
    addP('b_chicken', 'Chicken Burger',            'cat_burgers', 430);
    addP('b_ccheese', 'Chicken Cheese Burger',     'cat_burgers', 500);
    addP('b_grill',   'Grill Tikka Cheese Burger', 'cat_burgers', 500);
    addP('b_tower',   'Tower Burger',              'cat_burgers', 720);
    addP('b_tcheese', 'Tower Cheese Burger',       'cat_burgers', 800);

    // Fried Chicken
    addP('fc_1',   '1 Pc Chicken',    'cat_chicken', 350);
    addP('fc_2',   '2 Pc Chicken',    'cat_chicken', 700);
    addP('fc_5',   '5 Pc Chicken',    'cat_chicken', 1800);
    addP('fc_10',  '10 Pc Chicken',   'cat_chicken', 1000);
    addP('fc_w10', '10 Pc Hot Wings', 'cat_chicken', 1000);
    addP('fc_s10', '10 Pc Hot Shot',  'cat_chicken', 1000);
    addP('fc_bbq', '10 BBQ Wings',    'cat_chicken', 1100);
    addP('r_full', 'Full Steam Roast','cat_chicken', 2850);
    addP('r_half', 'Half Steam Roast','cat_chicken', 1700);

    // Fries & Sides
    addP('f_french', 'French Fries',    'cat_sides', 0, [{ name: 'Medium', price: 350, cost: 0 }, { name: 'Family', price: 500, cost: 0 }]);
    addP('f_pizza',  'Pizza Fries',     'cat_sides', 0, [{ name: 'Medium', price: 570, cost: 0 }, { name: 'Large',  price: 990, cost: 0 }]);
    addP('f_loaded', 'Loaded Fries',    'cat_sides', 0, [{ name: 'Medium', price: 570, cost: 0 }, { name: 'Large',  price: 990, cost: 0 }]);
    addP('e_nug',    'Nuggets (5 Pcs)', 'cat_sides', 300);

    // Rolls & Shawarma
    addP('rs_zp',  'Zinger Paratha / Shawarma',         'cat_rolls', 500);
    addP('rs_zcp', 'Zinger Cheese Paratha / Shawarma',  'cat_rolls', 570);
    addP('rs_cp',  'Chicken Paratha / Shawarma',        'cat_rolls', 350);
    addP('rs_ccp', 'Chicken Cheese Paratha / Shawarma', 'cat_rolls', 430);
    addP('rs_mp',  'Mayo Paratha / Shawarma',           'cat_rolls', 350);
    addP('rs_ps',  'Platter Shawarma',                  'cat_rolls', 650);
    addP('rs_br',  'Bihari Roll',                       'cat_rolls', 850);

    // Pasta
    addP('pa_al', 'Alfredo Pasta',           'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);
    addP('pa_cr', 'Crunch Pasta',            'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);
    addP('pa_sp', 'Pizza Hut Special Pasta', 'cat_pasta', 0, [{ name: 'Medium', price: 800, cost: 0 }, { name: 'Large', price: 1070, cost: 0 }]);

    // Rice
    addP('ri_cfr', 'Chicken Fried Rice', 'cat_rice', 650);
    addP('ri_mfr', 'Masala Fried Rice',  'cat_rice', 650);
    addP('ri_sfr', 'Special Fried Rice', 'cat_rice', 650);

    // Fruit Chat
    addP('ch_cr', 'Creamy Fruit Chat',           'cat_chat', 430);
    addP('ch_pa', 'Pine Apple Fruit Chat',        'cat_chat', 500);
    addP('ch_sp', 'Pizza Hut Special Fruit Chat', 'cat_chat', 500);

    // Drinks
    addP('d_reg', 'Regular Drink', 'cat_drinks', 150);
    addP('d_1',   '1 Ltr Drink',   'cat_drinks', 250);
    addP('d_15',  '1.5 Ltr Drink', 'cat_drinks', 300);

    // Desserts
    addP('e_cake', 'Pound Cake', 'cat_desserts', 1000);

    // 5. Combo Deals
    const addD = (id, name, price, itemIds) => {
      insert.run('deals', id, JSON.stringify({
        shopId, name,
        categoryId: 'cat_deals',
        price,
        image: '',
        items: itemIds.map(pid => ({ productId: pid, quantity: 1 })),
        isFeatured: true,
        createdAt: now, updatedAt: now
      }));
    };

    addD('d_b1',    'Birthday Deal 1',  8850,  ['p_tikka','b_zinger','fc_w10','f_french','e_cake','d_15']);
    addD('d_b2',    'Birthday Deal 2',  15700, ['p_tikka','b_zinger','fc_w10','f_french','ch_cr','e_cake','d_15']);
    addD('d_f1',    'Family Deal 1',    5700,  ['p_tikka','b_zinger','rs_cp','fc_w10','f_french','d_15']);
    addD('d_f2',    'Family Deal 2',    2850,  ['p_tikka','b_zinger','rs_cp','fc_w10','f_french','d_15']);
    addD('d_sd1',   'Super Deal 1',     2350,  ['p_tikka','p_fajita','d_1']);
    addD('d_sd2',   'Super Deal 2',     4150,  ['p_tikka','p_fajita','d_15']);
    addD('d_sd3',   'Super Deal 3',     5850,  ['p_tikka','p_fajita','d_15']);
    addD('d_sd4',   'Super Deal 4',     7450,  ['p_tikka','p_fajita','d_15']);
    addD('d_deal1', 'Deal 1',           850,   ['p_tikka','d_reg']);
    addD('d_deal2', 'Deal 2',           1550,  ['p_tikka','d_1']);
    addD('d_deal3', 'Deal 3',           2150,  ['p_tikka','d_1']);
    addD('d_deal4', 'Deal 4',           850,   ['b_zinger','f_french','d_reg']);
    addD('d_deal5', 'Deal 5',           1200,  ['b_zinger','fc_1','f_french','d_reg']);
    addD('d_deal6', 'Deal 6',           1550,  ['b_zinger','e_nug','d_reg']);
    addD('d_deal7', 'Deal 7',           2700,  ['p_tikka','fc_w10','e_nug','f_french','d_1']);
    addD('d_deal8', 'Deal 8',           1550,  ['b_zinger','d_1']);
    addD('d_deal9', 'Deal 9',           3000,  ['p_tikka','d_15']);
    addD('d_deal10','Deal 10',          2700,  ['b_zinger','d_15']);
    addD('d_deal11','Deal 11',          2800,  ['p_tikka','d_15']);
    addD('d_deal12','Deal 12',          2150,  ['p_tikka','b_zinger','f_french','d_1']);
  });

  seedAll();
  console.log('[Server] Seeding complete. Credentials: admin / admin123');
}

// ─── Generic CRUD API ──────────────────────────────────────────────────────────

app.get('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const rows = db.prepare('SELECT id, data, createdAt, updatedAt FROM documents WHERE collectionName = ?').all(collection);
    res.json(rows.map(row => ({ ...JSON.parse(row.data), id: row.id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const row = db.prepare('SELECT id, data FROM documents WHERE collectionName = ? AND id = ?').get(collection, id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ ...JSON.parse(row.data), id: row.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    let id = data.id;
    if (!id) {
      if (collection === 'sales') {
        const result = db.prepare("SELECT MAX(CAST(id AS INTEGER)) as maxId FROM documents WHERE collectionName = 'sales'").get();
        id = ((result && result.maxId ? parseInt(result.maxId, 10) : 0) + 1).toString();
      } else {
        id = crypto.randomUUID();
      }
    }
    delete data.id;
    db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data) VALUES (?, ?, ?)').run(collection, id, JSON.stringify(data));
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:collection/bulk', (req, res) => {
  try {
    const { collection } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });
    const stmt = db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data) VALUES (?, ?, ?)');
    const insertMany = db.transaction((rows) => {
      for (const item of rows) {
        const id = item.id || crypto.randomUUID();
        const itemData = { ...item };
        delete itemData.id;
        stmt.run(collection, id, JSON.stringify(itemData));
      }
    });
    insertMany(items);
    res.json({ success: true, count: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const newData = req.body;
    const row = db.prepare('SELECT data FROM documents WHERE collectionName = ? AND id = ?').get(collection, id);
    const mergedData = row ? { ...JSON.parse(row.data), ...newData } : { ...newData };
    delete mergedData.id;
    db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(collection, id, JSON.stringify(mergedData));
    res.json({ id, ...mergedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const result = db.prepare('DELETE FROM documents WHERE collectionName = ? AND id = ?').run(collection, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    db.prepare('DELETE FROM documents WHERE collectionName = ?').run(collection);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Static Assets ─────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log('[Server] Listening on http://localhost:' + PORT);
  console.log('[Server] Database: ' + dbPath);
});
