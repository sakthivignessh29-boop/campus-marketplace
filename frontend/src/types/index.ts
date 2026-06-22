export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  college: string;
  department: string;
  year: number;
  role: Role;
  profilePicture?: string;
  sustainabilityScore: number;
  ecoPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export type ProductType = 'SELL' | 'BUY' | 'EXCHANGE' | 'DONATE' | 'RENT';
export type ProductStatus = 'AVAILABLE' | 'PENDING' | 'REUSED' | 'ARCHIVED';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  itemCondition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  category: Category;
  type: ProductType;
  seller: User;
  sustainabilityScore: number;
  status: ProductStatus;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  pickupLocationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  product: Product;
  buyer: User;
  seller: User;
  type: ProductType;
  pointsTransferred: number;
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  product?: Product;
  isRead: boolean;
  imageUrl?: string;
  createdAt: string;
}

export type DonationStatus = 'SUBMITTED' | 'MATCHED' | 'PICKED_UP' | 'DELIVERED';

export interface Donation {
  id: number;
  product: Product;
  donor: User;
  beneficiary?: User;
  trackingStatus: DonationStatus;
  impactCo2: number;
  impactWaste: number;
  createdAt: string;
}

export type BadgeType = 'ECO_STARTER' | 'RECYCLER' | 'SUSTAINABILITY_HERO' | 'GREEN_CHAMPION';

export interface Badge {
  id: number;
  user: User;
  type: BadgeType;
  earnedAt: string;
}

export interface Notification {
  id: number;
  user: User;
  content: string;
  type: 'NEW_MESSAGE' | 'PRODUCT_SOLD' | 'PRODUCT_APPROVED' | 'DONATION_ACCEPTED' | 'BADGE_EARNED';
  isRead: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: number;
  admin: User;
  action: string;
  targetId: number;
  targetType: string;
  timestamp: string;
}

export interface Report {
  id: number;
  title: string;
  type: string;
  fileUrl: string;
  createdBy: User;
  createdAt: string;
}

