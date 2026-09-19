import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Eye, 
  Clock, 
  X, 
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';
import type { DigitalLibraryItem } from '../../types/store';
import { getUserLibrary } from '../../lib/storeService';
import { useAuth } from '../../context/AuthContext';
import { formatArabicDate } from '../../lib/dateUtils';

interface StoreLibraryViewProps {
  onBrowseStore: () => void;
}

export const StoreLibraryView: React.FC<StoreLibraryViewProps> = ({ onBrowseStore }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<DigitalLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Document Reader Modal
  const [readingItem, setReadingItem] = useState<DigitalLibraryItem | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadLibrary();
    }
  }, [profile?.uid]);

  const loadLibrary = async () => {
    if (!profile?.uid) return;
    setIsLoading(true);
    try {
      const data = await getUserLibrary(profile.uid);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              مكتبتي الرقمية
            </h1>
            <p className="text-xs text-slate-500">
              كافة المذكرات ونماذج الامتحانات وباقات الشرح المفعلة في حسابك
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLibrary}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="تحديث المكتبة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onBrowseStore}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إضافة ملخصات جديدة</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      {items.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في مكتبتي الرقمية..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Library Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          جارٍ فحص الملفات الرقمية في مكتبتك...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 px-4 text-center flex flex-col items-center bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
            مكتبتك الرقمية فارغة حتى الآن
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
            عند شرائك أي دوسية أو ملخص بصيغة PDF أو باقة تعليمية وتأكيد الدفع، سيتم تفعيلها وحفظها هنا لتتمكن من دراستها وقراءتها في أي وقت ومن أي جهاز.
          </p>
          <button
            onClick={onBrowseStore}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            تصفح المتجر واقتنِ أول دوسية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              {/* Cover & Badges */}
              <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <img 
                  src={item.coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مفعل ومتاح</span>
                </div>
                {item.digitalContent?.fileFormat && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                    {item.digitalContent.fileFormat}
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                    {item.productName}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>طلب: #{item.orderNumber}</span>
                    <span>•</span>
                    <span>تاريخ الإتاحة: {formatArabicDate(item.grantedAt)}</span>
                  </div>

                  {item.digitalContent?.accessInstructionsAr && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {item.digitalContent.accessInstructionsAr}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => setReadingItem(item)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تصفح وقراءة</span>
                  </button>

                  {item.digitalContent?.downloadUrl && (
                    <a
                      href={item.digitalContent.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="تحميل الملف"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Document Reader Modal */}
      {readingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f1422] w-full max-w-4xl h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col truncate">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {readingItem.productName}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    قارئ Arixon للمستندات التعليمية
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {readingItem.digitalContent?.downloadUrl && (
                  <a
                    href={readingItem.digitalContent.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل نسخة</span>
                  </a>
                )}

                <button
                  onClick={() => setReadingItem(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-center">
              <div className="max-w-md p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {readingItem.productName}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {readingItem.digitalContent?.accessInstructionsAr || 'المستند التعليمي جاهز للمطالعة والتحميل. يمكنك فتحه في نافذة جديدة أو حفظه على هاتفك وحاسوبك للدراسة بدون إنترنت.'}
                </p>

                {readingItem.digitalContent?.downloadUrl ? (
                  <a
                    href={readingItem.digitalContent.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح الملف الرقمي الآن</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                    سيتم تزويد رابط القراءة التفاعلية المباشر من خلال أستاذ المادة.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
