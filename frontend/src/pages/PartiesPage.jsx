import React, { useState, useEffect } from 'react';
import { Building2, UserCircle, Phone, Mail, MapPin, Info } from 'lucide-react';

// Determine API base dynamically
const API_BASE = import.meta.env.VITE_API_URL || "";  // empty string = same origin

export default function PartiesPage() {
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const dataStr = localStorage.getItem('latestReport');
    if (dataStr) {
      try {
        let parsedStr = dataStr;
        if (typeof dataStr === 'string' && dataStr.startsWith('```json')) {
          parsedStr = dataStr.replace(/```json\n?/, '').replace(/```$/, '').trim();
        }
        setReportData(JSON.parse(parsedStr));
      } catch (err) {
        console.error("Failed to parse report data", err);
      }
    }
  }, []);

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Info size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-300">No Analysis Available</h2>
        <p className="text-gray-500 mt-2">Please upload a contract to view its extracted parties.</p>
        <a href="/upload" className="btn-primary mt-6">Go to Upload</a>
      </div>
    );
  }

  const parties = reportData.parties || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Involved Parties</h1>
        <p className="text-gray-400 mt-1">AI-extracted entities and contacts from the document.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parties.map((party, idx) => (
          <div key={idx} className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

            <div className="flex items-start justify-between mb-6 border-b border-gray-700/50 pb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-dark-700 rounded-lg text-primary-400 border border-gray-600 shadow-inner">
                  {party.type === 'Company' ? <Building2 size={24} /> : <UserCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{party.name || 'Unknown Entity'}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-dark-900 border border-gray-600 text-gray-300">
                    {party.role || 'Party'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {party.contact && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <UserCircle size={18} className="text-gray-500" />
                  <span>{party.contact}</span>
                </div>
              )}
              {party.email && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail size={18} className="text-gray-500" />
                  <a href={`mailto:${party.email}`} className="hover:text-primary-400 transition-colors">{party.email}</a>
                </div>
              )}
              {party.phone && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone size={18} className="text-gray-500" />
                  <span>{party.phone}</span>
                </div>
              )}
              {party.address && (
                <div className="flex items-start space-x-3 text-gray-300 bg-dark-900/50 p-3 rounded-lg border border-gray-800">
                  <MapPin size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{party.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {parties.length === 0 && (
          <p className="text-gray-500">No parties could be extracted from this contract.</p>
        )}
      </div>
    </div>
  );
}
