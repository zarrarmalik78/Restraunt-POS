import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const dataDir = process.env.GTRAX_DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'generaltrax.sqlite');
const db = new Database(dbPath);

// Create generic documents table to mimic NoSQL behavior
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

// Add a secondary table/index for serial uniqueness if we want to be strict
db.exec(`
  CREATE TABLE IF NOT EXISTS serial_registry (
    serialNumber TEXT NOT NULL,
    shopId TEXT NOT NULL,
    productId TEXT NOT NULL,
    PRIMARY KEY (serialNumber, shopId)
  );
`);

// Auto-seed default settings, admin user (admin/admin123), and default categories on fresh database
const seedCheck = db.prepare("SELECT count(*) as count FROM documents WHERE collectionName = 'users'");
const userCountResult = seedCheck.get();
if (userCountResult.count === 0) {
  console.log('Fresh database detected. Seeding default configurations...');
  const shopId = 'default_shop';

  // 1. Seed Shop Settings
  const defaultSettings = {
    shopName: 'FastBites Restaurant',
    shopLogo: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopWebsite: '',
    currency: 'Rs',
    invoicePrefix: 'INV-',
    invoiceFooter: 'Thank you for your business!',
    lowStockThreshold: 5,
    themeColor: '#8b5cf6',
    accentColor: '#d946ef',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.prepare('INSERT INTO documents (collectionName, id, data) VALUES (?, ?, ?)')
    .run('settings', shopId, JSON.stringify(defaultSettings));

  // 2. Seed Admin User (username: 'admin', password: 'admin123')
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('admin123', salt);
  const defaultUser = {
    shopId,
    username: 'admin',
    passwordHash,
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.prepare('INSERT INTO documents (collectionName, id, data) VALUES (?, ?, ?)')
    .run('users', 'default_admin', JSON.stringify(defaultUser));

  // 3. Seed Default Product Categories
  const defaultCategories = [
    { name: 'Burgers', color: '#f59e0b' },
    { name: 'Pizza', color: '#ef4444' },
    { name: 'Sandwiches', color: '#8b5cf6' },
    { name: 'Shawarma', color: '#10b981' },
    { name: 'Fries', color: '#eab308' },
    { name: 'Drinks', color: '#3b82f6' },
    { name: 'Desserts', color: '#ec4899' },
    { name: 'Deals', color: '#6366f1' }
  ];
  const catStmt = db.prepare('INSERT INTO documents (collectionName, id, data) VALUES (?, ?, ?)');
  for (const cat of defaultCategories) {
    const id = crypto.randomUUID();
    const catData = {
      shopId,
      name: cat.name,
      color: cat.color,
      createdAt: new Date().toISOString()
    };
    catStmt.run('categories', id, JSON.stringify(catData));
  }
  console.log('Seeding completed. Default credentials: username = admin, password = admin123');
}

// Generic CRUD API
app.get('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const stmt = db.prepare('SELECT id, data, createdAt, updatedAt FROM documents WHERE collectionName = ?');
    const rows = stmt.all(collection);
    
    const docs = rows.map(row => ({
      ...JSON.parse(row.data),
      id: row.id,
      _createdAt: row.createdAt,
      _updatedAt: row.updatedAt
    }));
    
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const stmt = db.prepare('SELECT id, data FROM documents WHERE collectionName = ? AND id = ?');
    const row = stmt.get(collection, id);
    
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json({
      ...JSON.parse(row.data),
      id: row.id
    });
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
        const maxStmt = db.prepare("SELECT MAX(CAST(id AS INTEGER)) as maxId FROM documents WHERE collectionName = 'sales'");
        const result = maxStmt.get();
        const nextId = result && result.maxId ? parseInt(result.maxId, 10) + 1 : 1;
        id = nextId.toString();
      } else {
        id = crypto.randomUUID();
      }
    }
    delete data.id;
    
    const stmt = db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data) VALUES (?, ?, ?)');
    stmt.run(collection, id, JSON.stringify(data));
    
    res.json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:collection/bulk', (req, res) => {
  try {
    const { collection } = req.params;
    const items = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected array of items' });
    }

    const stmt = db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data) VALUES (?, ?, ?)');
    const insertMany = db.transaction((cats) => {
      for (const item of cats) {
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
    
    const getStmt = db.prepare('SELECT data FROM documents WHERE collectionName = ? AND id = ?');
    const row = getStmt.get(collection, id);
    
    let mergedData = {};
    if (row) {
      mergedData = {
        ...JSON.parse(row.data),
        ...newData
      };
    } else {
      mergedData = {
        ...newData
      };
    }
    delete mergedData.id;

    const stmt = db.prepare('INSERT OR REPLACE INTO documents (collectionName, id, data, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
    stmt.run(collection, id, JSON.stringify(mergedData));
    
    res.json({ id, ...mergedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const stmt = db.prepare('DELETE FROM documents WHERE collectionName = ? AND id = ?');
    const result = stmt.run(collection, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const stmt = db.prepare('DELETE FROM documents WHERE collectionName = ?');
    stmt.run(collection);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets in production
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`GeneralTrax Local Server running on http://localhost:${PORT}`);
  console.log(`Database stored at: ${dbPath}`);
});
