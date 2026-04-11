import { API_URL } from "../config/api";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Card {
  id: number;
  card_number: string;
  is_used: boolean;
}

export default function CardPoolManager() {
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [newCard, setNewCard] = useState('');
  const [error, setError] = useState('');

  const fetchCards = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(response.data);
    } catch (err) {
      setError('Failed to fetch cards');
    }
  };

  useEffect(() => {
    fetchCards();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.trim()) return;
    setError('');
    try {
      await axios.post(`${API_URL}/api/cards`, { card_number: newCard }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCard('');
      fetchCards();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add card');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/api/cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCards();
    } catch (err) {
      setError('Failed to delete card');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Card Pool Management</h2>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <form onSubmit={handleAdd} className="flex gap-4 mb-6">
        <input
          type="text"
          value={newCard}
          onChange={(e) => setNewCard(e.target.value)}
          placeholder="New Card Number"
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> Add Card
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map(card => (
              <tr key={card.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{card.card_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {card.is_used ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Used</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(card.id)} className="text-red-600 hover:text-red-900 ml-4">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No cards in pool.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
