import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Calendar, Loader } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/api/v1/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Document History</h1>
          <p className="text-gray-400 mt-1">View previously analyzed contracts and download their reports.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="mx-auto text-gray-500 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-300">No History Found</h3>
          <p className="text-gray-500">You haven't uploaded any contracts yet.</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((doc, idx) => (
            <div key={idx} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                    <FileText size={24} />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-white mb-2 truncate" title={doc.contract_name}>
                  {doc.contract_name}
                </h3>
              </div>
              <div className="mt-6 flex flex-col space-y-3">
                <a href={doc.report_url} target="_blank" rel="noreferrer" className="btn-primary flex items-center justify-center space-x-2 w-full text-sm">
                  <Download size={16} />
                  <span>Report PDF</span>
                </a>
                <a href={doc.contract_url} target="_blank" rel="noreferrer" className="btn-secondary flex items-center justify-center space-x-2 w-full text-sm">
                  <Download size={16} />
                  <span>Original Doc</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
