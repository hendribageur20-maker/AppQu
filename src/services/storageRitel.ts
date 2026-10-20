import { RitelProduct, RitelInvoice } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'ritelqu_products_v1',
  INVOICES: 'ritelqu_invoices_v1',
  DEVICE_ID: 'ritelqu_device_id',
  STORE_NAME: 'ritelqu_store_name',
};

export const DEFAULT_RITEL_PRODUCTS: RitelProduct[] = [
  {
    id: 'rit-1',
    sku: '89910012001',
    name: 'Minyak Goreng 2L Pouch',
    category: 'sembako',
    price: 34000,
    stock: 48,
    unit: 'Pcs',
    minStock: 10,
  },
  {
    id: 'rit-2',
    sku: '89910012002',
    name: 'Beras Premium 5KG',
    category: 'sembako',
    price: 72500,
    stock: 20,
    unit: 'Sak',
    minStock: 5,
  },
  {
    id: 'rit-3',
    sku: '89910012003',
    name: 'Gula Pasir 1KG',
    category: 'sembako',
    price: 17000,
    stock: 35,
    unit: 'Pcs',
    minStock: 8,
  },
  {
    id: 'rit-4',
    sku: '89910012004',
    name: 'Mie Instan Goreng (Karton)',
    category: 'makanan',
    price: 112000,
    stock: 12,
    unit: 'Dus',
    minStock: 3,
  },
  {
    id: 'rit-5',
    sku: '89910012005',
    name: 'Telur Ayam Segar 1KG',
    category: 'sembako',
    price: 28000,
    stock: 25,
    unit: 'Kg',
    minStock: 6,
  },
  {
    id: 'rit-6',
    sku: '89910012006',
    name: 'Kopi Kapal Api Spesial Mix 10s',
    category: 'minuman',
    price: 15000,
    stock: 30,
    unit: 'Renteng',
    minStock: 5,
  },
  {
    id: 'rit-7',
    sku: '89910012007',
    name: 'Gas Elpiji 3KG (Tukar Tabung)',
    category: 'sembako',
    price: 22000,
    stock: 9,
    unit: 'Tabung',
    minStock: 4,
  },
  {
    id: 'rit-8',
    sku: '89910012008',
    name: 'Air Galon Aqua 19L (Refill Resmi)',
    category: 'minuman',
    price: 20000,
    stock: 16,
    unit: 'Galon',
    minStock: 5,
  },
  {
    id: 'rit-9',
    sku: '89910012009',
    name: 'Sabun Cuci Piring Jeruk Nipis 780ml',
    category: 'kebersihan',
    price: 14500,
    stock: 24,
    unit: 'Pouch',
    minStock: 5,
  },
  {
    id: 'rit-10',
    sku: '89910012010',
    name: 'Kecap Manis Bango 520ml',
    category: 'bumbu',
    price: 23000,
    stock: 18,
    unit: 'Pouch',
    minStock: 4,
  },
];

export const DEFAULT_RITEL_INVOICES: RitelInvoice[] = [
  {
    id: 'inv-rit-1',
    invoiceNumber: 'INV-RIT-20261019-01',
    cashierName: 'Bu RT / Hendra',
    customerName: 'Budi Santoso (Blok C3)',
    items: [
      { id: 'ci-1', productId: 'rit-1', sku: '89910012001', name: 'Minyak Goreng 2L Pouch', price: 34000, qty: 1, unit: 'Pcs' },
      { id: 'ci-2', productId: 'rit-3', sku: '89910012003', name: 'Gula Pasir 1KG', price: 17000, qty: 2, unit: 'Pcs' },
    ],
    total: 68000,
    cashGiven: 70000,
    change: 2000,
    paymentMethod: 'tunai',
    status: 'lunas',
    createdAt: '2026-10-19T08:30:00Z',
    notes: 'Belanja harian warga',
  },
  {
    id: 'inv-rit-2',
    invoiceNumber: 'INV-RIT-20261019-02',
    cashierName: 'Bu RT / Hendra',
    customerName: 'Siti Rahmawati (Blok B3)',
    items: [
      { id: 'ci-3', productId: 'rit-2', sku: '89910012002', name: 'Beras Premium 5KG', price: 72500, qty: 1, unit: 'Sak' },
      { id: 'ci-4', productId: 'rit-5', sku: '89910012005', name: 'Telur Ayam Segar 1KG', price: 28000, qty: 1, unit: 'Kg' },
    ],
    total: 100500,
    cashGiven: 100500,
    change: 0,
    paymentMethod: 'qris',
    status: 'lunas',
    createdAt: '2026-10-19T11:15:00Z',
    notes: 'QRIS Pembayaran Warga',
  },
];

export const RitelStorageService = {
  getDeviceId(): string {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = 'RITEL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  },

  getStoreName(): string {
    return localStorage.getItem(STORAGE_KEYS.STORE_NAME) || 'Toko Kelontong Berkah RT 04';
  },

  setStoreName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.STORE_NAME, name);
  },

  getProducts(): RitelProduct[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      this.saveProducts(DEFAULT_RITEL_PRODUCTS);
      return DEFAULT_RITEL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_RITEL_PRODUCTS;
    }
  },

  saveProducts(products: RitelProduct[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getInvoices(): RitelInvoice[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      this.saveInvoices(DEFAULT_RITEL_INVOICES);
      return DEFAULT_RITEL_INVOICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_RITEL_INVOICES;
    }
  },

  saveInvoices(invoices: RitelInvoice[]): void {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  addInvoice(invoice: RitelInvoice): void {
    const list = this.getInvoices();
    list.unshift(invoice);
    this.saveInvoices(list);

    // Deduct stock
    const products = this.getProducts();
    for (const item of invoice.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
      }
    }
    this.saveProducts(products);
  },
};
