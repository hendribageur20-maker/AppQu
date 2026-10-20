import React, { useState, useRef } from 'react';
import {
  Store,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Star,
  Phone,
  Plus,
  X,
  Wrench,
  Activity,
  CheckCircle,
  ExternalLink,
  Tag,
  PackageCheck,
  Percent,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LocalBusiness, UserProfile, LocalProduct } from '../../types';

interface UsahaQuViewProps {
  currentUser: UserProfile;
  businesses: LocalBusiness[];
  onSwitchToBaksoQu: () => void;
  onSwitchToBengkelQu: () => void;
  onSwitchToKlinikQu: () => void;
  onSwitchToRitelQu: () => void;
  onUpdateBusinesses: (businesses: LocalBusiness[]) => void;
  showNotification: (msg: string) => void;
}

export const UsahaQuView: React.FC<UsahaQuViewProps> = ({
  currentUser,
  businesses,
  onSwitchToBaksoQu,
  onSwitchToBengkelQu,
  onSwitchToKlinikQu,
  onSwitchToRitelQu,
  onUpdateBusinesses,
  showNotification,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<LocalBusiness | null>(null);
  const [isRegisterBizOpen, setIsRegisterBizOpen] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const cardsScrollRef = useRef<HTMLDivElement>(null);

  const scrollToCard = (index: number) => {
    setActiveCardIdx(index);
    if (cardsScrollRef.current) {
      const container = cardsScrollRef.current;
      const cards = container.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  };

  const handleScrollPrev = () => {
    if (cardsScrollRef.current) {
      cardsScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (cardsScrollRef.current) {
      cardsScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // New Business Form State
  const [newBizName, setNewBizName] = useState('');
  const [newBizCat, setNewBizCat] = useState<LocalBusiness['category']>('kuliner');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizDesc, setNewBizDesc] = useState('');

  const filteredBusinesses = businesses.filter((b) => {
    if (activeCategory === 'all') return true;
    return b.category === activeCategory;
  });

  const handleRegisterBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const newBiz: LocalBusiness = {
      id: `biz-${Date.now()}`,
      name: newBizName,
      category: newBizCat,
      ownerName: currentUser.name,
      blockNumber: currentUser.blockNumber,
      phone: newBizPhone || currentUser.phone,
      description: newBizDesc || 'Lapak ekonomi warga terdaftar di UsahaQu RT 04.',
      rating: 5.0,
      badge: 'Lapak Baru Warga',
      products: [
        {
          id: `p-${Date.now()}-1`,
          name: 'Produk / Jasa Unggulan',
          price: 15000,
          unit: 'item',
          description: 'Layanan / produk lokal berkualitas',
        },
      ],
    };

    onUpdateBusinesses([newBiz, ...businesses]);
    setIsRegisterBizOpen(false);
    setNewBizName('');
    setNewBizDesc('');
    showNotification('Usaha warga baru berhasil terdaftar di UsahaQu!');
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-y-auto">
      {/* ========================================================= */}
      {/* QUAD MASTER SWITCH CARDS: BAKSOQU, BENGKELQU, KLINIKQU, RITELQU */}
      {/* ========================================================= */}
      <div className="p-3 bg-white border-b border-stone-200 shadow-2xs shrink-0 space-y-2">
        {/* Switch Master Header with Title, Status & Navigation Arrows */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-700 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Switch Master Unit Usaha</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-stone-400 font-medium hidden xs:inline">
              4 Sistem
            </span>
            {/* Scroll Navigation Buttons for easy left/right navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleScrollPrev}
                className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-600 flex items-center justify-center transition-all border border-stone-200"
                title="Geser ke kiri"
                aria-label="Geser ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleScrollNext}
                className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-600 flex items-center justify-center transition-all border border-stone-200"
                title="Geser ke kanan"
                aria-label="Geser ke kanan"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Jump Unit Usaha Pills (Instant Switch/Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {[
            { label: 'BaksoQu', sub: 'POS Kuliner', color: 'bg-amber-100 text-amber-900 border-amber-300' },
            { label: 'BengkelQu', sub: 'Motor', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
            { label: 'KlinikQu', sub: 'Medis', color: 'bg-teal-100 text-teal-900 border-teal-300' },
            { label: 'RitelQu', sub: 'Kelontong', color: 'bg-blue-100 text-blue-900 border-blue-300' },
          ].map((tab, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCard(idx)}
              className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activeCardIdx === idx
                  ? `${tab.color} ring-1 ring-stone-400 font-extrabold shadow-2xs`
                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className="opacity-70 font-normal">({tab.sub})</span>
            </button>
          ))}
          <span className="text-[10px] text-stone-400 font-normal ml-auto shrink-0 flex items-center gap-0.5">
            <span>Geser</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Horizontally and Vertically Responsive Scrollable Cards Container */}
        <div
          ref={cardsScrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollWidth > el.clientWidth) {
              const cardWidth = el.scrollWidth / 4;
              const index = Math.round(el.scrollLeft / cardWidth);
              setActiveCardIdx(Math.min(3, Math.max(0, index)));
            }
          }}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar snap-x snap-mandatory scroll-smooth touch-pan-x"
        >
          {/* Card 1: BaksoQu 1.0 POS Kasir */}
          <div className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-amber-600 via-amber-700 to-red-800 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-red-950/60 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                  POS Kuliner
                </span>
                <span className="text-[10px] text-amber-200 font-medium">H. Sutisna (Blok C1)</span>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Bakso Qu 1.0</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-stone-900">
                    POS
                  </span>
                </h3>
                <p className="text-[11px] text-amber-100 mt-0.5 line-clamp-2">
                  Denah meja interaktif, transaksi kasir, cetak Thermal Bluetooth 58/80mm, stok bahan & omset.
                </p>
              </div>
            </div>

            <button
              onClick={onSwitchToBaksoQu}
              className="mt-3 w-full py-2 bg-white hover:bg-amber-50 text-stone-900 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>Buka POS BaksoQu</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
            </button>
          </div>

          {/* Card 2: BengkelQu (Asisten Pintar & Bengkel Motor) */}
          <div className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden flex flex-col justify-between border border-emerald-700/60">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                  100% Gratis
                </span>
                <span className="text-[10px] text-emerald-200 font-medium">Mas Yanto (Blok D1)</span>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-300" />
                  <span>BengkelQu</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                    Asisten Pintar
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 mt-0.5 line-clamp-2">
                  Smart Estimator KM, ceklis fisik, stok re-order point, WA generator, katalog.html, & AI Care.
                </p>
              </div>
            </div>

            <button
              onClick={onSwitchToBengkelQu}
              className="mt-3 w-full py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-stone-950" />
              <span>Buka BengkelQu</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
            </button>
          </div>

          {/* Card 3: KlinikQu (Kasir & Layanan Medis Faskes) */}
          <div className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden flex flex-col justify-between border border-emerald-500/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
                  Faskes Medis Warga
                </span>
                <span className="text-[10px] text-emerald-200 font-medium">dr. Farhan Malik (Blok B2)</span>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-300" />
                  <span>KlinikQu</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-emerald-950">
                    Kasir & Medis
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 mt-0.5 line-clamp-2">
                  Pemeriksaan dokter umum, tindakan injeksi, infus, laboratorium cepat, rekam medis warga, & kasir minimalis.
                </p>
              </div>
            </div>

            <button
              onClick={onSwitchToKlinikQu}
              className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-white" />
              <span>Buka KlinikQu</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Card 4: RitelQu (Kasir & Toko Kelontong Warga) */}
          <div className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-950 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden flex flex-col justify-between border border-blue-400/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-blue-950/80 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                  Toko Kelontong
                </span>
                <span className="text-[10px] text-blue-100 font-medium">Bu RT (Blok A1)</span>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-200" />
                  <span>RitelQu</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-blue-950">
                    Kasir & Stok
                  </span>
                </h3>
                <p className="text-[11px] text-blue-100/90 mt-0.5 line-clamp-2">
                  Minyak goreng, beras premium, gas elpiji, air galon, SKU barcode, manajemen inventaris, & kasir cepat.
                </p>
              </div>
            </div>

            <button
              onClick={onSwitchToRitelQu}
              className="mt-3 w-full py-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Buka RitelQu</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Dots Scroll Indicator on Mobile */}
        <div className="flex items-center justify-center gap-1.5 sm:hidden pt-0.5">
          {[0, 1, 2, 3].map((dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToCard(dotIdx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeCardIdx === dotIdx ? 'w-5 bg-emerald-600' : 'w-1.5 bg-stone-300'
              }`}
              aria-label={`Lihat unit ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Categories and Actions */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Semua Lapak' },
            { id: 'kesehatan', label: 'Kesehatan & Klinik' },
            { id: 'otomotif', label: 'Otomotif & Bengkel' },
            { id: 'kuliner', label: 'Kuliner' },
            { id: 'sembako', label: 'Sembako' },
            { id: 'laundry', label: 'Laundry' },
            { id: 'jasa', label: 'Jasa & Servis' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsRegisterBizOpen(true)}
          className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Daftar Usaha</span>
        </button>
      </div>

      {/* Directory of Local Businesses */}
      <div className="p-3 space-y-3 pb-12">
        <div className="flex items-center justify-between px-1 text-xs text-stone-500 font-medium">
          <span>Lapak UMKM Warga ({filteredBusinesses.length} Usaha Terverifikasi)</span>
          <span>Ekonomi Lokal Mandiri RT 04</span>
        </div>

        {filteredBusinesses.map((biz) => {
          const isBaksoQu = biz.posModuleKey === 'baksoqu';
          const isBengkelQu = biz.posModuleKey === 'bengkelqu';
          const isKlinikQu = biz.posModuleKey === 'klinikqu';
          const isRitelQu = biz.posModuleKey === 'ritelqu';

          return (
            <div
              key={biz.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                isBaksoQu
                  ? 'border-amber-300 ring-1 ring-amber-300/40'
                  : isBengkelQu
                  ? 'border-emerald-400 ring-1 ring-emerald-300/50'
                  : isKlinikQu
                  ? 'border-teal-400 ring-1 ring-teal-300/50'
                  : isRitelQu
                  ? 'border-blue-400 ring-1 ring-blue-300/50'
                  : 'border-stone-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isBaksoQu
                        ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow'
                        : isBengkelQu
                        ? 'bg-emerald-800 text-amber-300 shadow'
                        : isKlinikQu
                        ? 'bg-emerald-600 text-white shadow'
                        : isRitelQu
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isBaksoQu ? (
                      'BQ'
                    ) : isBengkelQu ? (
                      <Wrench className="w-6 h-6" />
                    ) : isKlinikQu ? (
                      <Activity className="w-6 h-6" />
                    ) : isRitelQu ? (
                      <ShoppingBag className="w-6 h-6" />
                    ) : (
                      biz.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-stone-900 leading-snug">{biz.name}</h3>
                      {biz.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isBengkelQu
                            ? 'bg-emerald-100 text-emerald-800'
                            : isKlinikQu
                            ? 'bg-teal-100 text-teal-800'
                            : isRitelQu
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {biz.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {biz.ownerName} · {biz.blockNumber}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-bold text-amber-900">{biz.rating}</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{biz.description}</p>

              {/* Sample Products */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                  Menu / Layanan Pilihan
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {biz.products.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-stone-50 border border-stone-200/60 text-xs flex justify-between items-center"
                    >
                      <span className="text-[11px] font-medium text-stone-800 truncate mr-1">
                        {p.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 shrink-0">
                        Rp {p.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <a
                  href={`tel:${biz.phone}`}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Hubungi ({biz.phone})</span>
                </a>

                {isBaksoQu ? (
                  <button
                    onClick={onSwitchToBaksoQu}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Masuk Kasir POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : isBengkelQu ? (
                  <button
                    onClick={onSwitchToBengkelQu}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-300" />
                    <span>Buka BengkelQu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : isKlinikQu ? (
                  <button
                    onClick={onSwitchToKlinikQu}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-white" />
                    <span>Buka KlinikQu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : isRitelQu ? (
                  <button
                    onClick={onSwitchToRitelQu}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    <span>Buka RitelQu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      showNotification(`Pemesanan langsung terhubung ke WhatsApp ${biz.ownerName}.`)
                    }
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pesan Produk</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: DAFTAR USAHA WARGA BARU */}
      {/* ---------------------------------------------------- */}
      {isRegisterBizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-md p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-stone-900">
                Pendaftaran Lapak Ekonomi UsahaQu
              </h3>
              <button
                onClick={() => setIsRegisterBizOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterBusiness} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-stone-700">Nama Usaha / Toko</label>
                <input
                  type="text"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="Contoh: Kue Basah Bu Anisa..."
                  className="w-full mt-1 p-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700">Kategori</label>
                  <select
                    value={newBizCat}
                    onChange={(e) => setNewBizCat(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl border border-stone-300"
                  >
                    <option value="otomotif">Otomotif & Bengkel</option>
                    <option value="kuliner">Kuliner & Makanan</option>
                    <option value="sembako">Sembako & Kebutuhan</option>
                    <option value="laundry">Laundry & Pakaian</option>
                    <option value="jasa">Jasa & Servis</option>
                    <option value="kerajinan">Kerajinan Tangan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full mt-1 p-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Deskripsi & Produk</label>
                <textarea
                  value={newBizDesc}
                  onChange={(e) => setNewBizDesc(e.target.value)}
                  rows={2}
                  placeholder="Jelaskan produk atau jasa yang ditawarkan kepada tetangga..."
                  className="w-full mt-1 p-2 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
              >
                Daftarkan ke UsahaQu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
