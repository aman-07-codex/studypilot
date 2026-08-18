import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { Subject, Topic } from '../shared/types';
import { MaterialManager } from '../components/MaterialManager';

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [subjectData, topicsData] = await Promise.all([
        fetchWithAuth(`/api/subjects/${subjectId}`),
        fetchWithAuth(`/api/subjects/${subjectId}/topics`)
      ]);

      setSubject(subjectData);
      setTopics(topicsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !subjectId) return;

    try {
      setAddLoading(true);
      const newTopic = await fetchWithAuth(`/api/subjects/${subjectId}/topics`, {
        method: 'POST',
        body: JSON.stringify({ name: newTopicName }),
      });
      
      setTopics([...topics, newTopic]);
      setNewTopicName('');
      setIsAddingTopic(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add topic');
    } finally {
      setAddLoading(false);
    }
  };

  const toggleTopicCompletion = async (topic: Topic) => {
    try {
      // Optimistic update
      const updatedTopics = topics.map(t => 
        t.id === topic.id ? { ...t, is_completed: !t.is_completed } : t
      );
      setTopics(updatedTopics);

      await fetchWithAuth(`/api/topics/${topic.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !topic.is_completed }),
      });
    } catch (err: any) {
      // Revert on error
      const revertedTopics = topics.map(t => 
        t.id === topic.id ? { ...t, is_completed: topic.is_completed } : t
      );
      setTopics(revertedTopics);
      alert(err.message || 'Failed to update topic');
    }
  };

  const handleDeleteTopic = async (topicId: string, topicName: string) => {
    if (!window.confirm(`Delete topic "${topicName}"?`)) return;
    
    try {
      await fetchWithAuth(`/api/topics/${topicId}`, { method: 'DELETE' });
      setTopics(topics.filter(t => t.id !== topicId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete topic');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/subjects')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Subjects
        </button>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error || 'Subject not found'}
        </div>
      </div>
    );
  }

  const completedCount = topics.filter(t => t.is_completed).length;
  const totalCount = topics.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/subjects')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Subjects
      </button>

      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="h-6 w-6 rounded-md"
              style={{ backgroundColor: subject.color_code || '#3b82f6' }}
            />
            <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Course Progress</span>
            <span className="font-bold text-gray-900">{percentage}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: subject.color_code || '#3b82f6' }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {completedCount} of {totalCount} topics completed
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
          {!isAddingTopic && (
            <button
              onClick={() => setIsAddingTopic(true)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Topic
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {isAddingTopic && (
            <div className="p-4 bg-blue-50/50">
              <form onSubmit={handleAddTopic} className="flex items-center gap-3">
                <input
                  type="text"
                  autoFocus
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Enter topic name..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={addLoading}
                />
                <button
                  type="submit"
                  disabled={!newTopicName.trim() || addLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(false)}
                  disabled={addLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {topics.length === 0 && !isAddingTopic ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No topics added yet. Break down your subject into smaller topics to track progress!
            </div>
          ) : (
            topics.map((topic) => (
              <div key={topic.id} className="divide-y divide-gray-50 border-b border-gray-100 last:border-0">
                <div className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-center space-x-4 flex-1">
                    <button
                      onClick={() => toggleTopicCompletion(topic)}
                      className={`focus:outline-none transition-colors ${
                        topic.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'
                      }`}
                    >
                      {topic.is_completed ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                    <span className={`text-sm font-medium transition-colors ${
                      topic.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}>
                      {topic.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50 flex items-center space-x-1"
                      title="Notes"
                    >
                      <span className="text-xs font-medium mr-1">Notes</span>
                      {expandedTopicId === topic.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id, topic.name)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all rounded-md hover:bg-red-50"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {expandedTopicId === topic.id && (
                  <div className="p-4 bg-gray-50/50">
                    <MaterialManager 
                      subjectId={subject.id} 
                      topicId={topic.id} 
                      materialType="note" 
                      title={`${topic.name} Notes`} 
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* PYQs Section */}
      <div className="mt-8">
        <MaterialManager 
          subjectId={subject.id} 
          materialType="pyq" 
          title="Subject PYQs (Previous Year Questions)" 
        />
      </div>
    </div>
  );
}
