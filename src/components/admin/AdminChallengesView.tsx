import React, { useState, useEffect } from 'react';
import {
  Swords,
  Plus,
  Calendar,
  Award,
  Edit3,
  Clock,
  CheckCircle2,
  X,
  BookOpen,
} from 'lucide-react';
import { fetchChallenges, saveChallenge, fetchAllAdminExams } from '../../lib/adminService';
import { safeFormatDate } from '../../lib/dateUtils';
import type { Challenge, Exam, SubjectId } from '../../types';

export const AdminChallengesView: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<SubjectId>('physics');
  const [points, setPoints] = useState<number>(50);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'active' | 'ended' | 'archived'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, eList] = await Promise.all([
        fetchChallenges(),
        fetchAllAdminExams(),
      ]);
      setChallenges(cList);
      setExams(eList);
    } catch (err) {
      console.error('Error loading challenges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingChallenge(null);
    setTitle('');
    setDescription('');
    setSubject('physics');
    setPoints(50);
    const today = new Date().toISOString().split('T')[0];
    setStartAt(today);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEndAt(nextWeek);
    setSelectedExamId('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Challenge) => {
    setEditingChallenge(c);
    setTitle(c.title);
    setDescription(c.description);
    setSubject(c.subject);
    setPoints(c.points);
    setStartAt(c.startAt ? c.startAt.split('T')[0] : '');
    setEndAt(c.endAt ? c.endAt.split('T')[0] : '');
    setSelectedExamId(c.examIds?.[0] || '');
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('يرجى كتابة عنوان ووصف التحدي.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveChallenge({
        id: editingChallenge?.id,
        title: title.trim(),
        description: description.trim(),
        subject,
        points: Number(points) || 50,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        examIds: selectedExamId ? [selectedExamId] : [],
        status,
        createdAt: editingChallenge?.createdAt || new Date().toISOString(),
        createdBy: editingChallenge?.createdBy || 'admin',
      });

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التحدي.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-indigo-500" />
            <span>إدارة التحديات التنافسية</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إنشاء تحديات ذات نقاط مضاعفة ومواعيد زمنية محددة لتحفيز المنافسة الشريفة
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء تحدٍّ جديد</span>
        </button>
      </div>

      {/* Challenges Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          جارٍ تحميل التحديات...
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-2">
          <Swords className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لا توجد تحديات تنافسية حالياً
          </h3>
          <p className="text-xs text-slate-400">
            أطلق أول تحدٍّ تشجيعي مع جوائز نقاط إضافية لطلاب توجيهي 2009.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>إطلاق أول تحدٍّ الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                        : c.status === 'upcoming'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.status === 'active'
                      ? 'نشط حالياً'
                      : c.status === 'upcoming'
                      ? 'قادم قريباً'
                      : 'منتهي'}
                  </span>

                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>+{c.points} نقطة مكافأة</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {c.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#13192a] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ينتهي في: {safeFormatDate(c.endAt, 'ar-EG')}</span>
                  </div>
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                {editingChallenge ? 'تعديل التحدي' : 'إنشاء تحدٍّ تنافسي جديد'}
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
                  عنوان التحدي *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ماراثون كولوم والمجال الكهربائي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  وصف التحدي وقواعد المشاركة *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: أحرز علامة 90% فما فوق في الامتحان المحدد لتحصل على 50 نقطة فورية!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    المبحث
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectId)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                  >
                    <option value="physics">الفيزياء</option>
                    <option value="math">الرياضيات</option>
                    <option value="arabic">اللغة العربية</option>
                    <option value="chemistry">الكيمياء</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    نقاط المكافأة
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    تاريخ البداية
                  </label>
                  <input
                    type="date"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    تاريخ النهاية
                  </label>
                  <input
                    type="date"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ربط بامتحان محدد (اختياري)
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                >
                  <option value="">بدون ربط امتحان محدد (عام)</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subjectNameAr})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التحدي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
