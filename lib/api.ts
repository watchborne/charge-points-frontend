import { ChargePoint, Site } from '@/types';

// URL du backend - en HTTP simple pour éviter les problèmes SSL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  // Récupérer toutes les bornes
  async getChargePoints(): Promise<ChargePoint[]> {
    try {
      const response = await fetch(`${API_URL}/api/charge-points`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch charge points:', error);
      throw error;
    }
  },

  // Récupérer tous les sites
  async getSites(): Promise<Site[]> {
    try {
      const response = await fetch(`${API_URL}/api/sites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      throw error;
    }
  },

  // Créer une borne
  async createChargePoint(chargePoint: Partial<ChargePoint>): Promise<ChargePoint> {
    const response = await fetch(`${API_URL}/api/charge-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePoint),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Mettre à jour une borne
  async updateChargePoint(id: string, updates: Partial<ChargePoint>): Promise<ChargePoint> {
    const response = await fetch(`${API_URL}/api/charge-points/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Supprimer une borne
  async deleteChargePoint(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/charge-points/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};
