// Centralized API Configuration for Development & Production Deployment
export const API_BASE = import.meta.env.VITE_API_BASE || "https://27edf7726ec826.lhr.life";

export const getApiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export default API_BASE;
