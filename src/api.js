import axios from 'axios';
import { publish } from './utils/notification';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // The session lives in an httpOnly cookie set by the API (back/utils/authCookie.js)
  // — this makes the browser attach it automatically. There's no token in JS
  // to read or set.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      let message = 'Too many requests. Please try again later.';
      if (retryAfter) {
        message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      }
      publish({ message, type: 'error' });
    }
    return Promise.reject(error);
  }
);

export default api;
