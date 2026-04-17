import axios from "axios";

const API_BASE_URL = "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem("access_token", access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),
  getMe: () => api.get("/auth/me"),
};

export const profileAPI = {
  getProfile: () => api.get("/profiles/me"),
  updateProfile: (data) => api.put("/profiles/me", data),
};

export const ordersAPI = {
  getOrders: (params) => api.get("/orders", { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post("/orders", data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const servicesAPI = {
  getServices: (params) => api.get("/services", { params }),
  getService: (id) => api.get(`/services/${id}`),
  createService: (data) => api.post("/services", data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),
};

export const responsesAPI = {
  createResponse: (data) => api.post("/responses", data),
  getResponses: (params) => api.get("/responses", { params }),
  getResponse: (id) => api.get(`/responses/${id}`),
  acceptResponse: (id) => api.post(`/responses/${id}/accept`),
  rejectResponse: (id) => api.post(`/responses/${id}/reject`),
};

export const reviewsAPI = {
  createReview: (data) => api.post("/reviews", data),
  getReviewsByUser: (userId, params) =>
    api.get(`/reviews/user/${userId}`, { params }),
};

export const paymentsAPI = {
  createPayment: (data) => api.post("/payments", data),
  getPayments: (params) => api.get("/payments", { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
};

export const categoriesAPI = {
  getCategories: (params) => api.get("/categories", { params }),
  createCategory: (data) => api.post("/categories", data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
