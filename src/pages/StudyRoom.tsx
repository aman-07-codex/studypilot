import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/apiClient';
import { Play, Square, Clock, AlertCircle, Loader2, CheckCircle2, History } from 'lucide-react';
import { Subject, Topic, StudySessionWithDetails } from '../shared/types';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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

  const [finishedSessionResult, setFinishedSessionResult] = useState<{ duration: number, topicName: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsData, topicsData, sessionsData] = await Promise.all([
        fetchWithAuth('/api/subjects'),
        fetchWithAuth('/api/topics'),
        fetchWithAuth('/api/study-sessions?limit=5')
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
      setError(err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter(t => t.subject_id === selectedSubject);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && startedAt) {
      interval = setInterval(() => {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying, startedAt]);

  const handleStart = () => {
    setStartedAt(new Date().toISOString());
    setIsStudying(true);
    setElapsedSeconds(0);
    setFinishedSessionResult(null);
  };

  const handleStop = async () => {
    if (!startedAt) return;
    
    setIsStudying(false);
    setSaving(true);
    setError(null);

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      const payload = {
        topic_id: selectedTopic || null,
        duration_minutes: durationMinutes,
        started_at: startedAt
      };
      await fetchWithAuth('/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const t = topics.find(t => t.id === selectedTopic);
      setFinishedSessionResult({
        duration: durationMinutes,
        topicName: t ? t.name : 'General Study'
      });
      
      setStartedAt(null);
      setElapsedSeconds(0);
      
      // reload recent
      const sessionsData = await fetchWithAuth('/api/study-sessions?limit=5');
      setRecentSessions(sessionsData);
      
    } catch (err: any) {
      setError(err.message || 'Failed to save study session');
      setIsStudying(true); // resume on failure
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ];
    
    if (hours === 0) {
      return parts.slice(1).join(':');
    }
    return parts.join(':');
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Study Room</h1>
        <p className="text-muted-foreground mt-2">Eliminate distractions and focus on your goals.</p>
      </div>

      {error && (
         <Card className="border-danger/20 bg-danger/5">
           <CardContent className="p-4 flex items-center text-sm text-danger">
             <AlertCircle className="mr-3 h-5 w-5" />
             <span className="flex-1 font-medium">{error}</span>
           </CardContent>
         </Card>
      )}

      {finishedSessionResult && !isStudying && !saving && (
        <Card className="border-success/30 bg-success/5 animate-in slide-in-from-top-4">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-2xl font-bold text-success mb-2">Session Complete!</h3>
            <p className="text-muted-foreground text-lg">
              You studied <span className="font-semibold text-foreground">{finishedSessionResult.topicName}</span> for <span className="font-semibold text-foreground">{finishedSessionResult.duration} minutes</span>.
            </p>
            <Button className="mt-8" onClick={() => setFinishedSessionResult(null)}>
              Start Another Session
            </Button>
          </CardContent>
        </Card>
      )}

      {!finishedSessionResult && (
        <Card className={`overflow-hidden transition-all duration-700 shadow-lg ${isStudying ? 'border-primary shadow-primary/10' : ''}`}>
          <CardContent className="p-8 md:p-12">
            {!isStudying ? (
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Subject (Optional)</label>
                  <select 
                    className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedTopic('');
                    }}
                  >
                    <option value="">-- General Study --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                {selectedSubject && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-semibold mb-2">Topic (Optional)</label>
                    <select 
                      className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                    >
                      <option value="">-- All Topics --</option>
                      {filteredTopics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button 
                  size="lg"
                  className="w-full h-14 text-lg font-semibold rounded-xl mt-4" 
                  onClick={handleStart}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Begin Focus Session
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
                  {selectedTopic ? topics.find(t=>t.id === selectedTopic)?.name : selectedSubject ? subjects.find(s=>s.id === selectedSubject)?.name : 'General Focus Session'}
                </h2>
                
                <div className="font-mono text-7xl md:text-9xl font-bold tracking-tight tabular-nums my-12 text-foreground">
                  {formatTime(elapsedSeconds)}
                </div>
                
                <Button 
                  size="lg"
                  variant="danger"
                  className="h-14 px-12 text-lg font-semibold rounded-xl"
                  onClick={handleStop}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5 mr-2 fill-current" />
                  )}
                  {saving ? 'Saving...' : 'End Session'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      {!isStudying && recentSessions.length > 0 && (
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Recent Sessions</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentSessions.map(session => (
              <Card key={session.id} className="hover:bg-surface-hover/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="font-medium truncate text-foreground">
                      {session.topic ? session.topic.name : 'General Study'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(session.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap px-3 py-1">
                    {session.duration_minutes} min
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
