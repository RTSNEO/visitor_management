import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, PlusCircle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function Employee() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'new'>('requests');
  const [requests, setRequests] = useState<any[]>([]);


  // New Request State
  const [file, setFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Permit Form State
  const [creatingPermitFor, setCreatingPermitFor] = useState<any>(null);
  const [permitData, setPermitData] = useState({
    purpose_of_visit: '',
    start_time: '',
    end_time: '',
    selected_access_level_id: '',
    office_branch: 'القاهرة',
    guest_of: user?.username || ''
  });
  const [accessLevels, setAccessLevels] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
    fetchAccessLevels();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-approvals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccessLevels = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/access-levels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessLevels(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setScanning(true);
    setMessage(null);
    setOcrData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOcrData(res.data.data);
        setMessage({ type: 'success', text: 'ID Scanned successfully. Please verify the extracted data.' });
      } else {
        setMessage({ type: 'error', text: 'Scan failed.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Scan error.' });
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitPreApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !ocrData) return;
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('national_id', ocrData.national_id);
    formData.append('name', ocrData.name);
    formData.append('address', ocrData.address || '');
    formData.append('date_of_birth', ocrData.date_of_birth || '');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-approvals`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Pre-Approval Request submitted successfully!' });
      setOcrData(null);
      setFile(null);
      fetchRequests();
      setActiveTab('requests');
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePermit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: creatingPermitFor.name,
        national_id: creatingPermitFor.national_id,
        address: creatingPermitFor.address,
        date_of_birth: creatingPermitFor.date_of_birth,
        guest_of: permitData.guest_of,
        office_branch: permitData.office_branch,
        purpose_of_visit: permitData.purpose_of_visit,
        start_time: new Date(permitData.start_time).toISOString(),
        end_time: new Date(permitData.end_time).toISOString(),
        selected_access_level_id: permitData.selected_access_level_id
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/visitors`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the pre-approval status to permit_created
      const statusData = new FormData();
      statusData.append('status', 'permit_created');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/pre-approvals/${creatingPermitFor.id}/status`, statusData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();

      setMessage({ type: 'success', text: 'Permit created and card assigned successfully!' });
      setCreatingPermitFor(null);
      // We could also update the pre-approval status to "permit_created" if we wanted,
      // but keeping it simple for now.
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create permit.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-gray-600">Employee Dashboard: {user?.username}</span>
          <button onClick={() => navigate('/history')} className="text-blue-600 hover:underline text-sm">View History</button>
          <button onClick={logout} className="text-red-600 hover:underline text-sm">Logout</button>
        </div>
        <LanguageToggle />
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 text-center font-medium ${activeTab === 'requests' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-4 text-center font-medium ${activeTab === 'new' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <PlusCircle size={18} /> New Request
              </div>
            </button>
          </div>

          <div className="p-6">
            {message && (
              <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'new' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Upload Egyptian National ID</h2>

                {!ocrData ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow transition">
                      {scanning ? 'Scanning...' : 'Select Image File'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleScan} disabled={scanning} />
                    </label>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPreApproval} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded mb-6">
                      <p className="text-sm text-blue-800 mb-2">Review and correct the extracted information before submitting for security approval.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">National ID</label>
                          <input type="text" value={ocrData.national_id} onChange={(e) => setOcrData({...ocrData, national_id: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input type="text" value={ocrData.name} onChange={(e) => setOcrData({...ocrData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <input type="text" value={ocrData.address || ''} onChange={(e) => setOcrData({...ocrData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input type="date" value={ocrData.date_of_birth || ''} onChange={(e) => setOcrData({...ocrData, date_of_birth: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="submit" disabled={submitting} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <button type="button" onClick={() => {setOcrData(null); setFile(null);}} className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'requests' && !creatingPermitFor && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map(req => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.national_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {req.status === 'pending' && <span className="flex items-center gap-1 text-yellow-600"><Clock size={16}/> Pending</span>}
                          {req.status === 'approved' && <span className="flex items-center gap-1 text-green-600"><CheckCircle size={16}/> Approved</span>}
                          {req.status === 'rejected' && <span className="flex items-center gap-1 text-red-600"><XCircle size={16}/> Rejected</span>}
                          {req.status === 'permit_created' && <span className="flex items-center gap-1 text-purple-600"><CheckCircle size={16}/> Permit Created</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {req.status === 'approved' && (
                            <button
                              onClick={() => setCreatingPermitFor(req)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 justify-end w-full"
                            >
                              <FileText size={16} /> Create Permit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'requests' && creatingPermitFor && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Create Permit for {creatingPermitFor.name}</h2>
                  <button onClick={() => setCreatingPermitFor(null)} className="text-gray-500 hover:underline">Back to List</button>
                </div>

                <form onSubmit={handleCreatePermit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                      <input type="datetime-local" required value={permitData.start_time} onChange={e => setPermitData({...permitData, start_time: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time *</label>
                      <input type="datetime-local" required value={permitData.end_time} onChange={e => setPermitData({...permitData, end_time: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purpose of Visit *</label>
                      <input type="text" required value={permitData.purpose_of_visit} onChange={e => setPermitData({...permitData, purpose_of_visit: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office Branch *</label>
                      <input type="text" required value={permitData.office_branch} onChange={e => setPermitData({...permitData, office_branch: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guest Of *</label>
                      <input type="text" required value={permitData.guest_of} onChange={e => setPermitData({...permitData, guest_of: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Access Level *</label>
                      <select required value={permitData.selected_access_level_id} onChange={e => setPermitData({...permitData, selected_access_level_id: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded p-2">
                        <option value="" disabled>Select Access Level</option>
                        {accessLevels.map(lvl => (
                          <option key={lvl.id} value={lvl.lenel_id}>{lvl.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 border-t pt-4">
                    <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                      {submitting ? 'Creating...' : 'Create Permit & Issue Card'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
