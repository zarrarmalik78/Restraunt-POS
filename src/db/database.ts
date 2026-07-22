export interface Product {
  id?: string;
  shopId: string;
  name: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  customDiscountedPrice?: number;
  image?: string;
  variants?: { name: string; price: number; cost: number; customDiscountedPrice?: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SerialUnit {
  id?: string;
  productId: string;
  shopId: string;
  serialNumber: string;
  vendorId?: string;
  purchaseDate: Date;
  warrantyExpiryDate: Date;
  status: 'in_stock' | 'sold' | 'returned' | 'warranty_claimed';
  costPrice?: number;
  sellingPrice?: number;
  soldDate?: Date;
  soldToCustomerId?: string;
  saleId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: string;
  shopId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Vendor {
  id?: string;
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  creditBalance: number;
  type: 'vendor';
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: string;
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditBalance: number;
  type: 'customer';
  cardNumber?: string;
  dateOfIssue?: Date | string;
  distributor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  totalPrice: number;
  profit: number;
  customDiscountedPrice?: number;
  kitchenNote?: string;
  variantName?: string;
  isDeal?: boolean;
}

export interface SalePayment {
  method: 'cash' | 'online' | 'credit';
  amount: number;
}

export interface Sale {
  id?: string;
  shopId: string;
  sessionId?: string;
  customerId?: string;
  items: SaleItem[];
  totalAmount: number;
  totalCOGS: number;
  totalProfit: number;
  paymentMethod: 'cash' | 'card';
  orderType: 'dine_in' | 'take_away' | 'delivery';
  tableNumber?: string;
  status?: 'open' | 'completed' | 'returned';
  returnedAt?: Date;
  returnedBy?: string;
  returnReason?: string;
  paymentSplits?: SalePayment[];
  saleDate: Date;
  actorId?: string;
  actorName: string;
  actorRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id?: string;
  shopId: string;
  sessionId?: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: Date;
  vendorId?: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Credit {
  id?: string;
  shopId: string;
  customerId: string;
  amount: number;
  transactionType: 'given' | 'taken';
  notes?: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  createdAt: Date;
}


export interface InventoryLog {
  id?: string;
  shopId: string;
  productId: string;
  productName: string;
  action: 'restock' | 'sale' | 'return' | 'manual_adjustment' | 'purchase';
  type: string;
  change: number; // quantity changed
  reason?: string;
  notes?: string;
  vendorId?: string;
  amount?: number;
  paymentMethod?: string;
  isSerialized?: boolean;
  serialNumbers?: string[];
  actorId?: string;
  actorName: string;
  actorRole: string;
  createdAt: Date;
}

export interface Setting {
  id?: string; // e.g. "shop_settings"
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  showShopAddress: boolean;
  showShopPhone: boolean;
  footerMessage: string;
  shopLogo: string | null;
  currency: string;
  cardDiscountPercentage: number;
  managerPassword?: string;
  receiptWidth?: number;
  receiptFontSize?: number;
  receiptPadding?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id?: string;
  shopId: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'cashier';
  createdAt: Date;
  updatedAt: Date;
}

export interface RmaClaim {
  id?: string;
  shopId: string;
  serialNumber: string;
  productId: string;
  productName: string;
  customerId?: string;
  customerName?: string;
  issueDescription: string;
  status: 'pending' | 'sent_to_vendor' | 'returned_to_shop' | 'completed' | 'cancelled';
  vendorName?: string;
  sentDate?: Date;
  returnDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// EventTarget for reactive local updates
class DBChangeNotifier extends EventTarget {
  notify(tableName: string) {
    this.dispatchEvent(new CustomEvent(tableName));
  }
}
export const dbNotifier = new DBChangeNotifier();

const API_BASE_URL = 'http://localhost:3001/api';

export const setDbShopId = (shopId: string | null) => {
  // Ignored in offline single-shop mode
};

export const isDbReady = () => true;

export class LocalTable<T> {
  constructor(public collectionName: string) {}

  public parseDates(obj: any): any {
    if (!obj) return obj;
    const res = { ...obj };
    for (const key of Object.keys(res)) {
      const val = res[key];
      if (val && typeof val === 'object' && typeof val.toDate === 'function') {
        res[key] = val.toDate();
      } else if (typeof val === 'string' && (
        val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || 
        val.match(/^\d{4}-\d{2}-\d{2}$/)
      )) {
        res[key] = new Date(val);
      }
    }
    return res;
  }

  private cleanData(obj: any): any {
    if (!obj) return obj;
    const res = { ...obj };
    Object.keys(res).forEach(key => {
      if (res[key] === undefined) {
        delete res[key];
      }
    });
    return res;
  }

  async count() {
    try {
      const all = await this.toArray();
      return all.length;
    } catch (error) {
      console.error(`Count failed for ${this.collectionName}:`, error);
      return 0;
    }
  }

  async add(item: T) {
    const cleaned = this.cleanData({ ...item, shopId: 'default_shop' });
    const response = await fetch(`${API_BASE_URL}/${this.collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned)
    });
    if (!response.ok) throw new Error(`Failed to add to ${this.collectionName}`);
    const data = await response.json();
    dbNotifier.notify(this.collectionName);
    return this.parseDates(data);
  }

  async put(item: T & { id?: string }) {
    const cleaned = this.cleanData({ ...item, shopId: 'default_shop' });
    if (cleaned.id) {
      const response = await fetch(`${API_BASE_URL}/${this.collectionName}/${cleaned.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned)
      });
      if (!response.ok) throw new Error(`Failed to update ${this.collectionName}`);
      const data = await response.json();
      dbNotifier.notify(this.collectionName);
      return this.parseDates(data);
    } else {
      return this.add(cleaned as T);
    }
  }

  async bulkAdd(items: T[]) {
    const cleanedItems = items.map(item => this.cleanData({ ...item, shopId: 'default_shop' }));
    const response = await fetch(`${API_BASE_URL}/${this.collectionName}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedItems)
    });
    if (!response.ok) throw new Error(`Failed to bulk add to ${this.collectionName}`);
    dbNotifier.notify(this.collectionName);
  }

  async bulkDelete(ids: string[]) {
    for (const id of ids) {
      await fetch(`${API_BASE_URL}/${this.collectionName}/${id}`, {
        method: 'DELETE'
      });
    }
    dbNotifier.notify(this.collectionName);
  }

  async update(id: string, item: Partial<T>) {
    const cleaned = this.cleanData(item);
    const response = await fetch(`${API_BASE_URL}/${this.collectionName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned)
    });
    if (!response.ok) throw new Error(`Failed to update ${this.collectionName}/${id}`);
    dbNotifier.notify(this.collectionName);
  }

  async delete(id?: string) {
    if (!id) {
      const response = await fetch(`${API_BASE_URL}/${this.collectionName}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete collection ${this.collectionName}`);
      dbNotifier.notify(this.collectionName);
      return;
    }
    const response = await fetch(`${API_BASE_URL}/${this.collectionName}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete ${this.collectionName}/${id}`);
    dbNotifier.notify(this.collectionName);
  }

  async get(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/${this.collectionName}/${id}`);
      if (response.status === 404) return undefined;
      if (!response.ok) return undefined;
      const data = await response.json();
      return this.parseDates(data);
    } catch {
      return undefined;
    }
  }

  async toArray() {
    try {
      const response = await fetch(`${API_BASE_URL}/${this.collectionName}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => this.parseDates(d));
    } catch (error) {
      console.error(`toArray failed for ${this.collectionName}:`, error);
      return [];
    }
  }

  where(field: string) {
    return {
      equalsIgnoreCase: (value: string) => {
        return {
          toArray: async () => {
            const all = await this.toArray();
            return all.filter((item: any) => String(item[field]).toLowerCase() === String(value).toLowerCase());
          }
        }
      },
      equals: (value: any) => {
        return {
          toArray: async () => {
            const all = await this.toArray();
            return all.filter((item: any) => item[field] === value);
          }
        }
      }
    }
  }
}

export interface Deal {
  id?: string;
  shopId: string;
  name: string;
  categoryId: string;
  image?: string;
  price: number;
  customDiscountedPrice?: number;
  items: { productId: string; quantity: number; variantName?: string }[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashSession {
  id?: string;
  shopId: string;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  openedBy: string; // actorName
  closedBy?: string; // actorName
  openingCash?: number;
  expectedCash?: number;
  totalOrders?: number;
  totalSales?: number;
  totalCashPayments?: number;
  totalOnlinePayments?: number;
  totalReversedOrders?: number;
  totalExpenses?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const db = {
  cashSessions: new LocalTable<CashSession>('cashSessions'),
  products: new LocalTable<Product>('products'),
  deals: new LocalTable<Deal>('deals'),
  serialUnits: new LocalTable<SerialUnit>('serialUnits'),
  categories: new LocalTable<Category>('categories'),
  vendors: new LocalTable<Vendor>('vendors'),
  customers: new LocalTable<Customer>('customers'),
  sales: new LocalTable<Sale>('sales'),
  expenses: new LocalTable<Expense>('expenses'),
  credits: new LocalTable<Credit>('credits'),
  inventoryLogs: new LocalTable<InventoryLog>('inventoryLogs'),
  settings: new LocalTable<Setting>('settings'),
  users: new LocalTable<User>('users'),
  rmaClaims: new LocalTable<RmaClaim>('rmaClaims'),
  export: async () => {
    const data: any = {};
    for (const key of Object.keys(db)) {
      if (!['export', 'import', 'delete', 'open'].includes(key)) {
        const table = (db as any)[key];
        if (table && typeof table.toArray === 'function') {
          data[key] = await table.toArray();
        }
      }
    }
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  },
  import: async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const key of Object.keys(data)) {
        const table = (db as any)[key];
        if (table && typeof table.bulkAdd === 'function' && Array.isArray(data[key]) && data[key].length > 0) {
          await table.bulkAdd(data[key]);
        }
      }
    } catch (err) {
      console.error('Import failed:', err);
      throw new Error('Failed to import database file.');
    }
  },
  delete: async () => {
    for (const key of Object.keys(db)) {
      if (!['export', 'import', 'delete', 'open'].includes(key)) {
        const table = (db as any)[key];
        if (table && typeof table.delete === 'function') {
          // Deletes the whole collection
          await table.delete();
        }
      }
    }
  },
  open: async () => {}
};


