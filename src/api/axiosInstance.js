import axios from "axios";
// إنشاء نسخة مخصصة مع الرابط الأساسي للباك إند الخاص بك
const defaultBaseURL = import.meta.env.DEV
  ? "http://localhost:5500/api/v1"
  : "https://7cm9pktt-5500.eun1.devtunnels.ms/api/v1";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || defaultBaseURL,
});

// Interceptor: يعترض أي طلب قبل خروجه لإرفاق التوكن إذا كان موجوداً
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
