import { analytics } from './analytics';

// API Configuration
const API_CONFIG = {
  baseURL: 'https://salesgenius.ainavi.co.uk/n8n/webhook/',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Token management
class TokenManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.tokenKey = 'salesgenius_auth_token';
    this.refreshTokenKey = 'salesgenius_refresh_token';

    // Load token from localStorage on initialization
    this.loadTokenFromStorage();
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;

    // Persist to localStorage
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      if (refreshToken) {
        localStorage.setItem(this.refreshTokenKey, refreshToken);
      }
    } else {
      this.clearToken();
    }
  }

  getToken() {
    return this.token;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  clearToken() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  loadTokenFromStorage() {
    this.token = localStorage.getItem(this.tokenKey);
    this.refreshToken = localStorage.getItem(this.refreshTokenKey);
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Create token manager instance
const tokenManager = new TokenManager();

// Request interceptor to add authentication headers
const addAuthHeaders = (headers = {}) => {
  const token = tokenManager.getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Response error handler
const handleResponseError = async (response, endpoint, method) => {
  const errorData = {
    status: response.status,
    statusText: response.statusText,
    endpoint,
    method,
  };

  // Try to parse error response
  try {
    const errorBody = await response.text();
    if (errorBody) {
      try {
        const parsedError = JSON.parse(errorBody);
        errorData.message = parsedError.message || parsedError.error || errorBody;
        errorData.details = parsedError;
      } catch {
        errorData.message = errorBody;
      }
    }
  } catch {
    errorData.message = `HTTP ${response.status}: ${response.statusText}`;
  }

  // Handle specific status codes
  switch (response.status) {
    case 401:
      // Unauthorized - clear token and redirect to login
      tokenManager.clearToken();
      errorData.message = 'Authentication required. Please log in again.';
      // TODO: Trigger login redirect
      break;
    case 403:
      errorData.message = 'Access forbidden. You don\'t have permission to perform this action.';
      break;
    case 404:
      errorData.message = 'Resource not found.';
      break;
    case 429:
      errorData.message = 'Too many requests. Please try again later.';
      break;
    case 500:
      errorData.message = 'Internal server error. Please try again later.';
      break;
    case 503:
      errorData.message = 'Service temporarily unavailable. Please try again later.';
      break;
    default:
      if (!errorData.message) {
        errorData.message = `Request failed with status ${response.status}`;
      }
  }

  const error = new Error(errorData.message);
  error.status = response.status;
  error.details = errorData.details;
  error.endpoint = endpoint;
  error.method = method;

  return error;
};

// Retry logic with exponential backoff
const retryRequest = async (requestFn, retries = API_CONFIG.retries) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = API_CONFIG.retryDelay * Math.pow(2, attempt);
      console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`, error.message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Core request function
const makeRequest = async (endpoint, options = {}) => {
  const startTime = Date.now();
  const url = `${API_CONFIG.baseURL}${endpoint.replace(/^\//, '')}`;
  const method = options.method || 'GET';

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authentication headers
  addAuthHeaders(headers);

  // Prepare request configuration
  const requestConfig = {
    method,
    headers,
    signal: AbortSignal.timeout(API_CONFIG.timeout),
    ...options,
  };

  // Add body for non-GET requests
  if (options.body && method !== 'GET') {
    if (options.body instanceof FormData) {
      // Remove Content-Type for FormData (browser will set it with boundary)
      delete headers['Content-Type'];
      requestConfig.body = options.body;
    } else if (typeof options.body === 'object') {
      requestConfig.body = JSON.stringify(options.body);
    } else {
      requestConfig.body = options.body;
    }
  }

  console.log(`🚀 API Request: ${method} ${url}`, {
    headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
    body: requestConfig.body instanceof FormData ? '[FormData]' : requestConfig.body,
  });

  try {
    const response = await retryRequest(async () => {
      const res = await fetch(url, requestConfig);

      if (!res.ok) {
        throw await handleResponseError(res, endpoint, method);
      }

      return res;
    });

    const duration = Date.now() - startTime;

    // Parse response with improved error handling
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        // First read the response as text to check if it's empty
        const responseText = await response.text();

        // Handle empty response body
        if (!responseText || responseText.trim() === '') {
          console.warn(`⚠️ Empty JSON response: ${method} ${url}`);
          data = null; // or {} depending on your preference
        } else {
          // Parse the text as JSON
          data = JSON.parse(responseText);
        }
      } catch (jsonError) {
        // If JSON parsing fails, create error without trying to read response body again
        const error = new Error(`Failed to parse JSON response: ${jsonError.message}`);
        error.originalError = jsonError;
        error.endpoint = endpoint;
        error.method = method;
        error.status = response.status;

        console.error(`❌ JSON Parse Error: ${method} ${url}`, {
          originalError: jsonError.message,
          responseHeaders: Object.fromEntries(response.headers.entries())
        });

        throw error;
      }
    } else {
      data = await response.text();
    }

    console.log(`✅ API Response: ${method} ${url} (${duration}ms)`, data);

    // Track successful API response
    analytics.trackApiResponse(endpoint, method, response.status, duration);

    return {
      data,
      status: response.status,
      headers: response.headers,
      ok: response.ok,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`❌ API Error: ${method} ${url} (${duration}ms)`, error);

    // Track failed API response
    analytics.trackApiResponse(
      endpoint,
      method,
      error.status || 0,
      duration,
      error.message
    );

    throw error;
  }
};

// API service object with HTTP methods
const api = {
  // Authentication methods
  auth: {
    setToken: (token, refreshToken) => tokenManager.setToken(token, refreshToken),
    getToken: () => tokenManager.getToken(),
    clearToken: () => tokenManager.clearToken(),
    isAuthenticated: () => tokenManager.isAuthenticated(),

    // Login method
    login: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        tokenManager.setToken(response.data.token, response.data.refreshToken);
      }
      return response;
    },

    // Logout method
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } finally {
        tokenManager.clearToken();
        analytics.reset(); // Reset analytics on logout
      }
    },

    // Refresh token method
    refreshToken: async () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.data.token) {
        tokenManager.setToken(response.data.token, response.data.refreshToken);
      }
      return response;
    },
  },

  // HTTP methods
  get: async (endpoint, params = {}, options = {}) => {
    const url = new URL(endpoint, API_CONFIG.baseURL);

    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return makeRequest(url.pathname + url.search, {
      method: 'GET',
      ...options,
    });
  },

  post: async (endpoint, body = null, options = {}) => {
    return makeRequest(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  },

  put: async (endpoint, body = null, options = {}) => {
    return makeRequest(endpoint, {
      method: 'PUT',
      body,
      ...options,
    });
  },

  patch: async (endpoint, body = null, options = {}) => {
    return makeRequest(endpoint, {
      method: 'PATCH',
      body,
      ...options,
    });
  },

  delete: async (endpoint, options = {}) => {
    return makeRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },

  // File upload method
  upload: async (endpoint, file, additionalData = {}, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const options = {
      method: 'POST',
      body: formData,
    };

    // Add progress tracking if supported
    if (onProgress && typeof onProgress === 'function') {
      // Note: Fetch API doesn't support upload progress natively
      // This would require a different implementation or library
      console.warn('Upload progress tracking not implemented with fetch API');
    }

    return makeRequest(endpoint, options);
  },

  // Batch requests
  batch: async (requests) => {
    const results = await Promise.allSettled(
      requests.map(({ method, endpoint, body, options }) => {
        switch (method.toLowerCase()) {
          case 'get':
            return api.get(endpoint, body, options);
          case 'post':
            return api.post(endpoint, body, options);
          case 'put':
            return api.put(endpoint, body, options);
          case 'patch':
            return api.patch(endpoint, body, options);
          case 'delete':
            return api.delete(endpoint, options);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      })
    );

    return results.map((result, index) => ({
      ...requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  },

  // Health check
  health: async () => {
    return api.get('/health');
  },

  // Configuration
  config: {
    setBaseURL: (url) => {
      API_CONFIG.baseURL = url.endsWith('/') ? url : `${url}/`;
    },
    getBaseURL: () => API_CONFIG.baseURL,
    setTimeout: (timeout) => {
      API_CONFIG.timeout = timeout;
    },
    setRetries: (retries) => {
      API_CONFIG.retries = retries;
    },
  },
};

export default api;

// Named exports for convenience
export { api, tokenManager };

// Export specific methods for easier imports
export const { get, post, put, patch, delete: del, upload, auth } = api;