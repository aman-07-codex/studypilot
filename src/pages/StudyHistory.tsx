import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../lib/apiClient';
import { StudySessionWithDetails } from '../shared/types';
import { Clock, Book, AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface HistoryStats {
  total_minutes: number;
  total_sessions: number;
  today_minutes: number;
  current_streak: number;
}

export default function StudyHistory() {
  const [sessions, setSessions] = useState<StudySessionWithDetails[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const tzOffset = new Date().getTimezoneOffset();
      const [sessionsData, statsData] = await Promise.all([
        fetchWithAuth('/api/study-sessions'),
        fetchWithAuth(`/api/study-sessions/stats?tzOffset=${tzOffset}`)
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load study history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study session? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingId(id);
      await fetchWithAuth(`/api/study-sessions/${id}`, { method: 'DELETE' });
      // Refresh data to get updated stats and list
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  // Group sessions by date
  const groupSessionsByDate = () => {
    const grouped: { [key: string]: StudySessionWithDetails[] } = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    sessions.forEach(session => {
      const date = new Date(session.started_at).toLocaleDateString();
      let label = date;
      if (date === today) label = 'Today';
      else if (date === yesterday) label = 'Yesterday';
      else {
        label = new Date(session.started_at).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(session);
    });

    return grouped;
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Study History</h1>
        <p className="text-gray-500 mt-1">Review your past study sessions and overall progress.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Study Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor(stats.total_minutes / 60)}<span className="text-sm font-normal text-gray-500 mr-1">h</span>
              {stats.total_minutes % 60}<span className="text-sm font-normal text-gray-500">m</span>
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_sessions}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Today's Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.today_minutes} <span className="text-sm font-normal text-gray-500">min</span>
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.current_streak} <span className="text-sm font-normal text-gray-500">days</span>
            </p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-8">
        {Object.keys(groupedSessions).length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Book className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No study history yet</h3>
            <p className="mt-2 text-gray-500">When you complete study sessions, they will appear here.</p>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateLabel, daySessions]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                {dateLabel}
              </h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {daySessions.map(session => (
                  <div key={session.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="text-base font-medium text-gray-900">
                        {session.topic ? session.topic.name : 'General Study'}
                      </div>
                      <div className="flex items-center space-x-3 mt-1.5 text-sm text-gray-500">
                        {session.topic?.subject && (
                          <span className="flex items-center">
                            <span 
                              className="w-2 h-2 rounded-full mr-1.5"
                              style={{ backgroundColor: session.topic.subject.color_code || '#6366f1' }}
                            />
                            {session.topic.subject.name}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {session.completed_at && ` - ${new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {session.duration_minutes} <span className="text-sm font-normal text-gray-500">min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Delete session"
                      >
                        {deletingId === session.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
