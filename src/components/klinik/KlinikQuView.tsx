import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  X,
  User,
  Printer,
  ChevronRight,
  ShieldCheck,
  Phone,
  FileText,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

import {
  KlinikServiceItem,
  KlinikPatientRecord,
  KlinikInvoice,
  KlinikBillItem,
  UserProfile,
} from '../../types';
import {
  KlinikStorageService,
  DEFAULT_KLINIK_SERVICES,
  DEFAULT_KLINIK_PATIENTS,
} from '../../services/storageKlinik';

interface KlinikQuViewProps {
  currentUser: UserProfile;
  onBackToAppQu: () => void;
  showNotification: (msg: string) => void;
}

export const KlinikQuView: React.FC<KlinikQuViewProps> = ({
  currentUser,
  onBackToAppQu,
  showNotification,
}) => {
  // Navigation: Kasir (⚡), Pasien (📋), Laporan (📊), Pengaturan (⚙️)
  const [activeNav, setActiveNav] = useState<'kasir' | 'pasien' | 'laporan' | 'pengaturan'>('kasir');

  // Core Data
  const [services, setServices] = useState<KlinikServiceItem[]>([]);
  const [patients, setPatients] = useState<KlinikPatientRecord[]>([]);
  const [invoices, setInvoices] = useState<KlinikInvoice[]>([]);
  const [deviceId, setDeviceId] = useState<string>('KLINIK-DEV01');

  // Kasir Active Cart / Bill State (Default 2 tindakan as in user HTML prototype: Pemeriksaan + Injeksi)
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({
    'srv-1': 1,
    'srv-2': 1,
  });
  const [selectedPatient, setSelectedPatient] = useState<KlinikPatientRecord | null>(null);
  const [guestPatientName, setGuestPatientName] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('dr. Farhan Malik, Sp.PD');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'bpjs_subsidi'>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Receipt Modal State
  const [paidInvoice, setPaidInvoice] = useState<KlinikInvoice | null>(null);

  // New Patient Modal
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientNik, setNewPatientNik] = useState('');
  const [newPatientBlock, setNewPatientBlock] = useState('Blok C3');
  const [newPatientAge, setNewPatientAge] = useState<number>(30);
  const [newPatientGender, setNewPatientGender] = useState<'L' | 'P'>('L');
  const [newPatientAllergy, setNewPatientAllergy] = useState('');

  // Initial Load
  useEffect(() => {
    setServices(KlinikStorageService.getServices());
    setPatients(KlinikStorageService.getPatients());
    setInvoices(KlinikStorageService.getInvoices());
    setDeviceId(KlinikStorageService.getDeviceId());
    // Default patient to current user if matches
    const foundUserPatient = KlinikStorageService.getPatients().find(
      (p) => p.name.toLowerCase() === currentUser.name.toLowerCase() || p.nik === currentUser.nik
    );
    if (foundUserPatient) {
      setSelectedPatient(foundUserPatient);
    } else if (KlinikStorageService.getPatients().length > 0) {
      setSelectedPatient(KlinikStorageService.getPatients()[0]);
    }
  }, [currentUser]);

  // Total Calculation
  const grandTotal = Object.entries(selectedServices).reduce((sum, [serviceId, qty]) => {
    const srv = services.find((s) => s.id === serviceId);
    return sum + (srv ? srv.price * qty : 0);
  }, 0);

  // ----------------------------------------------------
  // CART / SERVICE ACTIONS
  // ----------------------------------------------------
  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      } else {
        return { ...prev, [serviceId]: 1 };
      }
    });
  };

  const handleUpdateQty = (serviceId: string, delta: number) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const handleClearCart = () => {
    setSelectedServices({});
  };

  // ----------------------------------------------------
  // CHECKOUT & PAYMENT FLOW
  // ----------------------------------------------------
  const handleOpenCheckout = () => {
    if (grandTotal <= 0) {
      showNotification('Pilih minimal 1 layanan atau tindakan medis.');
      return;
    }
    setCashGiven(grandTotal);
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = () => {
    const items: KlinikBillItem[] = Object.entries(selectedServices).map(([serviceId, qty]) => {
      const srv = services.find((s) => s.id === serviceId)!;
      return {
        id: `bi-${Date.now()}-${Math.random()}`,
        serviceId: srv.id,
        name: srv.name,
        price: srv.price,
        qty,
      };
    });

    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = invoices.length + 1;
    const invoiceNum = `INV-MED-${dateStr}-${String(count).padStart(2, '0')}`;

    const newInvoice: KlinikInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      patientName: selectedPatient ? selectedPatient.name : guestPatientName || 'Pasien Umum',
      patientNik: selectedPatient?.nik,
      patientBlock: selectedPatient?.blockNumber || 'Warga RT 04',
      doctorName,
      items,
      total: grandTotal,
      paymentMethod,
      status: 'lunas',
      createdAt: date.toISOString(),
      notes: checkoutNotes,
    };

    KlinikStorageService.addInvoice(newInvoice);
    setInvoices([newInvoice, ...invoices]);
    setSelectedServices({});
    setIsCheckoutOpen(false);
    setPaidInvoice(newInvoice);
    showNotification(`Pembayaran ${invoiceNum} Lunas! Kwitansi medis diterbitkan.`);
  };

  // ----------------------------------------------------
  // PATIENT HANDLERS
  // ----------------------------------------------------
  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newPat: KlinikPatientRecord = {
      id: `pat-${Date.now()}`,
      name: newPatientName,
      nik: newPatientNik || '3201000000000000',
      blockNumber: newPatientBlock,
      gender: newPatientGender,
      age: newPatientAge,
      phone: '0812-0000-0000',
      bloodType: 'O',
      allergies: newPatientAllergy || 'Tidak ada catatan alergi',
      lastVisit: new Date().toISOString().slice(0, 10),
      totalVisits: 1,
    };

    const updated = [newPat, ...patients];
    setPatients(updated);
    KlinikStorageService.savePatients(updated);
    setSelectedPatient(newPat);
    setIsAddPatientOpen(false);
    setNewPatientName('');
    showNotification(`Pasien ${newPat.name} berhasil didaftarkan ke rekam medis.`);
  };

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="bg-white text-slate-800 antialiased h-full flex flex-col overflow-hidden relative select-none">
      {/* ========================================================= */}
      {/* HEADER HIJAU (PRECISE MATCH TO USER'S PROVIDED CODE)     */}
      {/* ========================================================= */}
      <header className="bg-emerald-600 text-white px-5 py-3.5 shadow-sm flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToAppQu}
            className="h-7 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-emerald-100 flex items-center gap-1 text-[11px] font-bold transition-all active:scale-95"
            title="Kembali ke AppQu"
          >
            <span>◀ AppQu</span>
          </button>

          <div>
            <h1 className="font-bold text-base tracking-wide uppercase leading-tight">
              KlinikQu
            </h1>
            <p className="text-[11px] text-emerald-100 font-normal" id="device-status">
              ID Perangkat: {deviceId}
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <span
            className="text-[11px] bg-emerald-700/80 px-2.5 py-1 rounded-full font-medium"
            id="cabang-label"
          >
            Cabang Utama
          </span>
        </div>
      </header>

      {/* ========================================================= */}
      {/* KONTEN UTAMA DENGAN BOTTOM NAVIGATION PRESERVED           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 bg-white">
        {/* ======================================================= */}
        {/* VIEW 1: KASIR (AREA LIST VIEW MINIMALIS)                */}
        {/* ======================================================= */}
        {activeNav === 'kasir' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Patient & Doctor Strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5 truncate mr-2">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-500">Pasien:</span>
                <span className="font-bold text-slate-900 truncate">
                  {selectedPatient ? selectedPatient.name : 'Pasien Umum'}
                </span>
                {selectedPatient && (
                  <span className="text-[10px] text-slate-400">
                    ({selectedPatient.blockNumber})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveNav('pasien')}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Ganti Pasien
                </button>
                {Object.keys(selectedServices).length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[10px] text-slate-400 hover:text-red-500 ml-1"
                    title="Reset Pilihan"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
              {[
                { id: 'all', label: 'Semua Layanan' },
                { id: 'konsultasi', label: 'Konsultasi' },
                { id: 'tindakan', label: 'Tindakan' },
                { id: 'laboratorium', label: 'Laboratorium' },
                { id: 'obat', label: 'Resep Obat' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === c.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Area List View Minimalis (Tanpa Kotak-kotak, Huruf Besar Tegas Jelas, divide-y divide-slate-100) */}
            <section
              className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100"
              id="list-container"
            >
              {filteredServices.map((srv) => {
                const qty = selectedServices[srv.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={srv.id}
                    onClick={() => handleToggleService(srv.id)}
                    className={`py-3.5 flex justify-between items-center cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/40 -mx-5 px-5' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="pr-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                          {srv.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Dipilih (x{qty})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {srv.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="font-bold text-sm text-emerald-600 font-mono">
                          RP {srv.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Optional Counter Controls when selected */}
                      {isSelected ? (
                        <div
                          className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg p-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleUpdateQty(srv.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold px-1 text-slate-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(srv.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-300">
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
                  Total Tagihan ({Object.values(selectedServices).reduce((a, b) => a + b, 0)} Tindakan)
                </p>
                <p className="font-bold text-base text-slate-900 font-mono" id="grand-total">
                  RP {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>

              {/* TOMBOL HIJAU */}
              <button
                onClick={handleOpenCheckout}
                disabled={grandTotal <= 0}
                className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm transition active:scale-98 ${
                  grandTotal <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Proses Bayar
              </button>
            </section>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 2: REKAM MEDIS & PASIEN (📋)                      */}
        {/* ======================================================= */}
        {activeNav === 'pasien' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm uppercase text-slate-900 tracking-tight">
                  Buku Rekam Medis Pasien Warga
                </h2>
                <p className="text-xs text-slate-500">
                  Terintegrasi dengan NIK & Buku Induk WargaQu RT 04
                </p>
              </div>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pasien Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100">
              {patients.map((pat) => (
                <div
                  key={pat.id}
                  className="py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                        {pat.name}
                      </h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium">
                        {pat.gender} · {pat.age} Th
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                        Gol. Darah: {pat.bloodType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {pat.blockNumber} · NIK: <span className="font-mono">{pat.nik}</span>
                    </p>

                    {pat.allergies && (
                      <p className="text-[11px] text-amber-700 italic">
                        Catatan Alergi: {pat.allergies}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(pat);
                        setActiveNav('kasir');
                        showNotification(`Pasien ${pat.name} dipilih untuk tindakan.`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                    >
                      Pilih ke Kasir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 3: LAPORAN TRANSAKSI MEDIS (📊)                   */}
        {/* ======================================================= */}
        {activeNav === 'laporan' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Summary KPI Strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Total Pendapatan Medis
                </p>
                <p className="font-bold text-base text-emerald-600 font-mono">
                  RP {invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  Pasien Terlayani
                </p>
                <p className="font-bold text-base text-slate-900 font-mono">
                  {invoices.length} Kunjungan
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
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">
                        {inv.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                      {inv.patientName} ({inv.patientBlock})
                    </h3>

                    <p className="text-xs text-slate-500">
                      {inv.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-600 font-mono">
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
        {/* VIEW 4: PENGATURAN KLINIK (⚙️)                         */}
        {/* ======================================================= */}
        {activeNav === 'pengaturan' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold text-sm uppercase text-slate-900 tracking-tight">
                Pengaturan Faskes KlinikQu
              </h2>
              <p className="text-xs text-slate-500">
                Konfigurasi pos layanan medis & nomor izin operasional
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
                <label className="font-bold text-slate-700 block">Dokter Penanggung Jawab Jaga</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Nama Cabang / Unit</label>
                <input
                  type="text"
                  defaultValue="Klinik Pratama AppQu RT 04 Graha Kencana"
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-xs">
                <span className="font-bold text-emerald-900 block">Integrasi Printer Thermal:</span>
                <p className="text-[11px] text-emerald-800">
                  Printer Thermal Bluetooth 58mm/80mm siap mencetak nota kuitansi medis dan resep obat
                  dengan format standar ESC/POS.
                </p>
              </div>

              <button
                onClick={() => showNotification('Pengaturan KlinikQu berhasil disimpan.')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
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
            activeNav === 'kasir' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'
          }`}
        >
          <span className="text-lg mb-0.5">⚡</span>
          <span>Kasir</span>
        </button>

        <button
          onClick={() => setActiveNav('pasien')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'pasien' ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-emerald-600'
          }`}
        >
          <span className="text-lg mb-0.5">📋</span>
          <span>Pasien</span>
        </button>

        <button
          onClick={() => setActiveNav('laporan')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'laporan' ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-emerald-600'
          }`}
        >
          <span className="text-lg mb-0.5">📊</span>
          <span>Laporan</span>
        </button>

        <button
          onClick={() => setActiveNav('pengaturan')}
          className={`flex flex-col items-center justify-center flex-1 h-full font-medium text-[10px] uppercase tracking-wider transition ${
            activeNav === 'pengaturan' ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-emerald-600'
          }`}
        >
          <span className="text-lg mb-0.5">⚙️</span>
          <span>Pengaturan</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* MODAL 1: PROSES BAYAR TAGIHAN MEDIS                       */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Pembayaran Tagihan Medis
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
                <span>Nama Pasien:</span>
                <span className="font-bold text-slate-900">
                  {selectedPatient ? selectedPatient.name : 'Pasien Umum'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Tagihan:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
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
                  { id: 'bpjs_subsidi', label: 'Subsidi' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'tunai' && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-sm"
                />
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                  <span>Kembalian:</span>
                  <span className="font-mono font-bold text-slate-900">
                    RP {Math.max(0, cashGiven - grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Catatan Diagnosa / Obat
              </label>
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Contoh: Obat diminum 3x sehari sesudah makan..."
                rows={2}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-98"
            >
              Konfirmasi & Cetak Kwitansi
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KWITANSI RESMI MEDIS LUNAS                       */}
      {/* ========================================================= */}
      {paidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                KlinikQu — Layanan Medis Warga
              </span>
              <h3 className="font-bold text-base text-slate-900 mt-0.5">
                Kwitansi Medis Lunas
              </h3>
              <p className="text-[11px] font-mono text-slate-400">{paidInvoice.invoiceNumber}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Pasien:</span>
                <span className="font-bold text-slate-900">{paidInvoice.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Dokter:</span>
                <span>{paidInvoice.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase font-semibold">{paidInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* List Item Nota */}
            <div className="border-t border-b border-slate-100 py-2 divide-y divide-slate-100 text-xs">
              {paidInvoice.items.map((it) => (
                <div key={it.id} className="py-1.5 flex justify-between">
                  <span>
                    {it.name} <span className="text-slate-400">x{it.qty}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    RP {(it.price * it.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-bold">
              <span className="uppercase tracking-tight text-slate-700">Total Bayar:</span>
              <span className="font-mono text-emerald-600 text-base">
                RP {paidInvoice.total.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  showNotification('Struk medis dikirim ke printer thermal.');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
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
      {/* MODAL 3: REGISTRASI PASIEN BARU                           */}
      {/* ========================================================= */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Daftar Pasien Baru
              </h3>
              <button
                onClick={() => setIsAddPatientOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Pasien</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Nama sesuai KTP..."
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">NIK</label>
                  <input
                    type="text"
                    value={newPatientNik}
                    onChange={(e) => setNewPatientNik(e.target.value)}
                    placeholder="3201..."
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Blok Rumah</label>
                  <input
                    type="text"
                    value={newPatientBlock}
                    onChange={(e) => setNewPatientBlock(e.target.value)}
                    placeholder="Blok C2 No. 04"
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Riwayat Alergi Obat</label>
                <input
                  type="text"
                  value={newPatientAllergy}
                  onChange={(e) => setNewPatientAllergy(e.target.value)}
                  placeholder="Contoh: Alergi penisilin..."
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm"
              >
                Simpan Pasien
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
