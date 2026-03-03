// @ts-nocheck
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const isFormData = options.isFormData || false;
    
    const config = {
      ...options,
      headers: this.getHeaders(isFormData)
    };

    if (config.isFormData) {
      delete config.isFormData;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Liste
  async getAllLists() {
    return this.request('/liste');
  }

  async getMyLists() {
    return this.request('/liste/my-lists');
  }

  async createList(formData) {
    return this.request('/liste', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  async updateListStatus(id, status) {
    return this.request(`/liste/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async deleteList(id) {
    return this.request(`/liste/${id}`, {
      method: 'DELETE'
    });
  }

  // Users
  async getIsfCisfList() {
    return this.request('/users/isf-cisf-list');
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient();
