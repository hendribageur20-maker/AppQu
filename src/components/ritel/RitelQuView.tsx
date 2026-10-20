import React, { useState, useEffect, useRef } from 'react';
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
  Mic,
  MicOff,
  Bot,
  Send,
  Download,
  Share2,
  Users,
  RotateCcw,
  Percent,
  FileText,
  Mail,
  HelpCircle,
  Phone,
  Save,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';

import {
  RitelProduct,
  RitelCartItem,
  RitelInvoice,
  RitelCustomer,
  UserProfile,
} from '../../types';
import {
  RitelStorageService,
  DEFAULT_RITEL_PRODUCTS,
} from '../../services/storageRitel';
import {
  RitelAiService,
  VoiceMatchResult,
  CrossSellItem,
} from '../../services/ritelAiService';

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
  // Navigation: Kasir (⚡), Stok & CRM (📦), RitelQu AI (🤖), Laporan & Promo (📊), Pengaturan (⚙️)
  const [activeNav, setActiveNav] = useState<'kasir' | 'stok' | 'ai' | 'laporan' | 'pengaturan'>('kasir');

  // Sub-tabs
  const [stokTab, setStokTab] = useState<'inventaris' | 'crm'>('inventaris');
  const [laporanTab, setLaporanTab] = useState<'omset' | 'promosi'>('omset');

  // Core Data
  const [products, setProducts] = useState<RitelProduct[]>([]);
  const [invoices, setInvoices] = useState<RitelInvoice[]>([]);
  const [customers, setCustomers] = useState<RitelCustomer[]>([]);
  const [deviceId, setDeviceId] = useState<string>('RITEL-DEV01');
  const [storeName, setStoreName] = useState<string>('Toko Kelontong Berkah RT 04');
  const [storePhone, setStorePhone] = useState<string>('081234567890');

  // Kasir Active Cart State (Key: productId, Value: qty)
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState<string>('Pembeli Langsung (Warga)');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBarcodeScanMode, setIsBarcodeScanMode] = useState<boolean>(false);
  const [manualSkuInput, setManualSkuInput] = useState<string>('');

  // Speech-to-Text State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceQueryText, setVoiceQueryText] = useState<string>('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer' | 'bon_warga'>('tunai');
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
  const [newProdBuyPrice, setNewProdBuyPrice] = useState<number>(8500);
  const [newProdStock, setNewProdStock] = useState<number>(20);
  const [newProdUnit, setNewProdUnit] = useState<string>('Pcs');
  const [newProdExpiry, setNewProdExpiry] = useState<string>('');

  // New Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustBlock, setNewCustBlock] = useState('Blok C1 No. 01');

  // AI Chat & Consultation State
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; source?: 'gemini' | 'local_expert'; time: string }[]
  >([
    {
      sender: 'ai',
      text: 'Halo! Saya RitelQu AI, asisten pintar manajemen toko ritel Anda (100% Gratis). Saya siap menganalisis stok menipis, strategi promosi bundling, catatan bon warga, hingga troubleshooting printer thermal Bluetooth!',
      source: 'local_expert',
      time: 'Baru saja',
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    const id = RitelStorageService.getDeviceId();
    setDeviceId(id);
    setProducts(RitelStorageService.getProducts());
    setInvoices(RitelStorageService.getInvoices());
    setCustomers(RitelStorageService.getCustomers());
    setStoreName(RitelStorageService.getStoreName());
    setStorePhone(RitelStorageService.getStorePhone());
  }, []);

  // Grand Total & Total Item Count
  const grandTotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const prod = products.find((p) => p.id === productId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const totalItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Cross Selling Recommendations from RitelQu AI
  const crossSellItems: CrossSellItem[] = RitelAiService.getCrossSellRecommendations(
    Object.keys(cart),
    products
  );

  // Cart Operations
  const handleAddToCart = (productId: string, addQty: number = 1) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const currentQty = cart[productId] || 0;
    if (currentQty + addQty > prod.stock) {
      showNotification(`Stok ${prod.name} hanya tersisa ${prod.stock} ${prod.unit}.`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + addQty,
    }));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const currentQty = cart[productId] || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      const nextCart = { ...cart };
      delete nextCart[productId];
      setCart(nextCart);
    } else {
      if (newQty > prod.stock) {
        showNotification(`Maksimal stok ${prod.name} hanya ${prod.stock} ${prod.unit}.`);
        return;
      }
      setCart((prev) => ({
        ...prev,
        [productId]: newQty,
      }));
    }
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Barcode / SKU Direct Quick Enter
  const handleSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSkuInput.trim()) return;

    const found = products.find(
      (p) => p.sku === manualSkuInput.trim() || p.sku.endsWith(manualSkuInput.trim())
    );

    if (found) {
      handleAddToCart(found.id, 1);
      showNotification(`+ ${found.name} berhasil ditambahkan via scan SKU!`);
      setManualSkuInput('');
    } else {
      showNotification(`SKU ${manualSkuInput} tidak ditemukan dalam stok!`);
    }
  };

  // Speech-to-Text Feature
  const handleStartVoiceEntry = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);
        showNotification('🎙️ Mendengarkan ucapan... (Sebutkan nama barang & jumlah)');

        recognition.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          setIsListening(false);
          processVoiceMatch(spoken);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setIsVoiceModalOpen(true);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition error:', e);
      }
    }

    // Fallback modal if Web Speech API is blocked or unsupported
    setIsVoiceModalOpen(true);
  };

  const processVoiceMatch = (spokenText: string) => {
    const match = RitelAiService.parseVoiceToCart(spokenText, products);
    if (match) {
      handleAddToCart(match.product.id, match.qty);
      showNotification(
        `🎙️ "${spokenText}" -> Ditambahkan: ${match.product.name} (x${match.qty})`
      );
    } else {
      showNotification(`RitelQu AI belum menemukan barang sesuai: "${spokenText}"`);
    }
    setIsVoiceModalOpen(false);
    setVoiceQueryText('');
  };

  // Checkout Open
  const handleOpenCheckout = () => {
    if (grandTotal <= 0) return;
    setCashGiven(grandTotal);
    setPaymentMethod('tunai');
    setIsCheckoutOpen(true);
  };

  // Confirm Payment & Record Invoice
  const handleConfirmPayment = () => {
    if (grandTotal <= 0) return;

    const items: RitelCartItem[] = Object.entries(cart).map(([productId, qty]) => {
      const prod = products.find((p) => p.id === productId)!;
      return {
        id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      customerPhone: customerPhone,
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
    setCustomers(RitelStorageService.getCustomers());
    setCart({});
    setIsCheckoutOpen(false);
    setPaidInvoice(newInvoice);
    showNotification(`Transaksi ${invoiceNum} sukses! Struk tercatat.`);
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
      buyPrice: newProdBuyPrice,
      stock: newProdStock,
      unit: newProdUnit || 'Pcs',
      minStock: 5,
      expiryDate: newProdExpiry || undefined,
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

  // Add Customer Handler
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: RitelCustomer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone || '081234567890',
      blockNumber: newCustBlock,
      points: 10,
      totalDebt: 0,
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    RitelStorageService.saveCustomers(updated);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    showNotification(`Pelanggan ${newCust.name} berhasil didaftarkan!`);
  };

  // Pay Bon / Debt
  const handlePayDebt = (customerId: string, amount: number) => {
    RitelStorageService.payCustomerDebt(customerId, amount);
    setCustomers(RitelStorageService.getCustomers());
    showNotification(`Pelunasan bon sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`);
  };

  // Send WhatsApp Reminder
  const handleSendDebtWa = (customer: RitelCustomer) => {
    const msg = RitelAiService.generateDebtReminderWa(customer, storeName);
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const targetPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Broadcast Promo WA
  const handleBroadcastPromoWa = () => {
    const msg = RitelAiService.generatePromoBroadcast(storeName, products);
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Standalone Downloads
  const handleDownloadKatalog = () => {
    const html = RitelStorageService.generateKatalogHtml(storeName, products, storePhone);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katalog-${storeName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Berkas katalog.html berhasil diunduh!');
  };

  const handleDownloadKasir = () => {
    const html = RitelStorageService.generateKasirHtml(storeName, products, currentUser.name);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasir-mandiri-${storeName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Berkas kasir.html berhasil diunduh! Siap dibuka di HP kedua.');
  };

  const handleDownloadCabang = () => {
    const html = RitelStorageService.generateCabangModulHtml(storeName, 'Cabang Baru RT 04', products);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cabang_modul.html`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Berkas cabang_modul.html berhasil diunduh!');
  };

  // AI Chat Submit
  const handleSendAiPrompt = async (promptText?: string) => {
    const query = promptText || aiChatInput;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setAiChatInput('');
    setIsAiLoading(true);

    try {
      const response = await RitelAiService.askRitelAi(query, {
        products,
        invoices,
        customers,
        storeName,
        deviceId,
      });

      const aiMsg = {
        sender: 'ai' as const,
        text: response.answer,
        source: response.source,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setAiChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'RitelQu AI siap membantu mengelola toko Anda.',
          source: 'local_expert',
          time: 'Baru saja',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Customer Care Bug Report Draft
  const handleDraftSupportEmail = () => {
    const emailData = RitelAiService.generateCustomerCareEmail(
      'Kendala pemindaian barcode / sinkronisasi struk kasir RitelQu.',
      deviceId,
      storeName
    );
    window.location.href = emailData.mailtoUrl;
    showNotification('Draf email support AppQu telah dibuka!');
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
      {/* HEADER BIRU (PRECISE MATCH TO USER'S PROVIDED CODE)       */}
      {/* ========================================================= */}
      <header className="bg-blue-600 text-white px-5 py-3.5 shadow-sm flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToAppQu}
            className="h-8 px-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-blue-100 flex items-center gap-1 text-sm font-bold transition-all active:scale-95 cursor-pointer"
            title="Kembali ke AppQu"
          >
            <span>◀ AppQu</span>
          </button>

          <div>
            <h1 className="font-bold text-xl tracking-wide uppercase leading-tight">
              RitelQu
            </h1>
            <p className="text-sm text-blue-100 font-normal" id="device-status">
              ID Perangkat: {deviceId}
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <span
            className="text-sm bg-blue-700/80 px-3 py-1 rounded-full font-medium"
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
        {/* VIEW 1: KASIR & TRANSAKSI (POS QUICK SCAN + SPEECH 🎙️)  */}
        {/* ======================================================= */}
        {activeNav === 'kasir' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Customer & Voice Barcode Strip (Minimalist & Floating Focus) */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-base shrink-0 gap-2">
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pembeli / Warga..."
                  className="w-full text-base bg-transparent font-medium text-slate-800 focus:outline-none truncate"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Search / Scan Input with Autohide focus */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari SKU / nama barang..."
                    className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-base w-36 xs:w-48 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Speech-to-Text Button */}
                <button
                  onClick={handleStartVoiceEntry}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                  title="Smart Entry Suara (Speech-to-Text)"
                  aria-label="Input Suara"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Barcode Manual Direct Scanner Toggle */}
                <button
                  onClick={() => setIsBarcodeScanMode(!isBarcodeScanMode)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isBarcodeScanMode
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Mode Scan SKU / Barcode Cepat"
                >
                  <Barcode className="w-4 h-4" />
                </button>

                {totalItemCount > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-slate-400 hover:text-red-500 font-bold px-1.5 cursor-pointer"
                    title="Reset Keranjang"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Floating Barcode SKU Quick Input Bar (Autohide) */}
            {isBarcodeScanMode && (
              <form
                onSubmit={handleSkuSubmit}
                className="bg-blue-50/70 border-b border-blue-200 px-4 py-2 flex items-center gap-2 animate-in fade-in"
              >
                <Barcode className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={manualSkuInput}
                  onChange={(e) => setManualSkuInput(e.target.value)}
                  placeholder="Ketik / Scan Barcode (misal: 89910012001) lalu tekan Enter..."
                  autoFocus
                  className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700"
                >
                  Tambah
                </button>
              </form>
            )}

            {/* Smart Cross-Selling Strip (RitelQu AI) */}
            {crossSellItems.length > 0 && (
              <div className="bg-amber-50/70 border-b border-amber-200/80 px-4 py-1.5 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar shrink-0">
                <span className="font-bold text-amber-900 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Saran AI:</span>
                </span>
                {crossSellItems.map((cs) => (
                  <button
                    key={cs.product.id}
                    onClick={() => handleAddToCart(cs.product.id, 1)}
                    className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg text-slate-900 font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition shadow-2xs"
                    title={cs.reason}
                  >
                    <span>+ {cs.product.name}</span>
                    <span className="text-blue-600 font-mono">
                      (Rp {cs.product.price.toLocaleString('id-ID')})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-base">
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
                  className={`px-4 py-1.5 rounded-full text-base font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === c.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Area List View Minimalis (Tanpa Kotak-kotak, Garis Pembatas Bawah Tipis, Huruf 16px - 24px) */}
            <section
              className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100"
              id="list-container"
            >
              {filteredProducts.map((prod) => {
                const qty = cart[prod.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddToCart(prod.id)}
                    className={`py-4 flex justify-between items-center cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/40 -mx-5 px-5' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[19px] text-slate-900 uppercase tracking-tight leading-snug">
                          {prod.name}
                        </h3>
                        {isSelected && (
                          <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full font-mono">
                            x{qty}
                          </span>
                        )}
                        {prod.stock <= (prod.minStock || 5) && (
                          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                            Sisa {prod.stock}
                          </span>
                        )}
                      </div>
                      <p className="text-base text-slate-600 mt-1">
                        SKU: {prod.sku} • Stok: {prod.stock} {prod.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="font-black text-xl text-blue-600 font-mono">
                          RP {prod.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Interactive Counter Stepper */}
                      {isSelected ? (
                        <div
                          className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-lg p-1 shadow-2xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleUpdateQty(prod.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-sm font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-base font-bold px-1.5 text-slate-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(prod.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded text-sm font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Area Ringkasan Pembayaran Ringkas */}
            <section className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex justify-between items-center shrink-0">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
                  Total Tagihan {totalItemCount > 0 ? `(${totalItemCount} Item)` : ''}
                </p>
                <p className="font-black text-2xl text-slate-900 font-mono" id="grand-total">
                  RP {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>

              {/* TOMBOL BIRU PROSES BAYAR */}
              <button
                onClick={handleOpenCheckout}
                disabled={grandTotal <= 0}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold text-base uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm transition active:scale-98 cursor-pointer ${
                  grandTotal <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Proses Bayar
              </button>
            </section>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 2: STOK & CRM (📦 SMART INVENTORY & BON WARGA)     */}
        {/* ======================================================= */}
        {activeNav === 'stok' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub Tabs: Inventaris Stok vs Buku CRM Pelanggan & Bon */}
            <div className="border-b border-slate-200 px-5 py-2.5 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStokTab('inventaris')}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                    stokTab === 'inventaris'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Stok & Inventaris ({products.length})
                </button>
                <button
                  onClick={() => setStokTab('crm')}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                    stokTab === 'crm'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pelanggan & Bon Warga ({customers.length})
                </button>
              </div>

              {stokTab === 'inventaris' ? (
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Barang</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Warga</span>
                </button>
              )}
            </div>

            {/* TAB 1: INVENTARIS STOK */}
            {stokTab === 'inventaris' && (
              <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                          {prod.name}
                        </h3>
                        <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold">
                          {prod.category}
                        </span>
                        {prod.stock <= (prod.minStock || 5) && (
                          <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                            Re-Order!
                          </span>
                        )}
                      </div>

                      <p className="text-base text-slate-600">
                        SKU: <span className="font-mono">{prod.sku}</span> · Beli: Rp{' '}
                        {(prod.buyPrice || prod.price * 0.85).toLocaleString('id-ID')} · Jual: Rp{' '}
                        {prod.price.toLocaleString('id-ID')}
                      </p>

                      {prod.expiryDate && (
                        <p className="text-xs text-amber-700 font-medium">
                          Kedaluwarsa (ED): {prod.expiryDate}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs text-slate-400">Jumlah Stok</div>
                        <span className="font-black text-xl text-slate-900 font-mono">
                          {prod.stock} {prod.unit}
                        </span>
                      </div>

                      {/* Quick Stock Opnam (+ / -) */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => handleAdjustStock(prod.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Kurangi Stok Opnam"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAdjustStock(prod.id, 5)}
                          className="px-2 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Tambah 5 Stok Opnam"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: CRM PELANGGAN & BON WARGA */}
            {stokTab === 'crm' && (
              <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100">
                {customers.map((cust) => (
                  <div
                    key={cust.id}
                    className="py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                          {cust.name}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                          {cust.blockNumber}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          {cust.points} Poin
                        </span>
                      </div>

                      <p className="text-base text-slate-600">
                        WA: {cust.phone} {cust.notes ? `· ${cust.notes}` : ''}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs text-slate-400">Total Bon / Hutang</div>
                        <span
                          className={`font-black text-xl font-mono ${
                            cust.totalDebt > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          Rp {cust.totalDebt.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cust.totalDebt > 0 && (
                          <>
                            <button
                              onClick={() => handleSendDebtWa(cust)}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                              title="Kirim Pengingat Bon via WA"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePayDebt(cust.id, cust.totalDebt)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              title="Tandai Bon Lunas"
                            >
                              Lunasi
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 3: RITELQU AI (🤖 ASISTEN PINTAR 100% GRATIS)     */}
        {/* ======================================================= */}
        {activeNav === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Top AI Identity Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-blue-100">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg uppercase tracking-tight">RitelQu AI</h2>
                    <span className="text-[11px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                      100% Gratis
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">
                    Asisten Pintar & Ahli Operasional Toko Ritel AppQu
                  </p>
                </div>
              </div>

              <button
                onClick={handleDraftSupportEmail}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Lapor Kendala ke Support AppQu"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Support AppQu</span>
              </button>
            </div>

            {/* Quick Consultation Chips */}
            <div className="px-5 py-2 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
              {[
                { label: '🔍 Cek Re-Order Stok', prompt: 'Tolong cek barang apa saja yang stoknya kritis dan perlu segera di-reorder.' },
                { label: '💡 Strategi Promo Bundling', prompt: 'Berikan ide paket promosi sembako hemat untuk warga RT 04 minggu ini.' },
                { label: '📋 Rekap Bon Warga', prompt: 'Bagaimana status bon hutang pelanggan dan tips penagihannya?' },
                { label: '🖨️ Troubleshooting Printer', prompt: 'Bagaimana panduan koneksi dan setting printer thermal Bluetooth 58mm?' },
                { label: '🚀 Buat Draf Promo WA', prompt: 'Buatkan draf broadcast WhatsApp promosi belanja hemat untuk warga.' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiPrompt(chip.prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold whitespace-nowrap transition cursor-pointer border border-slate-200"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Conversation Thread */}
            <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs opacity-75 gap-3">
                      <span className="font-bold">
                        {msg.sender === 'user' ? 'Anda' : 'RitelQu AI'}
                      </span>
                      <span>{msg.time}</span>
                    </div>

                    <p className="text-base whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-slate-500 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>RitelQu AI sedang menganalisis data toko...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt()}
                placeholder="Tanyakan analisis stok, promo, atau kendala toko..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSendAiPrompt()}
                disabled={!aiChatInput.trim() || isAiLoading}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl cursor-pointer shadow-xs transition active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 4: LAPORAN & PROMOSI (📊 OMSET & MARKETING)        */}
        {/* ======================================================= */}
        {activeNav === 'laporan' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-tabs: Laporan Penjualan vs Marketing & Promosi */}
            <div className="border-b border-slate-200 px-5 py-2.5 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLaporanTab('omset')}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                    laporanTab === 'omset'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Laporan Omset & Laba
                </button>
                <button
                  onClick={() => setLaporanTab('promosi')}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                    laporanTab === 'promosi'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Marketing & Promosi WA
                </button>
              </div>

              {laporanTab === 'promosi' && (
                <button
                  onClick={handleDownloadKatalog}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download katalog.html</span>
                </button>
              )}
            </div>

            {/* TAB 1: OMSET & LABA */}
            {laporanTab === 'omset' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Summary KPI Strip */}
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 grid grid-cols-3 gap-3 text-base">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Total Omset
                    </p>
                    <p className="font-black text-xl text-blue-600 font-mono mt-0.5">
                      RP {invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Estimasi Laba Bersih
                    </p>
                    <p className="font-black text-xl text-emerald-600 font-mono mt-0.5">
                      RP{' '}
                      {Math.round(
                        invoices.reduce((sum, i) => sum + i.total * 0.15, 0)
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Transaksi
                    </p>
                    <p className="font-black text-xl text-slate-900 font-mono mt-0.5">
                      {invoices.length} Struk
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setPaidInvoice(inv)}
                      className="py-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-500">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                              inv.paymentMethod === 'bon_warga'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {inv.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                          {inv.customerName}
                        </h3>

                        <p className="text-base text-slate-600">
                          {inv.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-xl text-blue-600 font-mono">
                          RP {inv.total.toLocaleString('id-ID')}
                        </span>
                        <div className="text-sm text-slate-400 mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: MARKETING & PROMOSI WA */}
            {laporanTab === 'promosi' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    <span>Broadcast Promosi WhatsApp Warga</span>
                  </div>
                  <p className="text-base text-blue-800 leading-relaxed">
                    Kirimkan daftar promo sembako hemat hari ini langsung ke grup WhatsApp RT 04
                    dengan satu kali klik via wa.me:
                  </p>
                  <button
                    onClick={handleBroadcastPromoWa}
                    className="mt-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Buka WhatsApp & Kirim Promo</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-lg">
                      Generator Berkas Standalone
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                      Offline-First
                    </span>
                  </div>
                  <p className="text-base text-slate-600">
                    Unduh file mandiri yang dapat dibuka langsung di perangkat mana pun tanpa instalasi:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={handleDownloadKatalog}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-left cursor-pointer transition shadow-2xs"
                    >
                      <Download className="w-4 h-4 text-blue-600 mb-1" />
                      <div className="font-bold text-sm text-slate-900">katalog.html</div>
                      <div className="text-xs text-slate-500">Katalog digital interaktif</div>
                    </button>

                    <button
                      onClick={handleDownloadKasir}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-left cursor-pointer transition shadow-2xs"
                    >
                      <ShoppingBag className="w-4 h-4 text-blue-600 mb-1" />
                      <div className="font-bold text-sm text-slate-900">kasir.html</div>
                      <div className="text-xs text-slate-500">Kasir mobile HP kedua</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 5: PENGATURAN & SISTEM (⚙️ CABANG & BACKUP DATA)   */}
        {/* ======================================================= */}
        {activeNav === 'pengaturan' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h2 className="font-bold text-xl uppercase tracking-tight text-slate-900">
              Pengaturan Toko & Manajemen Sistem
            </h2>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block text-base">Nama Toko Ritel</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block text-base">Nomor WhatsApp Toko</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base font-mono"
                />
              </div>

              {/* Thermal Printer Settings */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1.5 text-base">
                <span className="font-bold text-blue-900 block text-lg">
                  Koneksi Printer Struk Thermal:
                </span>
                <p className="text-base text-blue-800">
                  Mendukung printer thermal Bluetooth / USB ukuran 58mm dan 80mm standar ESC/POS.
                </p>
              </div>

              {/* Standalone Replikasi Cabang */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-lg">
                    Replikasi Modul Cabang
                  </span>
                  <button
                    onClick={handleDownloadCabang}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate cabang_modul.html</span>
                  </button>
                </div>
                <p className="text-sm text-slate-500">
                  Hasilkan file modul cabang mandiri untuk membuka kasir cabang di lokasi lain.
                </p>
              </div>

              {/* Data Management: Backup & Restore */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-lg block">
                  Pencadangan & Pemulihan Data
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const json = RitelStorageService.exportBackupJson();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-ritelqu-${Date.now()}.json`;
                      a.click();
                      showNotification('Backup JSON berhasil diunduh!');
                    }}
                    className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      const input = prompt('Tempelkan isi JSON backup untuk me-restore data:');
                      if (input) {
                        const ok = RitelStorageService.restoreBackupJson(input);
                        if (ok) {
                          setProducts(RitelStorageService.getProducts());
                          setInvoices(RitelStorageService.getInvoices());
                          setCustomers(RitelStorageService.getCustomers());
                          showNotification('Data RitelQu berhasil dipulihkan!');
                        } else {
                          showNotification('Format JSON tidak valid.');
                        }
                      }
                    }}
                    className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Data</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Yakin ingin mereset database RitelQu ke setelan awal pabrik?')) {
                        RitelStorageService.resetDatabase();
                        setProducts(RitelStorageService.getProducts());
                        setInvoices(RitelStorageService.getInvoices());
                        setCustomers(RitelStorageService.getCustomers());
                        showNotification('Database RitelQu berhasil di-reset.');
                      }
                    }}
                    className="p-2.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold text-red-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Data</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  RitelStorageService.setStoreName(storeName);
                  RitelStorageService.setStorePhone(storePhone);
                  showNotification('Pengaturan RitelQu berhasil disimpan.');
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* NAVBAR BAWAH (MOBILE FIRST NAVIGATION) - HANYA IKON       */}
      {/* ========================================================= */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex justify-around items-center px-4 z-20 text-slate-600 shadow-xs select-none">
        {/* 1. Kasir ⚡ */}
        <button
          onClick={() => setActiveNav('kasir')}
          title="Kasir & Transaksi"
          aria-label="Kasir"
          className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer relative ${
            activeNav === 'kasir' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeNav === 'kasir'
                ? 'bg-blue-50 text-blue-600 scale-105 shadow-2xs'
                : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">⚡</span>
          </div>
          {activeNav === 'kasir' && (
            <span className="absolute bottom-1 w-2 h-1 rounded-full bg-blue-600"></span>
          )}
        </button>

        {/* 2. Stok 📦 */}
        <button
          onClick={() => setActiveNav('stok')}
          title="Stok & Pelanggan"
          aria-label="Stok"
          className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer relative ${
            activeNav === 'stok' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeNav === 'stok'
                ? 'bg-blue-50 text-blue-600 scale-105 shadow-2xs'
                : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">📦</span>
          </div>
          {activeNav === 'stok' && (
            <span className="absolute bottom-1 w-2 h-1 rounded-full bg-blue-600"></span>
          )}
        </button>

        {/* 3. RitelQu AI 🤖 (100% Gratis) */}
        <button
          onClick={() => setActiveNav('ai')}
          title="RitelQu AI (100% Gratis)"
          aria-label="RitelQu AI"
          className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer relative ${
            activeNav === 'ai' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeNav === 'ai'
                ? 'bg-blue-50 text-blue-600 scale-105 shadow-2xs'
                : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">🤖</span>
          </div>
          {activeNav === 'ai' && (
            <span className="absolute bottom-1 w-2 h-1 rounded-full bg-blue-600"></span>
          )}
        </button>

        {/* 4. Laporan 📊 */}
        <button
          onClick={() => setActiveNav('laporan')}
          title="Laporan & Marketing"
          aria-label="Laporan"
          className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer relative ${
            activeNav === 'laporan' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeNav === 'laporan'
                ? 'bg-blue-50 text-blue-600 scale-105 shadow-2xs'
                : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">📊</span>
          </div>
          {activeNav === 'laporan' && (
            <span className="absolute bottom-1 w-2 h-1 rounded-full bg-blue-600"></span>
          )}
        </button>

        {/* 5. Pengaturan ⚙️ */}
        <button
          onClick={() => setActiveNav('pengaturan')}
          title="Pengaturan Toko"
          aria-label="Pengaturan"
          className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer relative ${
            activeNav === 'pengaturan' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeNav === 'pengaturan'
                ? 'bg-blue-50 text-blue-600 scale-105 shadow-2xs'
                : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl leading-none">⚙️</span>
          </div>
          {activeNav === 'pengaturan' && (
            <span className="absolute bottom-1 w-2 h-1 rounded-full bg-blue-600"></span>
          )}
        </button>
      </nav>

      {/* ========================================================= */}
      {/* MODAL 1: CHECKOUT & PROSES BAYAR                          */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-xl text-slate-900 uppercase tracking-tight">
                Pembayaran Belanja
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-base space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between text-slate-500 items-center">
                <span>Total Belanja:</span>
                <span className="font-black text-blue-600 font-mono text-2xl">
                  RP {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base font-bold text-slate-700 uppercase tracking-wider block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'tunai', label: 'Tunai' },
                  { id: 'qris', label: 'QRIS' },
                  { id: 'transfer', label: 'Transfer' },
                  { id: 'bon_warga', label: 'Bon Warga' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
                  <label className="text-base font-bold text-slate-700 uppercase tracking-wider block">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 font-mono font-bold text-xl"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[grandTotal, 50000, 100000].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashGiven(amt)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold rounded-lg text-slate-700 cursor-pointer"
                    >
                      {amt === grandTotal ? 'Pas' : `Rp ${amt.toLocaleString('id-ID')}`}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between text-base pt-1 text-slate-500">
                  <span>Kembalian:</span>
                  <span className="font-mono font-black text-slate-900 text-lg">
                    RP {Math.max(0, cashGiven - grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'bon_warga' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Tagihan sebesar <strong>Rp {grandTotal.toLocaleString('id-ID')}</strong> akan
                tercatat otomatis ke buku bon piutang warga: <strong>{customerName}</strong>.
              </div>
            )}

            <div>
              <label className="text-base font-bold text-slate-700 uppercase tracking-wider block">
                Catatan Transaksi
              </label>
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Catatan belanja / pesanan..."
                rows={2}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-sm active:scale-98 cursor-pointer"
            >
              Konfirmasi & Selesai
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KWITANSI RESMI BELANJA RITELQU LUNAS             */}
      {/* ========================================================= */}
      {paidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                {storeName}
              </span>
              <h3 className="font-black text-xl text-slate-900 mt-1">Struk Pembayaran</h3>
              <p className="text-sm font-mono text-slate-400 mt-0.5">{paidInvoice.invoiceNumber}</p>
            </div>

            <div className="text-base space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Pembeli:</span>
                <span className="font-bold text-slate-900">{paidInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase font-semibold">{paidInvoice.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 py-3 space-y-2">
              {paidInvoice.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-base">
                  <span className="text-slate-800">
                    {it.name} (x{it.qty})
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    RP {(it.price * it.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Tagihan:</span>
              <span className="text-2xl font-black font-mono text-blue-600">
                RP {paidInvoice.total.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  showNotification('Mencetak struk kasir thermal...');
                }}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-base flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>
              <button
                onClick={() => setPaidInvoice(null)}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: INPUT BARANG BARU                                */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-xl text-slate-900 uppercase tracking-tight">
                Tambah Barang Baru
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-base">
              <div>
                <label className="font-bold text-slate-700 block">Nama Produk</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Contoh: Terigu Segitiga Biru 1KG"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block">Kategori</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
                  >
                    <option value="sembako">Sembako</option>
                    <option value="makanan">Makanan & Snack</option>
                    <option value="minuman">Minuman</option>
                    <option value="kebersihan">Kebersihan</option>
                    <option value="bumbu">Bumbu Dapur</option>
                    <option value="rokok_korek">Rokok & Korek</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Satuan Unit</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    placeholder="Pcs / Kg / Dus"
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    value={newProdBuyPrice}
                    onChange={(e) => setNewProdBuyPrice(Number(e.target.value))}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 font-mono text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Harga Jual</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 font-mono text-base font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block">Stok Awal</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 font-mono text-base font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Kedaluwarsa (ED)</label>
                  <input
                    type="date"
                    value={newProdExpiry}
                    onChange={(e) => setNewProdExpiry(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
              >
                Simpan ke Stok
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: INPUT PELANGGAN BARU (CRM)                       */}
      {/* ========================================================= */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-xl text-slate-900 uppercase tracking-tight">
                Tambah Warga / Member
              </h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-base">
              <div>
                <label className="font-bold text-slate-700 block">Nama Warga / Pelanggan</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Contoh: Ibu Ani"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 font-mono text-base"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Blok Rumah</label>
                <input
                  type="text"
                  value={newCustBlock}
                  onChange={(e) => setNewCustBlock(e.target.value)}
                  placeholder="Blok C2 No. 08"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-base"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
              >
                Daftarkan Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: SMART SPEECH-TO-TEXT ASSISTANT MODAL             */}
      {/* ========================================================= */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-xl text-slate-900">Input Suara RitelQu AI</h3>
              </div>
              <button
                onClick={() => setIsVoiceModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Ketik atau sebutkan nama barang dan jumlahnya. RitelQu AI akan mencocokkan stok barang
              secara presisi:
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={voiceQueryText}
                onChange={(e) => setVoiceQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processVoiceMatch(voiceQueryText)}
                placeholder="Contoh: Minyak goreng dua pouch..."
                autoFocus
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-base focus:outline-none focus:border-blue-500 font-medium"
              />

              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                Contoh Cepat:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Minyak goreng 2 pouch',
                  'Beras 1 sak',
                  'Gula pasir 2 pcs',
                  'Kopi 1 renteng',
                  'Telur 1 kg',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => processVoiceMatch(sample)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-100"
                  >
                    + "{sample}"
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => processVoiceMatch(voiceQueryText)}
              disabled={!voiceQueryText.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base rounded-xl cursor-pointer"
            >
              Cocokkan & Masukkan Keranjang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
