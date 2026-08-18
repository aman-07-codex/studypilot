import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Plus, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { Subject } from '../shared/types';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({ name: '', color_code: '#3b82f6' });
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
    setFormData({ name: '', color_code: '#3b82f6' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, color_code: subject.color_code || '#3b82f6' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Subject name is required');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      if (editingSubject) {
        await fetchWithAuth(`/api/subjects/${editingSubject.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchWithAuth('/api/subjects', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      await loadSubjects();
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated topics.`)) {
      return;
    }
    try {
      await fetchWithAuth(`/api/subjects/${id}`, { method: 'DELETE' });
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
        <button
          onClick={openAddModal}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      {subjects.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Book className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No subjects yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding a subject you are currently studying.
          </p>
          <button
            onClick={openAddModal}
            className="mt-6 inline-flex items-center rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const total = subject.total_topics || 0;
            const completed = subject.completed_topics || 0;
            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

            return (
              <div
                key={subject.id}
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: subject.color_code || '#3b82f6' }}
                    />
                    <h3 className="font-semibold text-gray-900 truncate max-w-[150px]" title={subject.name}>{subject.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Edit subject"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id, subject.name)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete subject"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: subject.color_code || '#3b82f6' }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {completed} of {total} topics completed
                  </div>
                </div>

                <Link
                  to={`/subjects/${subject.id}`}
                  className="mt-6 flex w-full items-center justify-center rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Open Subject
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h3>
            
            {formError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Biology 101"
                  required
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Color Theme
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    type="color"
                    id="color"
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="h-8 w-8 cursor-pointer rounded border border-gray-300 p-0"
                  />
                  <span className="text-sm text-gray-500">{formData.color_code}</span>
                </div>
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
