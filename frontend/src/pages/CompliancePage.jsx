

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function CompliancePage() {
  const [reportData, setReportData] = useState(null);
  const [reportUrl, setReportUrl] = useState('');

  useEffect(() => {
    const dataStr = localStorage.getItem('latestReport');
    const url = localStorage.getItem('latestReportUrl');

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
    if (url) {
      setReportUrl(url);
    }
  }, []);

  const getRiskColor = (risk) => {
    const baseRisk = typeof risk === 'string' ? risk.replace(' Risk', '') : risk;
    switch (baseRisk) {
      case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getRiskIcon = (risk) => {
    const baseRisk = typeof risk === 'string' ? risk.replace(' Risk', '') : risk;
    switch (baseRisk) {
      case 'High': return <AlertTriangle size={18} />;
      case 'Medium': return <Info size={18} />;
      case 'Low': return <CheckCircle size={18} />;
      default: return null;
    }
  };

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Info size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-300">No Analysis Available</h2>
        <p className="text-gray-500 mt-2">Please upload a contract to view its compliance status.</p>
        <a href="/upload" className="btn-primary mt-6">Go to Upload</a>
      </div>
    );
  }

  const overallScore = reportData.overall_score || 0;
  const clauses = reportData.clauses || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Compliance Status</h1>
          <p className="text-gray-400 mt-1">Review the AI-generated risk assessment for each clause.</p>
        </div>

        {reportUrl && (
          <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center space-x-2 self-start md:self-auto">
            <Download size={18} />
            <span>Download PDF Report</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card col-span-1 md:col-span-1 flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-300">Overall Score</h3>
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-dark-700" />
              <circle
                cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={`${overallScore * 2.51} 251`}
                className={`transition-all duration-1000 ${overallScore > 80 ? 'text-green-500' : overallScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{overallScore}</span>
            </div>
          </div>
          <p className="text-sm text-gray-400">Score based on {clauses.length} analyzed clauses</p>
        </div>

        <div className="card col-span-1 md:col-span-2">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-4">Clause Breakdown</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {clauses.map((clause, idx) => (
              <div key={idx} className="bg-dark-900 border border-gray-800 rounded-lg p-4 transition-all hover:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{clause.title}</h4>
                  <span className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${getRiskColor(clause.risk)}`}>
                    {getRiskIcon(clause.risk)}
                    <span>{clause.risk === 'No Risk' || clause.risk?.endsWith('Risk') ? clause.risk : `${clause.risk} Risk`}</span>
                  </span>
                </div>
                <div className="p-3 bg-dark-800 rounded-md mt-3 border border-gray-800/50">
                  <p className="text-sm text-gray-300"><strong>Status:</strong> {clause.status}</p>
                  <p className="text-sm text-gray-400 mt-2">{clause.explanation}</p>
                  {clause.quote && (
                    <div className="mt-3 p-3 bg-dark-900 border-l-2 border-primary-500 rounded text-sm text-gray-400 italic">
                      "{clause.quote}"
                    </div>
                  )}
                </div>
              </div>
            ))}
            {clauses.length === 0 && (
              <p className="text-gray-500 text-center py-4">No clauses extracted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
