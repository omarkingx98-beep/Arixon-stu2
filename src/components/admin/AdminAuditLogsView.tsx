import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Clock,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { fetchAuditLogs } from '../../lib/adminService';
import { safeFormatDateTime } from '../../lib/dateUtils';
import type { AdminAuditLog } from '../../types';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const exportLogsCsv = () => {
    if (logs.length === 0) return;
    const header = ['المعرف', 'المشرف', 'البريد', 'النوع', 'الهدف', 'التفاصيل', 'التاريخ والوقت'];
    const rows = logs.map((l) => [
      l.id,
      l.adminName,
      l.adminEmail,
      l.action,
      l.targetType,
      `"${l.details.replace(/"/g, '""')}"`,
      safeFormatDateTime(l.timestamp, 'ar-EG'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سجل_العمليات_الإدارية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = logs.filter((l) => {
    if (selectedTarget !== 'all' && l.targetType !== selectedTarget) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const matchDetails = l.details.toLowerCase().includes(term);
      const matchAdmin = l.adminName.toLowerCase().includes(term);
      const matchAction = l.action.toLowerCase().includes(term);
      if (!matchDetails && !matchAdmin && !matchAction) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>سجل الرقابة والعمليات الإدارية (Audit Logs)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل غير قابل للتعديل أو الحذف (Append-Only) يوثق كل إجراء إداري، تعديل نقاط، أو تغيير في المنظومة
          </p>
        </div>

        <button
          onClick={exportLogsCsv}
          disabled={logs.length === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجل CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0c101c] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في تفاصيل الإجراء أو اسم المشرف..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden"
          />
        </div>

        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
        >
          <option value="all">جميع الأنواع</option>
          <option value="exam">الامتحانات (Exam)</option>
          <option value="question">الأسئلة (Question)</option>
          <option value="student">الطلاب والنقاط (Student)</option>
          <option value="announcement">الإعلانات (Announcement)</option>
          <option value="challenge">التحديات (Challenge)</option>
          <option value="settings">الإعدادات (Settings)</option>
        </select>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          جارٍ تحميل سجل الرقابة...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لا توجد سجلات تطابق البحث
          </h3>
          <p className="text-xs text-slate-400">
            تُسجل كل العمليات والإجراءات فور حدوثها في قاعدة البيانات تلقائياً.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#111625] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">نوع الإجراء</th>
                  <th className="p-4">التفاصيل</th>
                  <th className="p-4">المشرف المنفذ</th>
                  <th className="p-4">الهدف والمعرف</th>
                  <th className="p-4">التوقيت والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs sm:max-w-md truncate">
                      {log.details}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {log.adminName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.adminEmail}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="text-[10px] font-mono text-slate-500">
                        {log.targetType}:{log.targetId.slice(0, 12)}
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {safeFormatDateTime(log.timestamp, 'ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                تفاصيل العملية الرقابية #{selectedLog.id}
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#13192a] space-y-1">
                <span className="text-[10px] text-slate-400 block">نص الإجراء:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">المشرف المسؤول:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.adminName}</div>
                  <div className="text-[10px] text-slate-400">{selectedLog.adminEmail}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">نوع العملية:</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLog.action}</div>
                  <div className="text-[10px] text-slate-400">{selectedLog.targetType}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">المعرف المستهدف (Target ID):</span>
                <code className="text-xs font-mono text-blue-600 dark:text-blue-400 break-all">
                  {selectedLog.targetId}
                </code>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">التوقيت الدقيق:</span>
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {selectedLog.timestamp}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
