// Configuración base del backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api';

/**
 * Servicio para llamadas al backend
 */
export const apiService = {
  /**
   * Envía un saludo personalizado al backend
   * @param {string} name - Nombre para el saludo
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async sendGreeting(name) {
    try {
      const res = await fetch(`${API_BASE_URL}/hello`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error al llamar al backend:', error);
      return { success: false, error: error.message };
    }
  },

  // Aquí puedes agregar más métodos para otros endpoints
};
