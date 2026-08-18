import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchWithAuth } from "../lib/apiClient";
import { DashboardData } from "../shared/types";
import { 
  Book, 
  ListTodo, 
  CheckCircle, 
  TrendingUp,
  PlusCircle,
  Loader2,
  Calendar,
  Clock,
  Play
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const tzOffset = new Date().getTimezoneOffset();
      const dashboardData = await fetchWithAuth(`/api/dashboard?tzOffset=${tzOffset}`);
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCompleteTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await fetchWithAuth(`/api/study-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: isCompleted })
      });
      loadDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/60" />
          <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="max-w-md mx-auto mt-8 border-danger/20 bg-danger/5">
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 mb-4">
            <span className="text-danger font-bold text-xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-danger">Unable to load dashboard</h3>
          <p className="mt-2 text-sm text-danger/80">{error}</p>
          <Button onClick={loadDashboard} variant="outline" className="mt-6 border-danger/20 text-danger hover:bg-danger/10 hover:text-danger">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { stats, subjects } = data;
  const firstName = data.user_full_name 
    ? data.user_full_name.split(' ')[0] 
    : user?.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground mt-2">Here's your academic overview for today.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Topics Mastered</p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{stats.completed_topics} <span className="text-lg font-normal text-muted-foreground">/ {stats.total_topics}</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overall_percentage}% overall completion
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Study Time Today</p>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{stats.today_study_minutes} <span className="text-lg font-normal text-muted-foreground">min</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                across {stats.today_sessions} {stats.today_sessions === 1 ? 'session' : 'sessions'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
              <div className="p-2 bg-success/10 rounded-lg">
                <Book className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{stats.total_subjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tracked in your workspace
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
              <div className="p-2 bg-danger/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-danger" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{stats.current_streak} <span className="text-lg font-normal text-muted-foreground">days</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep the momentum going
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      {data.today_tasks && data.today_tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Today's AI Study Plan</h2>
          </div>
          
          <div className="grid gap-3">
            {data.today_tasks.map(task => (
              <Card key={task.id} className={`transition-all ${task.is_completed ? 'opacity-60 bg-surface-hover/50 border-dashed' : 'hover:border-primary/30 hover:shadow-md'}`}>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={
                        task.priority === 'high' ? 'danger' :
                        task.priority === 'medium' ? 'warning' : 'success'
                      } className="uppercase text-[10px] tracking-wider font-bold">
                        {task.priority} Priority
                      </Badge>
                      <span className="flex items-center text-xs font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {task.duration_minutes} min
                      </span>
                    </div>

                    <h3 className={`text-base font-semibold truncate ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.topic ? task.topic.name : 'General Review & Practice'}
                    </h3>

                    {task.subtopics && task.subtopics.length > 0 && (
                      <div className="mt-3">
                        <ul className="grid sm:grid-cols-2 gap-y-1 gap-x-4">
                          {task.subtopics.map((subtopic, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start">
                              <span className="text-border mr-2 mt-0.5">•</span>
                              <span className="truncate" title={subtopic}>{subtopic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                    {!task.is_completed ? (
                      <>
                        <Link
                          to={`/study${task.topic_id ? `?topicId=${task.topic_id}` : ''}`}
                          className="w-full sm:w-auto"
                        >
                          <Button className="w-full" size="sm">
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCompleteTask(task.id, true)}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                          Complete
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <Badge variant="success" className="bg-success/10 text-success border-0 rounded-md py-1.5">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Done
                        </Badge>
                        <button
                          onClick={() => handleCompleteTask(task.id, false)}
                          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Subject Progress Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Subject Progress</h2>
        
        {subjects.length === 0 ? (
          <Card className="border-dashed bg-transparent">
            <CardContent className="p-12 text-center flex flex-col items-center">
              <div className="p-4 bg-surface rounded-full shadow-sm mb-4">
                <Book className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No subjects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Get started by adding your first subject. Track topics, monitor progress, and master your courses.
              </p>
              <Link to="/subjects" className="mt-6">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Subject
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:border-primary/20 hover:shadow-md transition-all flex flex-col">
                <CardContent className="p-6 flex flex-col h-full justify-between">
                  <div className="flex items-center gap-3 mb-8">
                    <div 
                      className="h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: subject.color_code || 'var(--primary)' }}
                    />
                    <h3 className="font-semibold text-lg truncate" title={subject.name}>
                      {subject.name}
                    </h3>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {subject.completed_topics} / {subject.total_topics} topics
                      </p>
                      <span className="font-bold text-xl tracking-tight">
                        {subject.completion_percentage}%
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{ 
                          width: `${subject.completion_percentage}%`,
                          backgroundColor: subject.color_code || 'var(--primary)'
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
