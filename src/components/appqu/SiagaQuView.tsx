import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  HeartPulse,
  AlertOctagon,
  Volume2,
  VolumeX,
  MapPin,
  Camera,
  QrCode,
  CheckCircle,
  Clock,
  ShieldCheck,
  Send,
  Upload,
  Heart,
  Users,
  FileText,
  Radio,
  PhoneCall,
  X,
  Sparkles,
} from 'lucide-react';

import {
  UserProfile,
  EmergencyLog,
  PatrolCheckpoint,
  PatrolLog,
  MusibahItem,
  PiketTask,
} from '../../types';
import { sireneAudio } from '../../services/sireneAudio';

interface SiagaQuViewProps {
  currentUser: UserProfile;
  checkpoints: PatrolCheckpoint[];
  patrolLogs: PatrolLog[];
  musibahList: MusibahItem[];
  piketTasks: PiketTask[];
  onUpdateCheckpoints: (cp: PatrolCheckpoint[]) => void;
  onUpdatePatrolLogs: (pl: PatrolLog[]) => void;
  onUpdateMusibah: (m: MusibahItem[]) => void;
  onUpdatePiket: (p: PiketTask[]) => void;
  showNotification: (msg: string) => void;
}

export const SiagaQuView: React.FC<SiagaQuViewProps> = ({
  currentUser,
  checkpoints,
  patrolLogs,
  musibahList,
  piketTasks,
  onUpdateCheckpoints,
  onUpdatePatrolLogs,
  onUpdateMusibah,
  onUpdatePiket,
  showNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'darurat' | 'patroli' | 'solidaritas'>('darurat');

  // Emergency States
  const [activeEmergency, setActiveEmergency] = useState<EmergencyLog | null>(null);
  const [isSirenSounding, setIsSirenSounding] = useState<boolean>(false);
  const [selectedCctv, setSelectedCctv] = useState<string>('cctv-1');

  // Patrol Scanner Modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanningCheckpoint, setScanningCheckpoint] = useState<PatrolCheckpoint | null>(null);

  // Daily Security Log Form Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logCondition, setLogCondition] = useState<'safe' | 'attention' | 'unsafe'>('safe');
  const [logNotes, setLogNotes] = useState('');

  // Donation Modal
  const [donationModalItem, setDonationModalItem] = useState<MusibahItem | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(50000);

  // ----------------------------------------------------
  // PANIC BUTTON TRIGGER
  // ----------------------------------------------------
  const handleTriggerPanic = (type: 'kemalingan' | 'medis' | 'kebakaran' | 'bencana') => {
    // Start Audio Siren
    sireneAudio.startSiren();
    setIsSirenSounding(true);

    const newEmerg: EmergencyLog = {
      id: `sos-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterPhone: currentUser.phone,
      blockNumber: currentUser.blockNumber,
      type,
      status: 'active',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      notes: `Peringatan darurat kategori ${type.toUpperCase()} diaktifkan dari aplikasi AppQu warga!`,
      coordinates: { lat: -7.7956, lng: 110.3695 },
      nearestCctvId: 'cctv-1',
      cctvName: 'CCTV Pertigaan Blok C & Balai Warga',
      sirenActive: true,
      responders: ['Satpam Pos Utama (Pak Agus)', 'Ketua RT 04 (Pak Hendra)'],
    };

    setActiveEmergency(newEmerg);
    showNotification(
      `🚨 SIAGAQU SOS: Sirene dibunyikan! Notifikasi darurat dikirim ke Satpam & RT.`
    );
  };

  const handleStopSiren = () => {
    sireneAudio.stopSiren();
    setIsSirenSounding(false);
    if (activeEmergency) {
      setActiveEmergency({ ...activeEmergency, sirenActive: false });
    }
    showNotification('Sirene darurat dimatikan.');
  };

  const handleResolveEmergency = () => {
    sireneAudio.stopSiren();
    setIsSirenSounding(false);
    setActiveEmergency(null);
    showNotification('Status darurat telah diselesaikan (Resolved).');
  };

  // ----------------------------------------------------
  // PATROL CHECKPOINT HANDLER
  // ----------------------------------------------------
  const handleScanCheckpoint = (cp: PatrolCheckpoint) => {
    setScanningCheckpoint(cp);
    setIsScanModalOpen(true);
  };

  const handleConfirmScan = () => {
    if (!scanningCheckpoint) return;

    const time = new Date().toISOString();
    const updated = checkpoints.map((c) =>
      c.id === scanningCheckpoint.id
        ? {
            ...c,
            lastScannedAt: time,
            lastScannedBy: `${currentUser.name} (${currentUser.roleTitle})`,
            status: 'safe' as const,
          }
        : c
    );
    onUpdateCheckpoints(updated);

    const newLog: PatrolLog = {
      id: `pl-${Date.now()}`,
      officerId: currentUser.id,
      officerName: currentUser.name,
      checkpointCode: scanningCheckpoint.code,
      checkpointName: scanningCheckpoint.name,
      condition: 'safe',
      timestamp: time,
      notes: `Verifikasi QR Checkpoint shift malam oleh ${currentUser.name}. Situasi kondusif.`,
    };
    onUpdatePatrolLogs([newLog, ...patrolLogs]);

    setIsScanModalOpen(false);
    setScanningCheckpoint(null);
    showNotification(`Checkpoint ${scanningCheckpoint.name} berhasil di-scan.`);
  };

  const handleSaveSecurityLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: PatrolLog = {
      id: `pl-${Date.now()}`,
      officerId: currentUser.id,
      officerName: currentUser.name,
      checkpointCode: 'PATROLI-KELILING',
      checkpointName: 'Keliling Wilayah RT 04',
      condition: logCondition,
      timestamp: new Date().toISOString(),
      notes: logNotes || 'Laporan situasi patroli harian.',
    };

    onUpdatePatrolLogs([newLog, ...patrolLogs]);
    setIsLogModalOpen(false);
    setLogNotes('');
    showNotification('Laporan situasi keamanan harian tersimpan.');
  };

  // ----------------------------------------------------
  // SOLIDARITAS & DONASI HANDLER
  // ----------------------------------------------------
  const handleDonate = () => {
    if (!donationModalItem) return;

    const updated = musibahList.map((m) => {
      if (m.id === donationModalItem.id) {
        return {
          ...m,
          donationCollected: m.donationCollected + donationAmount,
          donators: [
            {
              id: `dn-${Date.now()}`,
              name: currentUser.name,
              amount: donationAmount,
              time: 'Baru saja',
              block: currentUser.blockNumber,
            },
            ...m.donators,
          ],
        };
      }
      return m;
    });

    onUpdateMusibah(updated);
    setDonationModalItem(null);
    showNotification(
      `Alhamdulillah, donasi kilat Rp ${donationAmount.toLocaleString('id-ID')} tersalurkan secara transparan.`
    );
  };

  const handleTogglePiket = (taskId: string) => {
    const updated = piketTasks.map((t) => (t.id === taskId ? { ...t, isDone: !t.isDone } : t));
    onUpdatePiket(updated);
    showNotification('Status piket gotong royong diperbarui.');
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Sub Tabs */}
      <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('darurat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'darurat'
                ? 'bg-red-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>Panic Button</span>
          </button>

          <button
            onClick={() => setActiveTab('patroli')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patroli'
                ? 'bg-red-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Patroli & Ronda</span>
          </button>

          <button
            onClick={() => setActiveTab('solidaritas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'solidaritas'
                ? 'bg-red-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Tanggap Duka & Piket</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* ========================================================= */}
        {/* TAB 1: PANIC BUTTON & EMERGENCY RESPONSE */}
        {/* ========================================================= */}
        {activeTab === 'darurat' && (
          <div className="space-y-3.5">
            {/* Active Emergency Alert Banner */}
            {activeEmergency && (
              <div className="bg-red-700 text-white rounded-2xl p-4 shadow-lg animate-pulse border-2 border-red-500 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-amber-300 animate-spin" />
                    <span className="font-black text-xs tracking-wider uppercase">
                      SIAGAQU AKTIF: {activeEmergency.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded">
                    {activeEmergency.timestamp}
                  </span>
                </div>

                <div className="text-xs bg-red-900/60 p-2.5 rounded-xl space-y-1">
                  <div>
                    Pelapor: <strong>{activeEmergency.reporterName}</strong> ({activeEmergency.blockNumber})
                  </div>
                  <div>HP: {activeEmergency.reporterPhone}</div>
                  <div className="text-[11px] text-amber-200">
                    Notifikasi Sirene Kencang Terkirim ke Satpam & Pengurus RT!
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {isSirenSounding ? (
                    <button
                      onClick={handleStopSiren}
                      className="flex-1 py-2 bg-white text-red-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>Matikan Suara Sirene</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sireneAudio.startSiren();
                        setIsSirenSounding(true);
                      }}
                      className="flex-1 py-2 bg-amber-400 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Bunyikan Sirene Lagi</span>
                    </button>
                  )}

                  <button
                    onClick={handleResolveEmergency}
                    className="py-2 px-3 bg-red-950 hover:bg-black text-white rounded-xl text-xs font-bold"
                  >
                    Selesai (Resolve)
                  </button>
                </div>
              </div>
            )}

            {/* Big Panic Buttons Grid */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                  Respon Cepat Darurat Terverifikasi
                </span>
                <h2 className="text-sm font-black text-stone-900">
                  Tekan Tombol Darurat untuk Bantuan Segera
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Sirene audio akan otomatis berbunyi dan peringatan prioritas diteruskan ke Satpam & RT.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleTriggerPanic('kemalingan')}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <ShieldAlert className="w-7 h-7 text-amber-300" />
                  <span className="text-xs font-black">KEMALINGAN</span>
                  <span className="text-[9px] text-red-200">Kejahatan / Gangguan</span>
                </button>

                <button
                  onClick={() => handleTriggerPanic('medis')}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 hover:from-teal-700 hover:to-emerald-900 text-white flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <HeartPulse className="w-7 h-7 text-white" />
                  <span className="text-xs font-black">MEDIS / AMBULANS</span>
                  <span className="text-[9px] text-emerald-200">Sakit Kritis / Darurat</span>
                </button>

                <button
                  onClick={() => handleTriggerPanic('kebakaran')}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Flame className="w-7 h-7 text-amber-200" />
                  <span className="text-xs font-black">KEBAKARAN</span>
                  <span className="text-[9px] text-amber-200">Kebocoran Gas / Api</span>
                </button>

                <button
                  onClick={() => handleTriggerPanic('bencana')}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-700 to-stone-900 hover:from-stone-800 hover:to-black text-white flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <AlertOctagon className="w-7 h-7 text-amber-400" />
                  <span className="text-xs font-black">BENCANA ALAM</span>
                  <span className="text-[9px] text-stone-300">Pohon Tumbang / Banjir</span>
                </button>
              </div>
            </div>

            {/* Mini Map & Victims Geolocation Tracking */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold text-stone-900">
                    Peta Mini Presisi Lokasi Rumah Korban
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-stone-500 font-bold">
                  RT 04 / RW 09
                </span>
              </div>

              {/* Graphic Map Canvas Simulation */}
              <div className="w-full h-40 bg-stone-900 rounded-xl relative overflow-hidden border border-stone-800 flex items-center justify-center">
                {/* Simulated Street Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-stone-700/60"></div>
                <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-stone-700/60"></div>
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-700/60"></div>

                {/* Victim Pin Marker */}
                <div className="relative z-10 flex flex-col items-center animate-bounce">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg ring-4 ring-red-400/40">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono font-bold">
                    Blok C3 No. 12 (Rumah Budi Santoso)
                  </div>
                </div>

                {/* Neighbor Houses Pin */}
                <div className="absolute top-4 left-6 px-1.5 py-0.5 rounded bg-stone-800 text-[8px] text-stone-300">
                  Blok A (Rumah Pak RT)
                </div>
                <div className="absolute bottom-4 right-6 px-1.5 py-0.5 rounded bg-stone-800 text-[8px] text-stone-300">
                  Pos Ronda Utama
                </div>
              </div>

              <div className="text-[11px] text-stone-600 flex justify-between">
                <span>Koordinat: -7.7956° S, 110.3695° E</span>
                <span className="text-emerald-700 font-bold">Jarak ke Pos Satpam: 120m</span>
              </div>
            </div>

            {/* RTSP / Live Stream CCTV Lingkungan Terdekat */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Live Feed CCTV Lingkungan Terdekat</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <span>LIVE RTSP</span>
                </div>
              </div>

              {/* CCTV Video Monitor Simulator */}
              <div className="w-full aspect-video bg-black rounded-xl relative overflow-hidden flex items-center justify-center border border-stone-800">
                <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>
                    {selectedCctv === 'cctv-1'
                      ? 'CAM-01: Pos Ronda & Gerbang'
                      : selectedCctv === 'cctv-2'
                      ? 'CAM-02: Pertigaan Blok C & Fasum'
                      : 'CAM-03: Pintu Belakang Blok D'}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-stone-300 bg-black/60 px-1.5 py-0.5 rounded">
                  25 FPS · 1080p · 2026-10-19
                </div>

                {/* Simulated Camera Content */}
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                    <Camera className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-[11px] text-stone-300 font-mono">
                    Streaming Real-Time RTSP RTSP://192.168.1.10{selectedCctv.slice(-1)}/live
                  </div>
                  <div className="text-[9px] text-stone-400">
                    Kamera terhubung lancar. Tidak terdeteksi anomali gerak.
                  </div>
                </div>
              </div>

              {/* CCTV Selector Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cctv-1', label: 'CAM 01: Pos Utama' },
                  { id: 'cctv-2', label: 'CAM 02: Blok C Fasum' },
                  { id: 'cctv-3', label: 'CAM 03: Pintu Belakang' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCctv(c.id)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold truncate transition-all ${
                      selectedCctv === c.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SMART PATROLI & RONDA DIGITAL */}
        {/* ========================================================= */}
        {activeTab === 'patroli' && (
          <div className="space-y-3.5">
            <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Sistem Patroli Mandiri Warga RT 04
                </span>
                <span className="text-[9px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono">
                  Shift Malam 22.00 - 05.00
                </span>
              </div>
              <h2 className="text-sm font-bold">QR Checkpoint Sudut Perumahan</h2>
              <p className="text-xs text-stone-300 leading-relaxed">
                Petugas satpam dan warga yang bertugas ronda wajib memindai QR Code di setiap titik pos
                sesuai jam patroli untuk memastikan keamanan fisik perumahan.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Isi Daily Security Log (Safe / Unsafe)</span>
                </button>
              </div>
            </div>

            {/* Checkpoint Cards List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-800 px-1">
                Daftar Titik Checkpoint Patroli
              </div>

              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                        {cp.code}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 mt-1">{cp.name}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{cp.locationDesc}</p>
                    </div>

                    <button
                      onClick={() => handleScanCheckpoint(cp)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs active:scale-95"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-300" />
                      <span>Scan Titik</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                    <span>Terakhir di-scan: {cp.lastScannedBy || 'Belum di-scan'}</span>
                    <span className="font-bold text-emerald-700">
                      {cp.lastScannedAt ? new Date(cp.lastScannedAt).toLocaleTimeString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Riwayat Patroli Terbaru */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-800 px-1">
                Log Catatan Keamanan & Patroli
              </div>

              {patrolLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-2xs text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{log.checkpointName}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        log.condition === 'safe'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.condition.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug">{log.notes}</p>
                  <div className="text-[10px] text-stone-400 pt-0.5">
                    Petugas: {log.officerName} · {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TANGGAP DUKA & DOMPET SOLIDARITAS */}
        {/* ========================================================= */}
        {activeTab === 'solidaritas' && (
          <div className="space-y-3.5">
            {/* Musibah Items */}
            {musibahList.map((m) => {
              const pct = Math.min(100, Math.round((m.donationCollected / m.donationTarget) * 100));

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border-2 border-stone-300 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-900 text-white">
                      BERITA MUSIBAH RESMI
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">{m.date}</span>
                  </div>

                  <h3 className="text-xs font-bold text-stone-900 leading-snug">{m.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                    {m.description}
                  </p>

                  {/* Dompet Solidaritas Digital Progress */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800">Dompet Solidaritas Warga</span>
                      <span className="font-mono font-black text-emerald-800">
                        Rp {m.donationCollected.toLocaleString('id-ID')} / Rp{' '}
                        {m.donationTarget.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>Terkumpul: {pct}% dari target santunan</span>
                      <button
                        onClick={() => setDonationModalItem(m)}
                        className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-xs active:scale-95"
                      >
                        Kirim Donasi Kilat ➔
                      </button>
                    </div>

                    {/* Real-Time Donators List */}
                    <div className="pt-2 border-t border-stone-200 space-y-1">
                      <span className="text-[10px] font-bold text-stone-600 block">
                        Transparansi Donatur ({m.donators.length} Warga Berpartisipasi):
                      </span>
                      <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] pr-1">
                        {m.donators.map((d) => (
                          <div
                            key={d.id}
                            className="flex justify-between items-center text-stone-600 py-0.5 border-b border-stone-100"
                          >
                            <span>
                              {d.name} ({d.block})
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              Rp {d.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Otomasi Piket Gotong Royong */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">
                    Otomasi Jadwal Piket Gotong Royong
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Pembagian tugas takziah, pengurusan jenazah, konsumsi, dan parkir.
                  </p>
                </div>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>

              <div className="space-y-2">
                {piketTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 capitalize">
                          Tugas {task.taskType.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-medium">
                          {task.blockNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        {task.assignedFamily}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Jadwal: {task.shiftTime}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePiket(task.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        task.isDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                    >
                      {task.isDone ? '✓ Terlaksana' : 'Belum Selesai'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: QR SCAN CHECKPOINT */}
      {/* ---------------------------------------------------- */}
      {isScanModalOpen && scanningCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center space-y-3 animate-in fade-in zoom-in-95">
            <h3 className="text-xs font-bold text-stone-900">{scanningCheckpoint.name}</h3>
            <div className="w-48 h-48 bg-stone-900 rounded-2xl mx-auto flex flex-col items-center justify-center relative overflow-hidden border-2 border-emerald-500">
              <QrCode className="w-32 h-32 text-emerald-400" />
              <div className="absolute inset-x-0 h-1 bg-emerald-400 animate-pulse top-1/2"></div>
              <span className="text-[10px] font-mono text-emerald-300 mt-2">
                Scanning {scanningCheckpoint.code}...
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Petugas: <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleConfirmScan}
                className="py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Simpan Scan Valid
              </button>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: DAILY SECURITY LOG */}
      {/* ---------------------------------------------------- */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-md p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-stone-900">Form Daily Security Log</h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecurityLog} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700">Status Kondisi Lingkungan</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {(['safe', 'attention', 'unsafe'] as const).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setLogCondition(c)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        logCondition === c
                          ? c === 'safe'
                            ? 'bg-emerald-800 text-white shadow'
                            : c === 'attention'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-red-700 text-white shadow'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {c === 'safe' ? 'Safe (Aman)' : c === 'attention' ? 'Perhatian' : 'Unsafe'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Catatan Kejadian / Observasi</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Lampu tiang PJU Blok C padam, sudah ditandai. Pintu portal utama dikunci jam 23.00 WIB."
                  className="w-full mt-1 p-2 rounded-xl border border-stone-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
              >
                Kirim Laporan Keamanan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: DONASI KILAT SOLIDARITAS */}
      {/* ---------------------------------------------------- */}
      {donationModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-stone-900">Dompet Solidaritas Warga</h3>
              <button
                onClick={() => setDonationModalItem(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-1">
              <div>
                Penerima: <strong>{donationModalItem.victimFamily}</strong>
              </div>
              <div className="text-[11px] text-stone-400">
                Pencatatan real-time terbuka untuk seluruh warga RT 04.
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700">Pilih Nominal Donasi</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {[20000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDonationAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      donationAmount === amt
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Rp {amt.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDonate}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Salurkan Donasi Rp {donationAmount.toLocaleString('id-ID')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
