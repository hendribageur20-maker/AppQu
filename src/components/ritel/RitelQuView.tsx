import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  X,
  User,
  Printer,
  ChevronRight,
  Package,
  Barcode,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

import {
  RitelProduct,
  RitelCartItem,
  RitelInvoice,
  UserProfile,
} from '../../types';
import {
  RitelStorageService,
  DEFAULT_RITEL_PRODUCTS,
} from '../../services/storageRitel';

interface RitelQuViewProps {
  currentUser: UserProfile;
  onBackToAppQu: () => void;
  showNotification: (msg: string) => void;
}

export const RitelQuView: React.FC<RitelQuViewProps> = ({
  currentUser,
  onBackToAppQu,
  showNotification,
}) => {
  // Navigation: Kasir (⚡), Stok (📦), Laporan (📊), Pengaturan (⚙️)
  const [activeNav, setActiveNav] = useState<'kasir' | 'stok' | 'laporan' | 'pengaturan'>('kasir');

  // Core Data
  const [products, setProducts] = useState<RitelProduct[]>([]);
  const [invoices, setInvoices] = useState<RitelInvoice[]>([]);
  const [deviceId, setDeviceId] = useState<string>('RITEL-DEV01');
  const [storeName, setStoreName] = useState<string>('Toko Kelontong Berkah RT 04');

  // Kasir Active Cart State (Key: productId, Value: qty)
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState<string>('Pembeli Langsung (Warga)');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'bon_warga'>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Receipt Modal State
  const [paidInvoice, setPaidInvoice] = useState<RitelInvoice | null>(null);

  // New Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<RitelProduct['category']>('sembako');
  const [newProdPrice, setNewProdPrice] = useState<number>(10000);
  const [newProdStock, setNewProdStock] = useState<number>(20);
  const [newProdUnit, setNewProdUnit] = useState<string>('Pcs');

  // Initial Load
  useEffect(() => {
    const id = RitelStorageService.getDeviceId();
    setDeviceId(id);
    setProducts(RitelStorageService.getProducts());
    setInvoices(RitelStorageService.getInvoices());
    setStoreName(RitelStorageService.getStoreName());
  }, []);

  // Grand Total & Total Item Count
  const grandTotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const prod = products.find((p) => p.id === productId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const totalItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Cart Operations
  const handleAddToCart = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const currentQty = cart[productId] || 0;
    if (currentQty >= prod.stock) {
      showNotification(`Stok ${prod.name} tersisa ${prod.stock} ${prod.unit}.`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      if (next > prod.stock) {
        showNotification(`Stok maksimum tercapai (${prod.stock} ${prod.unit}).`);
        return prev;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Checkout Flow
  const handleOpenCheckout = () => {
    if (grandTotal <= 0) {
      showNotification('Keranjang belanja masih kosong. Pilih barang terlebih dahulu.');
      return;
    }
    setCashGiven(grandTotal);
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = () => {
    const items: RitelCartItem[] = Object.entries(cart).map(([productId, qty]) => {
      const prod = products.find((p) => p.id === productId)!;
      return {
        id: `ci-${Date.now()}-${Math.random()}`,
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        qty,
        unit: prod.unit,
      };
    });

    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = invoices.length + 1;
    const invoiceNum = `INV-RIT-${dateStr}-${String(count).padStart(2, '0')}`;

    const newInvoice: RitelInvoice = {
      id: `inv-rit-${Date.now()}`,
      invoiceNumber: invoiceNum,
      cashierName: currentUser.name || 'Kasir Toko',
      customerName: customerName || 'Pembeli Warga',
      items,
      total: grandTotal,
      cashGiven: paymentMethod === 'tunai' ? cashGiven : grandTotal,
      change: paymentMethod === 'tunai' ? Math.max(0, cashGiven - grandTotal) : 0,
      paymentMethod,
      status: paymentMethod === 'bon_warga' ? 'bon' : 'lunas',
      createdAt: date.toISOString(),
      notes: checkoutNotes,
    };

    RitelStorageService.addInvoice(newInvoice);
    setInvoices([newInvoice, ...invoices]);
    setProducts(RitelStorageService.getProducts());
    setCart({});
    setIsCheckoutOpen(false);
    setPaidInvoice(newInvoice);
    showNotification(`Transaksi ${invoiceNum} sukses! Struk tercetak.`);
  };

  // Add Product Handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const skuCode = newProdSku || '899' + Math.floor(10000000 + Math.random() * 90000000);
    const newProduct: RitelProduct = {
      id: `rit-${Date.now()}`,
      sku: skuCode,
      name: newProdName,
      category: newProdCategory,
      price: newProdPrice,
      stock: newProdStock,
      unit: newProdUnit || 'Pcs',
      minStock: 5,
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    RitelStorageService.saveProducts(updated);
    setIsAddProductOpen(false);
    setNewProdName('');
    setNewProdSku('');
    showNotification(`Barang ${newProduct.name} berhasil ditambahkan ke inventaris.`);
  };

  // Adjust Stock
  const handleAdjustStock = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, p.stock + delta) };
      }
      return p;
    });
    setProducts(updated);
    RitelStorageService.saveProducts(updated);
  };

  // Filtered Products for Kasir & Stok
  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.includes(searchQuery);
    return matchCat && matchQuery;
  });

  return (
    <div className="bg-white text-slate-800 antialiased h-full flex flex-col overflow-hidden relative select-none">
      {/* ========================================================= */}
      {/* HEADER BIRU (EXACT MATCH TO USER'S PROVIDED CODE)         */}
      {/* ========================================================= */}
      <header className="bg-blue-600 text-white px-5 py-3.5 shadow-sm flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToAppQu}
            className="h-7 px-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-blue-100 flex items-center gap-1 text-[11px] font-bold transition-all active:scale-95"
            title="Kembali ke AppQu"
          >
            <span>◀ AppQu</span>
          </button>

          <div>
            <h1 className="font-bold text-base tracking-wide uppercase leading-tight">
              RitelQu
            </h1>
            <p className="text-[11px] text-blue-100 font-normal" id="device-status">
              ID Perangkat: {deviceId}
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <span
            className="text-[11px] bg-blue-700/80 px-2.5 py-1 rounded-full font-medium"
            id="cabang-label"
          >
            Cabang Utama
          </span>
        </div>
      </header>

      {/* ========================================================= */}
      {/* KONTEN UTAMA (SIDEBAR KIRI HIDDEN, LAYOUT PUTIH BERSIH)    */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 bg-white">
        {/* ======================================================= */}
        {/* VIEW 1: KASIR (AREA LIST VIEW MINIMALIS)                */}
        {/* ======================================================= */}
        {activeNav === 'kasir' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Customer & Barcode Search Strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs shrink-0 gap-2">
              <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pembeli / Warga..."
                  className="w-full text-xs bg-transparent font-medium text-slate-800 focus:outline-none truncate"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari SKU / nama barang..."
                    className="pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-36 xs:w-44 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {totalItemCount > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] text-slate-400 hover:text-red-500 font-semibold px-1"
                    title="Reset Keranjang"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
              {[
                { id: 'all', label: 'Semua Produk' },
                { id: 'sembako', label: 'Sembako' },
                { id: 'makanan', label: 'Makanan & Snack' },
                { id: 'minuman', label: 'Minuman' },
                { id: 'kebersihan', label: 'Kebersihan' },
                { id: 'bumbu', label: 'Bumbu Dapur' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === c.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Area List View Minimalis (Tanpa Kotak-kotak, Huruf Besar Tegas Jelas) */}
            <section
              className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-slate-100"
              id="list-container"
            >
              {filteredProducts.map((prod) => {
                const qty = cart[prod.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddToCart(prod.id)}
                    className={`py-3.5 flex justify-between items-center cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/40 -mx-5 px-5' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                          {prod.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.2 rounded-full font-mono">
                            x{qty}
                          </span>
                        )}
                        {prod.stock <= (prod.minStock || 5) && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Sisa {prod.stock}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        SKU: {prod.sku} • Stok: {prod.stock} {prod.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="font-bold text-sm text-blue-600 font-mono">
                          RP {prod.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Interactive Counter Stepper */}
                      {isSelected ? (
                        <div
                          className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-lg p-0.5 shadow-2xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleUpdateQty(prod.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold px-1 text-slate-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(prod.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors">
                          <Plus className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Area Ringkasan Pembayaran Ringkas (Exact Match to User's Style) */}
            <section className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center shrink-0">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Total Tagihan {totalItemCount > 0 ? `(${totalItemCount} Item)` : ''}
                </p>
                <p className="font-bold text-base text-slate-900 font-mono" id="grand-total">
                  RP {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>

              {/* TOMBOL BIRU */}
              <button
                onClick={handleOpenCheckout}
                disabled={grandTotal <= 0}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm transition active:scale-98 ${
                  grandTotal <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Proses Bayar
              </button>
            </section>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 2: STOK BARANG & INVENTARIS (📦)                   */}
        {/* ======================================================= */}
        {activeNav === 'stok' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold text-sm uppercase text-slate-900 tracking-tight">
                  Manajemen Stok & Inventaris Toko
                </h2>
                <p className="text-xs text-slate-500">
                  {products.length} Jenis barang terdaftar di {storeName}
                </p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Barang Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                        {prod.name}
                      </h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                        {prod.category}
                      </span>
                      {prod.stock <= (prod.minStock || 5) && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                          Stok Menipis!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      SKU: <span className="font-mono">{prod.sku}</span> • Harga:{' '}
                      <span className="font-bold text-blue-600 font-mono">
                        RP {prod.price.toLocaleString('id-ID')}
                      </span>
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {prod.stock}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{prod.unit}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustStock(prod.id, -1)}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs"
                        title="Kurangi Stok"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustStock(prod.id, 5)}
                        className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs"
                        title="Tambah 5 Stok"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 3: LAPORAN PENJUALAN RITEL (📊)                    */}
        {/* ======================================================= */}
        {activeNav === 'laporan' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Summary KPI Strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 grid grid-cols-2 gap-3 text-xs shrink-0">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Total Omset Ritel
                </p>
                <p className="font-bold text-base text-blue-600 font-mono">
                  RP {invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Total Transaksi
                </p>
                <p className="font-bold text-base text-slate-900 font-mono">
                  {invoices.length} Penjualan
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setPaidInvoice(inv)}
                  className="py-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded uppercase">
                        {inv.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                      {inv.customerName || 'Pembeli Langsung'}
                    </h3>

                    <p className="text-xs text-slate-500">
                      {inv.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-blue-600 font-mono">
                      RP {inv.total.toLocaleString('id-ID')}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 4: PENGATURAN TOKO KELONTONG (⚙️)                  */}
        {/* ======================================================= */}
        {activeNav === 'pengaturan' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold text-sm uppercase text-slate-900 tracking-tight">
                Pengaturan Toko & POS RitelQu
              </h2>
              <p className="text-xs text-slate-500">
                Konfigurasi profil toko kelontong, kasir, & printer thermal
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block">ID Registrasi Perangkat</label>
                <input
                  type="text"
                  value={deviceId}
                  disabled
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Nama Toko Kelontong / Warung</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Kasir Bertugas</label>
                <input
                  type="text"
                  defaultValue={currentUser.name || 'Ibu Hj. Hendra (Bu RT)'}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1 text-xs">
                <span className="font-bold text-blue-900 block">Koneksi Printer Struk Thermal:</span>
                <p className="text-[11px] text-blue-800">
                  Mendukung printer thermal Bluetooth / USB ukuran 58mm dan 80mm untuk mencetak struk belanja toko kelontong.
                </p>
              </div>

              <button
                onClick={() => {
                  RitelStorageService.setStoreName(storeName);
                  showNotification('Pengaturan RitelQu berhasil disimpan.');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-2xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* NAVBAR BAWAH (MOBILE FIRST NAVIGATION) - PRECISE MATCH    */}
      {/* ========================================================= */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex justify-around items-center px-2 z-20 text-slate-600">
        <button
          onClick={() => setActiveNav('kasir')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-semibold text-[10px] uppercase tracking-wider transition ${
            activeNav === 'kasir' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <span className="text-lg mb-0.5">⚡</span>
          <span>Kasir</span>
        </button>

        <button
          onClick={() => setActiveNav('stok')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'stok' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <span className="text-lg mb-0.5">📦</span>
          <span>Stok</span>
        </button>

        <button
          onClick={() => setActiveNav('laporan')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'laporan' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <span className="text-lg mb-0.5">📊</span>
          <span>Laporan</span>
        </button>

        <button
          onClick={() => setActiveNav('pengaturan')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'pengaturan' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          <span className="text-lg mb-0.5">⚙️</span>
          <span>Pengaturan</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* MODAL 1: PROSES BAYAR TAGIHAN BELANJA                     */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Pembayaran Belanja Ritel
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Belanja:</span>
                <span className="font-bold text-blue-600 font-mono text-sm">
                  RP {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'tunai', label: 'Tunai' },
                  { id: 'qris', label: 'QRIS' },
                  { id: 'bon_warga', label: 'Bon Warga' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                      paymentMethod === m.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'tunai' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-sm"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {[
                    { label: 'Uang Pas', val: grandTotal },
                    { label: '50rb', val: 50000 },
                    { label: '100rb', val: 100000 },
                    { label: '200rb', val: 200000 },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashGiven(btn.val)}
                      className="py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between text-xs mt-1 text-slate-500 pt-1 border-t border-slate-100">
                  <span>Kembalian:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    RP {Math.max(0, cashGiven - grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Catatan Penjualan (Opsional)
              </label>
              <input
                type="text"
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Contoh: Titip di pos satpam / bayar akhir bulan..."
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-98"
            >
              Konfirmasi & Selesai
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KWITANSI RESMI BELANJA RITEL                      */}
      {/* ========================================================= */}
      {paidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                {storeName}
              </span>
              <h3 className="font-bold text-base text-slate-900 mt-0.5">
                Struk Penjualan Belanja
              </h3>
              <p className="text-[11px] font-mono text-slate-400">{paidInvoice.invoiceNumber}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900">{paidInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{paidInvoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran:</span>
                <span className="uppercase font-semibold text-blue-700">
                  {paidInvoice.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* List Item Nota */}
            <div className="border-t border-b border-slate-100 py-2 divide-y divide-slate-100 text-xs max-h-48 overflow-y-auto">
              {paidInvoice.items.map((it) => (
                <div key={it.id} className="py-1.5 flex justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{it.name}</p>
                    <span className="text-slate-400 text-[11px]">
                      {it.qty} {it.unit} x RP {it.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    RP {(it.price * it.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="uppercase tracking-tight text-slate-700">Total Bayar:</span>
                <span className="font-mono text-blue-600 text-base">
                  RP {paidInvoice.total.toLocaleString('id-ID')}
                </span>
              </div>
              {paidInvoice.paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Uang Diterima:</span>
                    <span className="font-mono font-semibold">
                      RP {(paidInvoice.cashGiven || paidInvoice.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Kembalian:</span>
                    <span className="font-mono font-bold text-slate-800">
                      RP {(paidInvoice.change || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  showNotification('Struk belanja dikirim ke printer thermal.');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setPaidInvoice(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TAMBAH BARANG INVENTARIS BARU                    */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Tambah Barang Toko
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Barang</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Contoh: Sabun Mandi Batang 100g..."
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">SKU / Barcode</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="8991..."
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Kategori</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                  >
                    <option value="sembako">Sembako</option>
                    <option value="makanan">Makanan</option>
                    <option value="minuman">Minuman</option>
                    <option value="kebersihan">Kebersihan</option>
                    <option value="bumbu">Bumbu Dapur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Stok Awal</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Satuan</label>
                <select
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                >
                  <option value="Pcs">Pcs</option>
                  <option value="Sak">Sak</option>
                  <option value="Dus">Dus</option>
                  <option value="Kg">Kg</option>
                  <option value="Renteng">Renteng</option>
                  <option value="Galon">Galon</option>
                  <option value="Tabung">Tabung</option>
                  <option value="Pouch">Pouch</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm"
              >
                Simpan Barang
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
