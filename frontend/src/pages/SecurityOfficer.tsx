import { API_URL } from "../config/api";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Check, X, Clock } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function SecurityOfficer() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pre-approvals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only pending requests for the main list
      setRequests(res.data.filter((r: any) => r.status === 'pending'));
    } catch (e) {
      setError('Failed to fetch requests.');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const formData = new FormData();
      formData.append('status', status);

      await axios.put(`${API_URL}/api/pre-approvals/${id}/status`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedRequest(null);
      fetchRequests();
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-gray-600 flex items-center gap-2"><Shield size={20} /> Security Dashboard: {user?.username}</span>
          <button onClick={() => navigate('/history')} className="text-blue-600 hover:underline text-sm">View History</button>
          <button onClick={logout} className="text-red-600 hover:underline text-sm">Logout</button>
        </div>
        <LanguageToggle />
      </header>

      <main className="max-w-6xl mx-auto">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={18} /> Pending Reviews</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending requests.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map(req => (
                  <li
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3 rounded cursor-pointer border ${selectedRequest?.id === req.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className="font-medium text-sm">{req.name}</div>
                    <div className="text-xs text-gray-500">ID: {req.national_id}</div>
                    <div className="text-xs text-gray-400 mt-1">Submitted by: {req.employee_username}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow p-6 min-h-[500px]">
            {!selectedRequest ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select a request from the list to review.
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold">Review Request: {selectedRequest.name}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                      className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                      className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">Extracted Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">Full Name</span>
                        <span className="font-medium">{selectedRequest.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">National ID</span>
                        <span className="font-medium">{selectedRequest.national_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Date of Birth</span>
                        <span className="font-medium">{selectedRequest.date_of_birth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Address</span>
                        <span className="font-medium">{selectedRequest.address || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Submitted By</span>
                        <span className="font-medium">{selectedRequest.employee_username}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">Uploaded ID Image</h3>
                    {selectedRequest.id_image_filename ? (
                      <div className="border rounded bg-gray-50 p-2 h-64 flex items-center justify-center overflow-hidden">
                        <img
                          src={`${API_URL}/uploads/${selectedRequest.id_image_filename}?token=${token}`}
                          alt="ID Document"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border rounded bg-gray-50 p-2 h-64 flex items-center justify-center text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
