import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50; // Optimized pagination for scaling to 100k
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [page, search]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const skip = page * limit;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/visitors/history?skip=${skip}&limit=${limit}&search=${search}`);
      setHistory(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset pagination on new search
    fetchHistory();
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Historical Visits</h1>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Back to Dashboard</button>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="Search by Name, National ID, Guest, Office Branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border p-2 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Search</button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Date</th>
              <th className="p-3">Name</th>
              <th className="p-3">National ID</th>
              <th className="p-3">Guest Of</th>
              <th className="p-3">Office Branch</th>
              <th className="p-3">Lenel Sync</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">No visitors found.</td></tr>
            ) : (
              history.map(visitor => (
                <tr key={visitor.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(visitor.created_at).toLocaleString()}</td>
                  <td className="p-3">{visitor.name}</td>
                  <td className="p-3">{visitor.national_id}</td>
                  <td className="p-3">{visitor.guest_of}</td>
                  <td className="p-3">{visitor.office_branch}</td>
                  <td className="p-3">
                    {visitor.is_synchronized ?
                      <span className="text-green-600 font-bold">✓ (ID: {visitor.lenel_card_id})</span> :
                      <span className="text-red-600 font-bold">✗ Failed</span>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} records
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={(page + 1) * limit >= total}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}