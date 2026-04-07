import React, { useState, useEffect } from 'react';
import { Calendar, FileText, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function SummaryPage() {
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
        <p className="text-gray-500 mt-2">Please upload a contract to view its summary.</p>
        <a href="/upload" className="btn-primary mt-6">Go to Upload</a>
      </div>
    );
  }

  const effectiveDate = reportData.effective_date || "Not Specified / Extracted";
  const terminationDate = reportData.termination_date || "Not Specified / Extracted";
  const summaryText = reportData.summary || "No textual summary provided.";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Document Summary</h1>
        <p className="text-gray-400 mt-1">AI-generated abstract and key dates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 border-b border-gray-700 pb-4 mb-4">
              <FileText className="text-primary-500" size={24} />
              <h2 className="text-2xl font-semibold text-white">Extracted Contract Overview</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{summaryText}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-gradient-to-b from-dark-800 to-dark-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
              <Calendar className="mr-2 text-primary-500" size={20} />
              Important Dates
            </h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-600 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-dark-700 bg-dark-800 text-gray-400 group-[.is-active]:text-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-md">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-700 bg-dark-800 shadow-md">
                  <p className="text-xs text-gray-400 mb-1">Effective Start Date</p>
                  <p className="font-semibold text-white">{effectiveDate}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-dark-700 bg-dark-800 text-gray-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-md">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-700 bg-dark-800 shadow-md">
                  <p className="text-xs text-gray-400 mb-1">Termination / End Date</p>
                  <p className="font-semibold text-white">{terminationDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
