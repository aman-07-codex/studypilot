import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Loader2, AlertCircle, Calendar, Clock, Brain } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { ExamWithSubject, Subject } from '../shared/types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function Exams() {
  const navigate = useNavigate();
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

  const openEditModal = (exam: ExamWithSubject, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingExam(exam);
    // Format date for datetime-local input
    const d = new Date(exam.exam_date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setFormData({ subject_id: exam.subject_id, exam_date: localISOTime, notes: exam.notes || '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this exam? Study plans associated with it will also be deleted.')) return;
    
    try {
      await fetchWithAuth(`/api/exams/${id}`, { method: 'DELETE' });
      setExams(exams.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam');
    }
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

      const payload = {
        subject_id: formData.subject_id,
        exam_date: new Date(formData.exam_date).toISOString(),
        notes: formData.notes
      };

      if (editingExam) {
        const updated = await fetchWithAuth(`/api/exams/${editingExam.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setExams(exams.map(ex => ex.id === updated.id ? { ...updated, subject: subjects.find(s => s.id === updated.subject_id) } : ex));
      } else {
        const created = await fetchWithAuth('/api/exams', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setExams([...exams, { ...created, subject: subjects.find(s => s.id === created.subject_id) }]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save exam');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  // Sort exams by date ascending
  const sortedExams = [...exams].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-2">Manage your exams and generate AI study plans.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </Button>
      </div>

      {error && (
        <Card className="border-danger/20 bg-danger/5">
          <CardContent className="p-4 flex items-center text-sm text-danger">
            <AlertCircle className="mr-3 h-5 w-5" />
            <span className="flex-1 font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="p-16 text-center text-muted-foreground">
            <p className="mb-4">You need to create a subject before adding an exam.</p>
            <Button onClick={() => navigate('/subjects')}>Go to Subjects</Button>
          </CardContent>
        </Card>
      ) : sortedExams.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="p-5 bg-surface rounded-full shadow-sm mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No exams scheduled</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Schedule your first exam to generate an AI-powered study plan tailored to your timeline.
            </p>
            <Button onClick={openAddModal} className="mt-8" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Schedule Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedExams.map(exam => {
            const dateObj = new Date(exam.exam_date);
            const now = new Date();
            const isPast = dateObj.getTime() < now.getTime();
            
            return (
              <Card key={exam.id} className={`flex flex-col h-full hover:border-primary/30 transition-all ${isPast ? 'opacity-70 grayscale-[30%]' : 'hover:shadow-md'}`}>
                <CardContent className="p-6 h-full flex flex-col relative">
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => openEditModal(exam, e)}
                      className="p-1.5 text-muted-foreground hover:text-foreground bg-surface-hover/80 hover:bg-surface-hover rounded-md transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(exam.id, e)}
                      className="p-1.5 text-muted-foreground hover:text-danger bg-surface-hover/80 hover:bg-danger/10 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 mb-4 pr-16">
                    <div 
                      className="h-4 w-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: exam.subject.color_code || 'var(--primary)' }}
                    />
                    <h3 className="font-bold text-lg truncate text-foreground">{exam.subject.name}</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm font-medium text-muted-foreground bg-surface-hover/50 px-3 py-2 rounded-lg border">
                      <Calendar className="w-4 h-4 mr-3 shrink-0 text-foreground" />
                      <span className={isPast ? 'line-through' : ''}>
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-muted-foreground bg-surface-hover/50 px-3 py-2 rounded-lg border">
                      <Clock className="w-4 h-4 mr-3 shrink-0 text-foreground" />
                      <span className={isPast ? 'line-through' : ''}>
                        {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {exam.notes && (
                      <div className="text-sm text-muted-foreground mt-4 italic border-l-2 border-border pl-3">
                        {exam.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-border">
                    <Link to={`/exams/${exam.id}/plan`}>
                      <Button variant="outline" className="w-full font-medium hover:border-primary/50 hover:bg-primary/5">
                        <Brain className="w-4 h-4 mr-2 text-primary" />
                        AI Study Plan
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingExam ? 'Edit Exam' : 'Schedule Exam'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 rounded-md bg-danger/10 text-danger text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {formError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject</label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                    className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="" disabled>Select a subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date & Time</label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.exam_date}
                    onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="E.g. Midterm covering chapters 1-5"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={formLoading}>
                  {editingExam ? 'Save Changes' : 'Schedule Exam'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
