const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = {
  get: async (path: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`API GET Error (${path}):`, error);
      throw error;
    }
  },

  post: async (path: string, body: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`API POST Error (${path}):`, error);
      throw error;
    }
  },

  put: async (path: string, body: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`API PUT Error (${path}):`, error);
      throw error;
    }
  },

  delete: async (path: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`API DELETE Error (${path}):`, error);
      throw error;
    }
  },
};
