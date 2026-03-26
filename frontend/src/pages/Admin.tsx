import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lenelLevels, setLenelLevels] = useState<any[]>([]);
  const [localLevels, setLocalLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Management state
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });

  // Manual Access Level state
  const [manualLevel, setManualLevel] = useState({ lenel_id: '', name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lenelRes, localRes, userRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/lenel-access-levels`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/access-levels`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/users`)
      ]);
      setLenelLevels(lenelRes.data);
      setLocalLevels(localRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const importLevel = async (level: any) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/access-levels`, level);
      fetchData(); // Refresh lists
    } catch (err) {
      alert('Failed to import or already exists');
    }
  };

  const handleManualLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/access-levels`, manualLevel);
      setManualLevel({ lenel_id: '', name: '', description: '' });
      fetchData(); // Refresh list
    } catch (err) {
      alert('Failed to save manual access level (Lenel ID might already exist)');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, newUser);
      setNewUser({ username: '', password: '', role: 'operator' });
      fetchData();
    } catch (err) {
      alert('Failed to create user (username might exist)');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>Loading Admin Setup...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Setup & Config</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/history')} className="px-4 py-2 bg-blue-100 text-blue-800 rounded">View History</button>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded">Logout ({user?.username})</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lenel Setup Section */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Lenel Access Levels Setup</h2>
          <p className="text-sm text-gray-500 mb-4">Select levels fetched from Lenel to make them permanently available to Operators.</p>

          <div className="space-y-4">
            {lenelLevels.map(level => {
              const isImported = localLevels.some(l => l.lenel_id === level.lenel_id);
              return (
                <div key={level.lenel_id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-semibold">{level.name}</span>
                    <span className="text-gray-500 text-sm block">{level.description} ({level.lenel_id})</span>
                  </div>
                  <button
                    disabled={isImported}
                    onClick={() => importLevel(level)}
                    className={`px-3 py-1 rounded text-sm ${isImported ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    {isImported ? 'Imported' : 'Import'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-bold mb-4">Manual Entry</h3>
            <form onSubmit={handleManualLevelSubmit} className="space-y-3 bg-gray-50 p-4 rounded border">
              <input
                placeholder="Lenel ID (e.g., LNL_999)" required
                value={manualLevel.lenel_id} onChange={e => setManualLevel({...manualLevel, lenel_id: e.target.value})}
                className="border p-2 rounded w-full"
              />
              <input
                placeholder="Level Name (e.g., Guest Access)" required
                value={manualLevel.name} onChange={e => setManualLevel({...manualLevel, name: e.target.value})}
                className="border p-2 rounded w-full"
              />
              <input
                placeholder="Description (Optional)"
                value={manualLevel.description} onChange={e => setManualLevel({...manualLevel, description: e.target.value})}
                className="border p-2 rounded w-full"
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save Manually</button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-bold mb-2">Currently Active Levels (Visible to Operator)</h3>
            <ul className="list-disc pl-5">
              {localLevels.map(l => (
                <li key={l.lenel_id}>{l.name} - {l.lenel_id}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <form onSubmit={handleCreateUser} className="mb-6 bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold mb-3">Create New User</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                placeholder="Username" required
                value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                type="password" placeholder="Password" required
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="border p-2 rounded"
              />
              <select
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                className="border p-2 rounded col-span-2"
              >
                <option value="operator">Operator (Front Desk)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add User</button>
          </form>

          <h3 className="font-bold mb-2">Existing Users</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2">Username</th>
                <th className="p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}