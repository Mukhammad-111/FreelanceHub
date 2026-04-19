export type Role = "client" | "freelancer" | "admin";
export type OrderStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "PAID";
export type ResponseStatus = "pending" | "accepted" | "rejected";
export type PaymentStatus = "pending" | "paid";

export interface User {
  id: number;
  email: string;
  name?: string;
  role: Role;
  is_active?: boolean;
  is_blocked?: boolean; // Keep for convenience
  created_at?: string;
}

export interface ProfileDetails {
  name: string;
  bio: string;
  skills: string;
  rating: number;
}

export interface Profile {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  profile: ProfileDetails;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  budget: number;
  status: OrderStatus;
  category_id: number;
  client_id?: number;
  freelancer_id?: number | null;
  created_at: string;
  updated_at?: string;
  category?: Category;
  client?: User;
  freelancer?: User;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  category_id: number;
  freelancer_id?: number;
  created_at: string;
  category?: Category;
  freelancer?: User;
}

export interface OrderResponse {
  id: number;
  order_id: number;
  freelancer_id: number;
  message: string;
  status: ResponseStatus;
  created_at: string;
  freelancer?: User;
  order?: Order;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: User;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  status: PaymentStatus;
  created_at: string;
}

export interface AdminStats {
  users_total: number;
  orders_total: number;
  services_total: number;
  payments_total: number;
}
