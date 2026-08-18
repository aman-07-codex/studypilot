import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Circle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { Subject, Topic } from '../shared/types';
import { MaterialManager } from '../components/MaterialManager';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

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
    if (subjectId) loadData();
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
    if (!newTopicName.trim()) return;

    try {
      setAddLoading(true);
      const created = await fetchWithAuth(`/api/subjects/${subjectId}/topics`, {
        method: 'POST',
        body: JSON.stringify({ name: newTopicName })
      });
      setTopics([...topics, created]);
      setNewTopicName('');
      setIsAddingTopic(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add topic');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleComplete = async (topic: Topic) => {
    try {
      const updated = await fetchWithAuth(`/api/topics/${topic.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: !topic.is_completed })
      });
      setTopics(topics.map(t => t.id === updated.id ? updated : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update topic');
    }
  };

  const handleDeleteTopic = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      await fetchWithAuth(`/api/topics/${id}`, { method: 'DELETE' });
      setTopics(topics.filter(t => t.id !== id));
      if (expandedTopicId === id) setExpandedTopicId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete topic');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTopicId(expandedTopicId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/subjects')} className="pl-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
        <Card className="border-danger/20 bg-danger/5">
          <CardContent className="p-4 flex items-center text-sm text-danger">
            <AlertCircle className="mr-3 h-5 w-5" />
            <span className="flex-1 font-medium">{error || 'Subject not found'}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = topics.filter(t => t.is_completed).length;
  const progress = topics.length === 0 ? 0 : Math.round((completedCount / topics.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <Button variant="ghost" onClick={() => navigate('/subjects')} className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Subjects
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="h-4 w-4 rounded-full shadow-sm"
              style={{ backgroundColor: subject.color_code || 'var(--primary)' }}
            />
            <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-4 text-sm mt-4">
            <span className="font-medium">{topics.length} topics</span>
            <span className="text-border">|</span>
            <span className="font-medium">{progress}% mastery</span>
          </p>
        </div>
      </div>
      
      {/* Subject-level PYQs */}
      <div className="pt-6">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          Past Year Questions (PYQs)
        </h2>
        <MaterialManager subjectId={subjectId} materialType="pyq" />
      </div>

      <div className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">Topics</h2>
          {!isAddingTopic && (
            <Button onClick={() => setIsAddingTopic(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {isAddingTopic && (
            <Card className="border-primary/30 shadow-sm">
              <CardContent className="p-4">
                <form onSubmit={handleAddTopic} className="flex gap-3">
                  <Input
                    autoFocus
                    placeholder="Enter topic name..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    disabled={addLoading}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => { setIsAddingTopic(false); setNewTopicName(''); }}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={addLoading}>
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {topics.length === 0 && !isAddingTopic ? (
            <Card className="border-dashed bg-transparent">
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No topics added yet. Break down your subject into smaller topics.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddingTopic(true)}>
                  Add First Topic
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topics.map(topic => {
                const isExpanded = expandedTopicId === topic.id;
                
                return (
                  <Card key={topic.id} className={`overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/20 hover:shadow-sm'}`}>
                    <div 
                      className={`p-4 flex items-center cursor-pointer transition-colors ${topic.is_completed ? 'bg-surface-hover/30' : 'bg-surface'}`}
                      onClick={() => toggleExpand(topic.id)}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleComplete(topic); }}
                        className={`mr-4 focus:outline-none rounded-full transition-colors ${topic.is_completed ? 'text-success' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        {topic.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      
                      <div className={`flex-1 font-medium text-lg truncate ${topic.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {topic.name}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDeleteTopic(topic.id, e)}
                          className="p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                          aria-label="Delete topic"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-2 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-border bg-surface-hover/20 p-6 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center">
                          <FileText className="w-4 h-4 mr-2" /> Topic Notes & Materials
                        </h4>
                        <MaterialManager subjectId={subjectId} topicId={topic.id} materialType="note" />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
