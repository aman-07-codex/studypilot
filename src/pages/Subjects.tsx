import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Plus, Trash2, Edit2, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { Subject } from '../shared/types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({ name: '', color_code: '#4f46e5' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth('/api/subjects');
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', color_code: '#4f46e5' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingSubject(subject);
    setFormData({ name: subject.name, color_code: subject.color_code || '#4f46e5' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this subject and all its topics?')) return;
    
    try {
      await fetchWithAuth(`/api/subjects/${id}`, { method: 'DELETE' });
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      if (editingSubject) {
        const updated = await fetchWithAuth(`/api/subjects/${editingSubject.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await fetchWithAuth('/api/subjects', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setSubjects([...subjects, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save subject');
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-2">Manage your academic courses and curriculum.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
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
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="p-5 bg-surface rounded-full shadow-sm mb-6">
              <Book className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Your workspace is empty</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Create your first subject to start organizing your study materials, topics, and exams.
            </p>
            <Button onClick={openAddModal} className="mt-8" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create First Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map(subject => (
            <Link key={subject.id} to={`/subjects/${subject.id}`} className="block group">
              <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm text-white"
                        style={{ backgroundColor: subject.color_code || 'var(--primary)' }}
                      >
                        <Book className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {subject.name}
                      </h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => openEditModal(subject, e)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
                        aria-label="Edit subject"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(subject.id, e)}
                        className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                        aria-label="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">{subject.total_topics || 0}</span> topics
                    </div>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                      View details <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingSubject ? 'Edit Subject' : 'New Subject'}
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
                  <label className="block text-sm font-medium mb-1.5">Subject Name</label>
                  <Input
                    autoFocus
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Computer Science 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Color Theme</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color_code}
                      onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                      className="h-10 w-16 p-1 rounded cursor-pointer border border-border bg-background"
                    />
                    <Input
                      type="text"
                      value={formData.color_code}
                      onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                      placeholder="#000000"
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={formLoading}>
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
