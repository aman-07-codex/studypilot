import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../lib/apiClient";
import { ExamWithSubject, StudyPlanWithDetails, StudyTask } from "../shared/types";
import { 
  Calendar, 
  Clock, 
  Brain, 
  Loader2, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  Play
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function StudyPlan() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<ExamWithSubject | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError(null);
      const [examData, planData] = await Promise.all([
        fetchWithAuth(`/api/exams/${examId}`),
        fetchWithAuth(`/api/exams/${examId}/study-plan`).catch(e => {
          if (e.message.includes('No study plan found')) return null;
          throw e;
        })
      ]);
      setExam(examData);
      setStudyPlan(planData);
    } catch (err: any) {
      setError(err.message || 'Failed to load study plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [examId]);

  const handleGeneratePlan = async () => {
    if (!examId) return;
    try {
      setGenerating(true);
      setError(null);
      const newPlan = await fetchWithAuth(`/api/exams/${examId}/study-plan`, {
        method: 'POST'
      });
      setStudyPlan(newPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (task: StudyTask) => {
    try {
      const updated = await fetchWithAuth(`/api/study-tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: !task.is_completed })
      });
      
      setStudyPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === task.id ? { ...t, is_completed: updated.is_completed } : t)
        }
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/60" />
          <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading study plan...</p>
        </div>
      </div>
    );
  }

  // Group tasks by date
  const groupedTasks: Record<string, StudyPlanWithDetails['tasks']> = {};
  if (studyPlan) {
    studyPlan.tasks.forEach(task => {
      if (!groupedTasks[task.task_date]) {
        groupedTasks[task.task_date] = [];
      }
      groupedTasks[task.task_date].push(task);
    });
  }

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Plan</h1>
          <p className="text-muted-foreground mt-2">Prepare for your upcoming exam.</p>
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

      {/* Exam Info Card */}
      {exam && (
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: exam.subject.color_code || 'var(--primary)' }}
                />
                <h2 className="text-xl font-bold tracking-tight">{exam.subject.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(exam.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(exam.exam_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {exam.notes && (
                <p className="mt-4 text-sm text-muted-foreground max-w-2xl bg-surface-hover p-3 rounded-lg border">{exam.notes}</p>
              )}
            </div>
            {!studyPlan && (
              <Button
                onClick={handleGeneratePlan}
                disabled={generating}
                size="lg"
                className="w-full md:w-auto flex-shrink-0"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Brain className="mr-2 h-5 w-5" />
                )}
                {generating ? 'Generating AI Plan...' : 'Generate AI Study Plan'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Study Plan View */}
      {studyPlan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Your Schedule</h3>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {studyPlan.tasks.filter(t => t.is_completed).length} / {studyPlan.tasks.length} completed
            </Badge>
          </div>

          <div className="space-y-6">
            {sortedDates.map(date => {
              const tasksForDate = groupedTasks[date];
              const dateObj = new Date(date);
              
              let dateLabel = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
              
              const today = new Date();
              today.setHours(0,0,0,0);
              const dateZero = new Date(date);
              dateZero.setHours(0,0,0,0);
              
              const diff = dateZero.getTime() - today.getTime();
              const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) dateLabel = "Today";
              else if (diffDays === 1) dateLabel = "Tomorrow";
              else if (diffDays === -1) dateLabel = "Yesterday";

              return (
                <Card key={date} className="overflow-hidden">
                  <div className="bg-surface-hover border-b border-border px-6 py-4">
                    <h4 className="font-semibold text-foreground">{dateLabel}</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {tasksForDate.map(task => (
                      <div 
                        key={task.id} 
                        className={`p-6 flex flex-col sm:flex-row items-start gap-4 transition-colors hover:bg-surface-hover/50 ${task.is_completed ? 'opacity-60 bg-surface-hover/30' : ''}`}
                      >
                        <button 
                          onClick={() => handleToggleTask(task)}
                          className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                          aria-label={task.is_completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-6 h-6 text-success" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0 w-full">
                          <div className={`text-lg font-semibold tracking-tight ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.topic ? task.topic.name : 'General Review & Practice'}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="flex items-center text-sm font-medium text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                              {task.duration_minutes} min
                            </span>
                            <Badge variant={
                              task.priority === 'high' ? 'danger' :
                              task.priority === 'medium' ? 'warning' : 'success'
                            } className="uppercase text-[10px] tracking-wider font-bold px-2 py-0.5">
                              {task.priority} PRIORITY
                            </Badge>
                            {task.is_completed && (
                              <Badge variant="success" className="bg-success/10 text-success border-0">
                                Completed
                              </Badge>
                            )}
                          </div>

                          {task.subtopics && task.subtopics.length > 0 && (
                            <div className="mt-5 bg-background/50 rounded-lg p-4 border border-border/50">
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Subtopics</h5>
                              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-4">
                                {task.subtopics.map((subtopic, idx) => (
                                  <li key={idx} className="text-sm text-foreground/80 flex items-start">
                                    <span className="text-muted-foreground mr-2 mt-0.5">•</span>
                                    <span className="truncate" title={subtopic}>{subtopic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {!task.is_completed && (
                          <Button
                            onClick={() => navigate(`/study${task.topic_id ? `?topicId=${task.topic_id}` : ''}`)}
                            className="w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Studying
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
