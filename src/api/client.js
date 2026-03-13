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
        const error = new Error(data.error || 'Request failed');
        // Attach existingId if present in response
        if (data.existingId) {
          error.existingId = data.existingId;
        }
        throw error;
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
    // Call logout endpoint before clearing token
    const logoutPromise = this.token 
      ? this.request('/auth/logout', { method: 'POST' }).catch(err => {
          console.error('Logout audit error:', err);
        })
      : Promise.resolve();
    
    this.setToken(null);
    return logoutPromise;
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

  // Atestate
  async getAllAtestate() {
    return this.request('/atestate');
  }

  async getMyAtestate() {
    return this.request('/atestate/my-atestate');
  }

  async createAtestat(formData) {
    return this.request('/atestate', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  async deleteAtestat(id) {
    return this.request(`/atestate/${id}`, {
      method: 'DELETE'
    });
  }

  async updateAtestatStatus(id, status) {
    return this.request(`/atestate/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Audit
  async getAuditLogs(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/audit${queryParams ? '?' + queryParams : ''}`);
  }

  async deleteAllAudits() {
    return this.request('/audit/all', {
      method: 'DELETE'
    });
  }

  async deleteAudits(ids) {
    return this.request('/audit', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  }

  // DRE
  async getAllDre() {
    return this.request('/dre');
  }

  async getMyDre() {
    return this.request('/dre/my');
  }

  async getArchivedDre() {
    return this.request('/dre/archived');
  }

  async getMyArchivedDre() {
    return this.request('/dre/my-archived');
  }

  async createDre(formData) {
    return this.request('/dre', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  async deleteDre(id) {
    return this.request(`/dre/${id}`, {
      method: 'DELETE'
    });
  }

  async archiveDre(id) {
    return this.request(`/dre/${id}/archive`, {
      method: 'PATCH'
    });
  }

  async restoreDre(id) {
    return this.request(`/dre/${id}/restore`, {
      method: 'PATCH'
    });
  }

  async checkExaminatorDre(nume, organization) {
    return this.request(`/dre/check-examinator/${encodeURIComponent(nume)}/${encodeURIComponent(organization)}`);
  }
}

export const apiClient = new ApiClient();
