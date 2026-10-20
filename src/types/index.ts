// ==========================================
// BAKSOQU 1.0 POS & RESTAURANT TYPES
// ==========================================
export type TableStatus = 'kosong' | 'terisi' | 'menunggu_bayar';

export interface TableItem {
  id: string;
  name: string;
  number: number;
  status: TableStatus;
  orderId?: string;
  customerName?: string;
  pax?: number;
  totalAmount?: number;
  itemsCount?: number;
  openedAt?: string;
  positionIndex: number;
}

export type MenuCategory = 'bakso_kuah' | 'pelengkap' | 'minuman' | 'paket';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderType = 'meja' | 'bungkus';
export type PaymentMethod = 'tunai' | 'qris';

export interface Order {
  id: string;
  receiptNumber: string;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'saved' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  cashAmount?: number;
  changeAmount?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  initialQty: number;
  unit: 'kg' | 'gr' | 'pcs' | 'liter' | 'ikat' | 'pack';
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  updatedAt: string;
}

export interface RestaurantProfile {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
}

export interface PrinterConfig {
  paperSize: '58mm' | '80mm';
  autoPrintKitchen: boolean;
  autoPrintReceipt: boolean;
  connectedDeviceName?: string;
  isSimulator: boolean;
}

// ==========================================
// APPQU ECOSYSTEM TYPES (4 CORE MODULES)
// ==========================================

// Role-Based Access Control (RBAC)
export type RoleTier = 'governance' | 'pengurus' | 'koordinator' | 'warga';

export type RoleDetail =
  | 'gubernur_pemda'
  | 'camat_lurah'
  | 'ketua_rt'
  | 'wakil_rt'
  | 'bendahara'
  | 'sekretaris'
  | 'koor_lingkungan'
  | 'koor_keamanan'
  | 'koor_kebersihan'
  | 'warga';

export interface UserProfile {
  id: string;
  nik: string;
  noKk: string;
  name: string;
  roleTier: RoleTier;
  roleDetail: RoleDetail;
  roleTitle: string;
  blockNumber: string;
  phone: string;
  emergencyContact: string;
  isVerified: boolean;
  residentStatus: 'tetap' | 'kontrak' | 'kos';
  occupation: string;
  joinedAt: string;
  avatarUrl?: string;
}

// 1. PAGUYUBANQU: Feed, Poll, Agenda, Kas, Surat Pengantar
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  postType: 'pengumuman' | 'diskusi' | 'polling' | 'lapor';
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
  commentsCount: number;
  pollData?: {
    question: string;
    options: PollOption[];
    userVotedOptionId?: string;
    totalVotes: number;
  };
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: 'kerja_bakti' | 'ronda' | 'rapat' | 'sosial' | 'senam';
  rsvpCount: { hadir: number; tidak: number };
  userRsvp?: 'hadir' | 'tidak';
  isCompleted: boolean;
  presensiCode?: string;
}

export interface KasTransaction {
  id: string;
  userId?: string;
  userName: string;
  blockNumber: string;
  type: 'iuran' | 'pengeluaran' | 'donasi_duka';
  title: string;
  amount: number;
  date: string;
  status: 'verified' | 'pending' | 'rejected';
  category: string;
  proofUrl?: string;
  ocrData?: {
    bank: string;
    sender: string;
    amount: number;
    transactionTime: string;
    matchScore: number;
  };
  notes?: string;
}

export interface SuratPengantar {
  id: string;
  letterNumber: string;
  userId: string;
  userName: string;
  nik: string;
  noKk: string;
  blockNumber: string;
  type: 'skck' | 'ktp_baru' | 'domisili' | 'izin_usaha' | 'kematian' | 'nikah';
  purpose: string;
  status: 'draft' | 'pending_sekretaris' | 'pending_ketua' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  digitalSignatureQr?: string;
}

// 2. WARGAQU: Buku Induk Warga
export interface ResidentData extends UserProfile {
  familyMembersCount: number;
  gender: 'L' | 'P';
  birthDate: string;
  religion: string;
  bloodType: string;
}

// 3. USAHAQU: Lapak UMKM Warga & Switch Master Bisnis
export interface LocalProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  imageUrl?: string;
}

export interface LocalBusiness {
  id: string;
  name: string;
  category: 'kuliner' | 'jasa' | 'sembako' | 'laundry' | 'kerajinan';
  ownerName: string;
  blockNumber: string;
  phone: string;
  description: string;
  rating: number;
  isPosActive?: boolean;
  posModuleKey?: 'baksoqu';
  badge?: string;
  imageUrl?: string;
  products: LocalProduct[];
}

// 4. SIAGAQU: Panic Button, Patroli Ronda, Tanggap Duka & Dompet Solidaritas
export interface EmergencyLog {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  blockNumber: string;
  type: 'kemalingan' | 'medis' | 'kebakaran' | 'bencana';
  status: 'active' | 'dispatched' | 'resolved';
  timestamp: string;
  notes: string;
  coordinates: { lat: number; lng: number };
  nearestCctvId: string;
  cctvName: string;
  sirenActive: boolean;
  responders: string[];
}

export interface PatrolCheckpoint {
  id: string;
  code: string;
  name: string;
  locationDesc: string;
  lastScannedAt?: string;
  lastScannedBy?: string;
  status: 'safe' | 'attention' | 'unsafe';
}

export interface PatrolLog {
  id: string;
  officerId: string;
  officerName: string;
  checkpointCode: string;
  checkpointName: string;
  condition: 'safe' | 'attention' | 'unsafe';
  timestamp: string;
  notes: string;
  photoUrl?: string;
}

export interface MusibahItem {
  id: string;
  title: string;
  victimFamily: string;
  blockNumber: string;
  date: string;
  type: 'kematian' | 'sakit_kritis' | 'musibah_bencana';
  description: string;
  donationTarget: number;
  donationCollected: number;
  isUrgent: boolean;
  donators: {
    id: string;
    name: string;
    amount: number;
    time: string;
    block: string;
  }[];
}

export interface PiketTask {
  id: string;
  musibahId: string;
  taskType: 'takziah' | 'pengurusan_jenazah' | 'konsumsi_tenda' | 'keamanan_parkir';
  assignedFamily: string;
  blockNumber: string;
  shiftTime: string;
  isDone: boolean;
}
