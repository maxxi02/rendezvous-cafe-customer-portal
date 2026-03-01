// app/types/order.type.ts

export type QrType = "dine-in" | "walk-in" | "drive-thru";

export type QueueStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface CustomerOrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  category?: string;
  menuType?: "food" | "drink";
  imageUrl?: string;
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
}

export interface CustomerOrder {
  orderId: string;
  orderNumber?: string;
  sessionId?: string;
  tableId?: string;
  qrType?: QrType;
  customerName: string;
  customerId?: string;
  items: CustomerOrderItem[];
  orderNote?: string;
  orderType: "dine-in" | "takeaway";
  tableNumber?: string;
  subtotal: number;
  total: number;
  timestamp: Date;

  paymentMethod?: "gcash";
  paymentStatus?: string;
  paymentReference?: string;
  queueStatus?: QueueStatus;
}
