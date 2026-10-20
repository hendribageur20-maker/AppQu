import React, { useState } from 'react';
import {
  Store,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Star,
  Phone,
  Plus,
  X,
  CheckCircle,
  ExternalLink,
  Tag,
  PackageCheck,
  Percent,
} from 'lucide-react';
import { LocalBusiness, UserProfile, LocalProduct } from '../../types';

interface UsahaQuViewProps {
  currentUser: UserProfile;
  businesses: LocalBusiness[];
  onSwitchToBaksoQu: () => void;
  onUpdateBusinesses: (businesses: LocalBusiness[]) => void;
  showNotification: (msg: string) => void;
}

export const UsahaQuView: React.FC<UsahaQuViewProps> = ({
  currentUser,
  businesses,
  onSwitchToBaksoQu,
  onUpdateBusinesses,
  showNotification,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<LocalBusiness | null>(null);
  const [isRegisterBizOpen, setIsRegisterBizOpen] = useState(false);

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
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* ========================================================= */}
      {/* MASTER SWITCH CARD: BAKSO QU 1.0 POS KASIR */}
      {/* ========================================================= */}
      <div className="p-3 bg-white border-b border-stone-200 shadow-2xs shrink-0">
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-red-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Switch Master UsahaQu</span>
            </div>
            <span className="text-[9px] bg-red-950/60 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
              POS Aktif
            </span>
          </div>

          <div className="mt-2.5">
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Bakso Qu 1.0</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-stone-900 font-sans">
                v1.0
              </span>
            </h2>
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">
              Unit usaha kuliner unggulan warga RT 04. Sistem POS Kasir terintegrasi: denah meja,
              transaksi bungkus, cetak Bluetooth Thermal 58/80mm, stok bahan, omset, & laporan.
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-amber-500/40 flex items-center justify-between">
            <div className="text-[11px] text-amber-100">
              <span className="font-semibold text-white">Owner:</span> H. Sutisna (Blok C1)
            </div>

            <button
              onClick={onSwitchToBaksoQu}
              className="px-4 py-2 bg-white hover:bg-amber-50 text-stone-900 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <span>Buka POS BaksoQu</span>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories and Actions */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Semua Lapak' },
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-stone-500 font-medium">
          <span>Lapak UMKM Warga ({filteredBusinesses.length} Usaha Terverifikasi)</span>
          <span>Ekonomi Lokal Mandiri</span>
        </div>

        {filteredBusinesses.map((biz) => {
          const isBaksoQu = biz.posModuleKey === 'baksoqu';

          return (
            <div
              key={biz.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                isBaksoQu ? 'border-amber-300 ring-1 ring-amber-300/40' : 'border-stone-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isBaksoQu
                        ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isBaksoQu ? 'BQ' : biz.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-stone-900 leading-snug">{biz.name}</h3>
                      {biz.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
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
                  Menu / Produk Pilihan
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
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Masuk Kasir POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      showNotification(`Pemesanan langsung terhubung ke WhatsApp ${biz.ownerName}.`)
                    }
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
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
