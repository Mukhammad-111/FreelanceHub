import { api } from "./api";
import {
  Order, Service, Category, OrderResponse, Review, Payment,
  Profile, OrderStatus, AdminStats, User,
} from "./types";

// Categories
export const categoriesApi = {
  list: () => api.get("/categories/").then(r => normalizeList<Category>(r.data)),
  create: (name: string) => api.post<Category>("/categories/", { name }).then(r => r.data),
  update: (id: number, name: string) => api.put<Category>(`/categories/${id}`, { name }).then(r => r.data),
  remove: (id: number) => api.delete(`/categories/${id}`).then(r => r.data),
};

// Orders
export const ordersApi = {
  list: (params?: { category_id?: number; status?: string }): Promise<Order[]> =>
    api.get("/orders/", { params }).then(r => normalizeList<Order>(r.data)),
  get: (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  create: (payload: { title: string; description: string; budget: number; category_id: number }) =>
    api.post<Order>("/orders/", payload).then(r => r.data),
  update: (id: number, payload: Partial<Order>) => api.put<Order>(`/orders/${id}`, payload).then(r => r.data),
  remove: (id: number) => api.delete(`/orders/${id}`).then(r => r.data),
  setStatus: (id: number, status: OrderStatus) =>
    api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
};

// Services
export const servicesApi = {
  list: (params?: { category_id?: number }): Promise<Service[]> =>
    api.get("/services/", { params }).then(r => normalizeList<Service>(r.data)),
  get: (id: number) => api.get<Service>(`/services/${id}`).then(r => r.data),
  create: (payload: { title: string; description: string; price: number; category_id: number }) =>
    api.post<Service>("/services/", payload).then(r => r.data),
  update: (id: number, payload: Partial<Service>) => api.put<Service>(`/services/${id}`, payload).then(r => r.data),
  remove: (id: number) => api.delete(`/services/${id}`).then(r => r.data),
};

// Responses
export const responsesApi = {
  list: (): Promise<OrderResponse[]> => api.get("/responses/").then(r => normalizeList<OrderResponse>(r.data)),
  get: (id: number) => api.get<OrderResponse>(`/responses/${id}`).then(r => r.data),
  create: (payload: { order_id: number; message: string }) =>
    api.post<OrderResponse>("/responses/", payload).then(r => r.data),
  accept: (id: number) => api.post(`/responses/${id}/accept`).then(r => r.data),
  reject: (id: number) => api.post(`/responses/${id}/reject`).then(r => r.data),
};

// Reviews
export const reviewsApi = {
  byUser: (userId: number): Promise<Review[]> => api.get(`/reviews/user/${userId}`).then(r => normalizeList<Review>(r.data)),
  create: (payload: { reviewed_user_id: number; rating: number; comment: string; order_id?: number }) =>
    api.post<Review>("/reviews/", payload).then(r => r.data),
};

// Payments
export const paymentsApi = {
  list: (params?: { order_id?: number; limit?: number; offset?: number }): Promise<Payment[]> =>
    api.get("/payments/", { params }).then(r => normalizeList<Payment>(r.data)),
  get: (id: number) => api.get<Payment>(`/payments/${id}`).then(r => r.data),
  create: (payload: { order_id: number; amount: number }) =>
    api.post<Payment>("/payments/", payload).then(r => r.data),
};

// Profile
export const profilesApi = {
  me: () => api.get<Profile>("/profiles/me").then(r => r.data),
  update: (payload: { name: string; bio: string; skills: string }) => api.put<Profile>("/profiles/me", payload).then(r => r.data),
};

// Admin
export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then(r => r.data),
  users: (): Promise<User[]> => api.get("/admin/users").then(r => normalizeList<User>(r.data)),
  block: (id: number) => api.patch(`/admin/users/${id}/block`).then(r => r.data),
  remove: (id: number) => api.delete(`/admin/users/${id}`).then(r => r.data),
  makeAdmin: (id: number) => api.patch(`/admin/users/${id}/make-admin`).then(r => r.data),
};

function normalizeList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
