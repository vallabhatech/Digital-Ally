import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface AbuseReport {
  id: string;
  timestamp: string;
  reporterIp: string;
  reason: string;
  content: string;
}

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/abuse/reports', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          setReports(data.reports);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800">Admin Moderation Dashboard</h2>
        <p className="mt-4 text-lg text-gray-600">Review and moderate user abuse reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-2xl font-bold mb-4">Abuse Reports</h3>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">No abuse reports at this time.</p>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="p-4 border rounded-lg bg-red-50 border-red-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-red-800">{report.reason}</span>
                  <span className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 font-mono bg-white p-2 border rounded">
                  {report.content}
                </p>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>Reporter IP: {report.reporterIp}</span>
                  <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                    Block User/IP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
