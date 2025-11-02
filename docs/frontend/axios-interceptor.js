// Exemplo de interceptor Axios para lidar com Authorization + Refresh Token
// Uso: importe e chame `setupInterceptors(api)` após criar sua instância axios

import axios from 'axios';

export function setupInterceptors(api) {
  // Adiciona o header Authorization se houver token
  api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    return config;
  });

  // Interceptor de resposta para refresh em 401
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (!originalRequest || !error.response) return Promise.reject(error);

      // se 401 e não é a requisição de refresh
      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // enfileira a requisição para ser repetida após o refresh
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          isRefreshing = false;
          // redirect to login or reject
          return Promise.reject(error);
        }

        try {
          const resp = await axios.post(`${api.defaults.baseURL || ''}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = resp.data;
          // update local storage
          localStorage.setItem('accessToken', accessToken);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          isRefreshing = false;

          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          isRefreshing = false;
          // opcional: redirecionar para login
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );
}