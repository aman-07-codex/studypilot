import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit2, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { ExamWithSubject, Subject } from '../shared/types';

export default function Exams() {
  const [exams, setExams] = useState<ExamWithSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithSubject | null>(null);
  
  const [formData, setFormData] = useState({ subject_id: '', exam_date: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [examsData, subjectsData] = await Promise.all([
        fetchWithAuth('/api/exams'),
        fetchWithAuth('/api/subjects')
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exams data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingExam(null);
    setFormData({ subject_id: subjects.length > 0 ? subjects[0].id : '', exam_date: '', notes: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exam: ExamWithSubject) => {
    setEditingExam(exam);
    // Convert to local datetime-local format format for the input, 
    // assuming exam.exam_date is ISO. The HTML datetime-local expects "YYYY-MM-DDThh:mm"
    let formattedDate = '';
    if (exam.exam_date) {
      const d = new Date(exam.exam_date);
      // To keep it in local timezone for the input:
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      formattedDate = localISOTime;
    }
    
    setFormData({ 
      subject_id: exam.subject_id, 
      exam_date: formattedDate, 
      notes: exam.notes || '' 
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) {
      setFormError('Please select a subject');
      return;
    }
    if (!formData.exam_date) {
      setFormError('Please select an exam date');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      
      // We will just send the ISO string of the date.
      // JS Date constructor parses HTML datetime-local string nicely as local time if timezone missing.
      const payload = {
        subject_id: formData.subject_id,
        exam_date: new Date(formData.exam_date).toISOString(),
        notes: formData.notes
      };

      if (editingExam) {
        await fetchWithAuth(`/api/exams/${editingExam.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth('/api/exams', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      
      await loadData();
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save exam');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this exam?`)) {
      return;
    }
    try {
      await fetchWithAuth(`/api/exams/${id}`, { method: 'DELETE' });
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  // Helper to categorize and sort
  const categorizeExams = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: ExamWithSubject[] = [];
    const past: ExamWithSubject[] = [];

    exams.forEach(exam => {
      const examDate = new Date(exam.exam_date);
      const examDateNoTime = new Date(examDate);
      examDateNoTime.setHours(0, 0, 0, 0);

      if (examDateNoTime.getTime() >= today.getTime()) {
        upcoming.push(exam);
      } else {
        past.push(exam);
      }
    });

    // Sort upcoming ascending (closest first)
    upcoming.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    // Sort past descending (most recent past first)
    past.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());

    return { upcoming, past };
  };

  const getDaysRemainingText = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateString);
    examDate.setHours(0, 0, 0, 0);

    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `${diffDays} days remaining`;
    return "Past exam";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { upcoming, past } = categorizeExams();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500 mt-1">Manage your upcoming exams and tests.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Exam
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span className="flex-1">{error}</span>
          <button onClick={loadData} className="underline font-medium hover:text-red-800">Retry</button>
        </div>
      )}

      {exams.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No exams scheduled yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Keep track of your important dates by adding your first exam.
          </p>
          <button
            onClick={openAddModal}
            className="mt-6 inline-flex items-center rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add your first exam
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" /> Upcoming
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(exam => <ExamCard key={exam.id} exam={exam} onEdit={() => openEditModal(exam)} onDelete={() => handleDelete(exam.id)} daysRemaining={getDaysRemainingText(exam.exam_date)} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center opacity-70">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" /> Completed / Past
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                {past.map(exam => <ExamCard key={exam.id} exam={exam} onEdit={() => openEditModal(exam)} onDelete={() => handleDelete(exam.id)} daysRemaining={getDaysRemainingText(exam.exam_date)} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingExam ? 'Edit Exam' : 'Add Exam'}
            </h3>
            
            {formError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                {formError}
              </div>
            )}

            {subjects.length === 0 ? (
              <div className="mt-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                You need to create a subject before you can add an exam.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <select
                    id="subject_id"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select a subject</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exam_date" className="block text-sm font-medium text-gray-700">
                    Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="exam_date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="e.g., Chapters 1-5, Multiple choice"
                    maxLength={1000}
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={formLoading}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                  >
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingExam ? 'Save Changes' : 'Create Exam'}
                  </button>
                </div>
              </form>
            )}
            
            {subjects.length === 0 && (
               <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ExamCard: React.FC<{ exam: ExamWithSubject, onEdit: () => void, onDelete: () => void | Promise<void>, daysRemaining: string }> = ({ exam, onEdit, onDelete, daysRemaining }) => {
  const dateObj = new Date(exam.exam_date);
  const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="group relative bg-white p-5 rounded-xl shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: exam.subject.color_code || '#3b82f6' }}
          />
          <span className="text-sm font-medium text-gray-600 truncate" title={exam.subject.name}>
            {exam.subject.name}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Edit exam"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Delete exam"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex-1">
        <div className="text-xl font-bold text-gray-900 mb-1">
          {formattedDate}
        </div>
        <div className="text-sm text-gray-500 mb-3">
          at {formattedTime}
        </div>
        
        {exam.notes && (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-3">
            {exam.notes}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className={`text-sm font-medium ${
          daysRemaining.includes('remaining') || daysRemaining === 'Tomorrow' || daysRemaining === 'Today'
            ? 'text-blue-600'
            : 'text-gray-500'
        }`}>
          {daysRemaining}
        </span>
      </div>
    </div>
  );
}
