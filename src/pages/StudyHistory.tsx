import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/apiClient';
import { StudySessionWithDetails } from '../shared/types';
import { History, Clock, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function StudyHistory() {
  const [sessions, setSessions] = useState<StudySessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth('/api/study-sessions?limit=50');
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load study history');
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = () => {
    const grouped: Record<string, StudySessionWithDetails[]> = {};
    sessions.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(s);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  const grouped = groupSessionsByDate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study History</h1>
          <p className="text-muted-foreground mt-1">Review your past focus sessions.</p>
        </div>
      </div>

      {error && (
        <Card className="border-danger/20 bg-danger/5">
          <CardContent className="p-4 flex items-center text-sm text-danger">
            <AlertCircle className="mr-3 h-5 w-5" />
            <span className="flex-1 font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-sm mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No history yet</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Start studying in the Study Room to see your past sessions here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dateSessions]) => (
            <div key={date}>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 pl-1">
                {date}
              </h3>
              <div className="grid gap-3">
                {dateSessions.map(session => (
                  <Card key={session.id} className="hover:border-primary/20 hover:shadow-sm transition-all">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-lg text-foreground truncate">
                            {session.topic ? session.topic.name : 'General Study'}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {new Date(session.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm whitespace-nowrap">
                        {session.duration_minutes} min
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
