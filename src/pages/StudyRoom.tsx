import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/apiClient';
import { Play, Square, Clock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Subject, Topic, StudySessionWithDetails } from '../shared/types';
import { useLocation } from 'react-router-dom';

export default function StudyRoom() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const prefilledTopicId = searchParams.get('topicId');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  
  const [isStudying, setIsStudying] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<StudySessionWithDetails[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsData, topicsData, sessionsData] = await Promise.all([
        fetchWithAuth('/api/subjects'),
        fetchWithAuth('/api/topics'),
        fetchWithAuth('/api/study-sessions')
      ]);
      setSubjects(subjectsData);
      setTopics(topicsData);
      setRecentSessions(sessionsData);

      if (prefilledTopicId) {
        const topic = topicsData.find((t: Topic) => t.id === prefilledTopicId);
        if (topic) {
          setSelectedSubject(topic.subject_id);
          setSelectedTopic(topic.id);
        }
      }
    } catch (err: any) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStudying || !startedAt) return;
    
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isStudying, startedAt]);

  const handleStart = () => {
    setError(null);
    setStartedAt(new Date().toISOString());
    setIsStudying(true);
    setElapsedSeconds(0);
  };

  const handleStopAndSave = async () => {
    if (!startedAt) return;
    
    try {
      setSaving(true);
      setError(null);
      const completedAt = new Date().toISOString();
      const tzOffset = new Date().getTimezoneOffset();

      // Check if duration is at least 1 minute (60 seconds).
      // Since backend enforces > 0 minutes, if it's < 30 seconds we might get 0.
      // We will let the backend handle the Math.max(1, duration) logic as written.
      
      const newSession = await fetchWithAuth('/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          topic_id: selectedTopic || null,
          started_at: startedAt,
          completed_at: completedAt,
          timezone_offset: tzOffset
        })
      });

      setRecentSessions([newSession, ...recentSessions]);
      setIsStudying(false);
      setStartedAt(null);
      setElapsedSeconds(0);
      
      // Optionally if prefilledTopicId was set (e.g. from AI task), we might want to auto-mark it complete?
      // Requirement: "Do not automatically mark an AI task complete merely because a timer starts. Only mark an AI task completed through an explicit user action."
    } catch (err: any) {
      setError(err.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const availableTopics = topics.filter(t => t.subject_id === selectedSubject);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Study Room</h1>
        <p className="text-gray-500 mt-1">Focus on your topics and track your real study time.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      {/* Timer Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {!isStudying ? (
          <div className="max-w-md mx-auto space-y-5 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('');
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">General Study</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            
            {selectedSubject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic (Optional)</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Any Topic</option>
                  {availableTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleStart}
              className="w-full mt-6 flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-700 shadow-sm"
            >
              <Play className="mr-2 h-5 w-5" /> Start Session
            </button>
          </div>
        ) : (
          <div className="py-8 space-y-8">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">
              {selectedTopic ? topics.find(t => t.id === selectedTopic)?.name : selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name : 'General Study'}
            </div>
            
            <div className="text-7xl font-light text-gray-900 tracking-tight font-mono">
              {formatTime(elapsedSeconds)}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleStopAndSave}
                disabled={saving}
                className="flex items-center justify-center rounded-full bg-red-100 text-red-600 px-8 py-3 font-medium transition-colors hover:bg-red-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Square className="mr-2 h-5 w-5 fill-current" />
                )}
                Stop & Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Session History</h2>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        
        {recentSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No study sessions recorded yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentSessions.map(session => (
              <li key={session.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div>
                  <div className="flex items-center text-gray-900 font-medium">
                    {session.topic ? session.topic.name : 'General Study'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                    {session.topic?.subject && (
                      <span className="flex items-center">
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: session.topic.subject.color_code || '#6366f1' }}
                        />
                        {session.topic.subject.name}
                        <span className="mx-2 text-gray-300">•</span>
                      </span>
                    )}
                    <span>
                      {new Date(session.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {session.duration_minutes} <span className="text-sm font-normal text-gray-500">min</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium flex items-center justify-end mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Completed
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}