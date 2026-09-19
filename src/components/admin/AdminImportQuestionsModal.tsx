import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Upload,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  validateQuestionImportRows,
  batchImportValidQuestions,
  type QuestionValidationRow,
} from '../../lib/adminService';

interface AdminImportQuestionsModalProps {
  onClose: () => void;
  onImported: () => void;
}

export const AdminImportQuestionsModal: React.FC<AdminImportQuestionsModalProps> = ({
  onClose,
  onImported,
}) => {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [validationResult, setValidationResult] = useState<{
    total: number;
    validCount: number;
    invalidCount: number;
    results: QuestionValidationRow[];
  } | null>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const sampleJson = `[
  {
    "questionText": "ما هي وحدة قياس الزخم الخطي في النظام الدولي للوحدات؟",
    "options": ["kg.m/s", "N.m", "J/s", "kg.m^2/s"],
    "correctAnswer": 0,
    "explanation": "الزخم الخطي p = m * v، وحدة الكتلة kg ووحدة السرعة m/s فتكون kg.m/s.",
    "difficulty": "easy",
    "points": 5,
    "subject": "physics",
    "lesson": "الزخم الخطي",
    "source": "توجيهي 2009"
  }
]`;

  const sampleCsv = `نص السؤال,الخيار أ,الخيار ب,الخيار ج,الخيار د,الإجابة الصحيحة,الشرح,الصعوبة,النقاط,المبحث,الدرس,المصدر
ما وحدة قياس الطاقة الحركية؟,الجول,النيوتن,الواط,الباسكال,أ,الطاقة تقاس بالجول في النظام الدولي,easy,5,physics,الشغل والطاقة,منهاج فلسطين`;

  const handleLoadSample = () => {
    if (format === 'json') {
      setInputText(sampleJson);
    } else {
      setInputText(sampleCsv);
    }
  };

  const handleValidate = () => {
    setParseError(null);
    setValidationResult(null);
    setImportSuccessCount(null);

    if (!inputText.trim()) {
      setParseError('يرجى لصق بيانات الأسئلة أولاً.');
      return;
    }

    try {
      let rows: any[] = [];

      if (format === 'json') {
        const parsed = JSON.parse(inputText);
        if (!Array.isArray(parsed)) {
          throw new Error('بيانات JSON يجب أن تكون مصفوفة من كائنات الأسئلة [ { ... } ].');
        }
        rows = parsed;
      } else {
        // Simple CSV parser
        const lines = inputText.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error('ملف CSV يجب أن يحتوي على سطر الترويسة وسطر واحد على الأقل من الأسئلة.');
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, any> = {};
          headers.forEach((h, hIdx) => {
            rowObj[h] = cells[hIdx] || '';
          });
          rows.push(rowObj);
        }
      }

      const validated = validateQuestionImportRows(rows);
      setValidationResult(validated);
    } catch (err: any) {
      setParseError(err.message || 'فشل قراءة وتحليل النص المدخل. تأكد من صحة التنسيق.');
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validCount === 0) return;

    setIsImporting(true);
    try {
      const validRows = validationResult.results.filter((r) => r.isValid);
      const count = await batchImportValidQuestions(validRows);
      setImportSuccessCount(count);
      onImported();
    } catch (err: any) {
      setParseError(err.message || 'حدث خطأ أثناء إدراج الأسئلة في قاعدة البيانات.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0c101c] w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                استيراد أسئلة دفعة واحدة لبنك الأسئلة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يدعم JSON و CSV مع فحص شامل للأخطاء قبل الإدراج
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {importSuccessCount !== null ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                تم الاستيراد بنجاح!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                تمت إضافة ({importSuccessCount}) سؤالاً صالحاً إلى بنك الأسئلة المركزي، وتسجيل العملية في سجل الرقابة
                (Audit Logs).
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                إغلاق والعودة للبنك
              </button>
            </div>
          ) : (
            <>
              {/* Format selection and sample loader */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('json')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      format === 'json'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    تنسيق JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('csv')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      format === 'csv'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    تنسيق CSV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  تحميل نموذج تجريبي جاهز
                </button>
              </div>

              {/* Input Area */}
              <div>
                <textarea
                  rows={8}
                  dir="ltr"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={format === 'json' ? sampleJson : sampleCsv}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111625] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Validation Summary & Table */}
              {validationResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#13192a] text-xs font-bold">
                    <span>نتائج الفحص: {validationResult.total} سؤال</span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        صالح: {validationResult.validCount}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        أخطاء: {validationResult.invalidCount}
                      </span>
                    </div>
                  </div>

                  {/* Validation items preview */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {validationResult.results.map((row) => (
                      <div
                        key={row.rowNumber}
                        className={`p-3 text-xs flex items-start justify-between gap-3 ${
                          row.isValid
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'bg-red-50/20 dark:bg-red-950/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            {row.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span>السؤال #{row.rowNumber}:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {row.questionText || 'نص مفقود'}
                            </span>
                          </div>
                          {!row.isValid && (
                            <div className="text-[11px] text-red-600 dark:text-red-400 pl-5">
                              أسباب الخطأ: {row.errors.join(' • ')}
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {row.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {importSuccessCount === null && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleValidate}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                فحص البيانات والتحقق
              </button>

              {validationResult && validationResult.validCount > 0 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isImporting ? 'جارٍ الإدراج...' : `استيراد ${validationResult.validCount} سؤال معتمد`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
