export type Food = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  vegetarian: boolean;
  available?: boolean;
};

export type CartItem = { food: Food; quantity: number };

export type Address = {
  name: string;
  phone: string;
  line: string;
  city: string;
  postalCode: string;
  paymentMethod?: "COD" | "ONLINE";
  paymentStatus?: "PENDING" | "PAID";
};

export type SavedAddress = Address & {
  id: string;
  label: "Home" | "Work" | "Other";
};

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  address?: Address;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
};

export type Recipe = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  sourceUrl?: string;
};

export type TopSellerItem = {
  name: string;
  quantity: number;
  revenue: number;
};

export type AdminAnalytics = {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  activeCount: number;
  deliveredCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  codOrdersCount: number;
  onlineOrdersCount: number;
  codRevenue: number;
  onlineRevenue: number;
  topSellers: TopSellerItem[];
};

export type LiveTrackingInfo = {
  orderId: string;
  status: OrderStatus;
  rider: {
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    avatar: string;
  };
  restaurant: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  riderLocation: {
    latitude: number;
    longitude: number;
    heading: number;
    speedKmH: number;
  };
  progressPercent: number;
  etaMinutes: number;
  distanceRemainingKm: number;
  currentMilestone: string;
};
