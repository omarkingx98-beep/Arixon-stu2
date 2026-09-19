import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { fetchAnnouncements, saveAnnouncement } from '../../lib/adminService';
import { safeFormatDateTime } from '../../lib/dateUtils';
import type { Announcement } from '../../types';

export const AdminAnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setPriority('medium');
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setPriority(ann.priority || 'medium');
    setPublished(ann.published);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('يرجى كتابة عنوان ونص الإعلان.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveAnnouncement({
        id: editingAnn?.id,
        title: title.trim(),
        content: content.trim(),
        priority,
        published,
        createdAt: editingAnn?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: published ? new Date().toISOString() : null,
        createdBy: editingAnn?.createdBy || 'admin',
      });

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الإعلان.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (ann: Announcement) => {
    try {
      await saveAnnouncement({
        ...ann,
        published: !ann.published,
        publishedAt: !ann.published ? new Date().toISOString() : null,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة الإعلان.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>إدارة الإعلانات والتعميمات</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            نشر التنبيهات المباشرة، مواعيد الامتحانات، وإعلانات المنهاج الفلسطيني
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء إعلان جديد</span>
        </button>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          جارٍ تحميل الإعلانات...
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-2">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لا توجد إعلانات منشورة حالياً
          </h3>
          <p className="text-xs text-slate-400">
            يمكنك نشر أول إعلان أو توجيه للطلبة ليظهر في شاشاتهم الرئيسية.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>نشر أول إعلان الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ann.priority === 'high'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200'
                        : ann.priority === 'medium'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200'
                    }`}
                  >
                    {ann.priority === 'high' ? 'هام وعاجل' : ann.priority === 'medium' ? 'متوسط' : 'عادي'}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ann.published
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {ann.published ? 'منشور للطلبة' : 'مسودة غير منشورة'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(ann)}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    {ann.published ? 'إلغاء النشر' : 'نشر الآن'}
                  </button>
                  <button
                    onClick={() => openEditModal(ann)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span>تاريخ الإنشاء: {safeFormatDateTime(ann.createdAt, 'ar-EG')}</span>
                <span>بواسطة: المشرف العام</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingAnn ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  عنوان الإعلان *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: إطلاق مسابقة الفيزياء الأسبوعية - جوائز ونقاط إضافية"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  نص الإعلان والتفاصيل *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب التوجيهات والتفاصيل التي ستظهر للطلبة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    درجة الأهمية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                  >
                    <option value="low">عادي</option>
                    <option value="medium">متوسط</option>
                    <option value="high">هام وعاجل</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="ann_pub"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                  <label
                    htmlFor="ann_pub"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    نشر الإعلان فوراً للطلبة
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ الإعلان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
