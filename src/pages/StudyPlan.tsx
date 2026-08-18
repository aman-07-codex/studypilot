import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Calendar, Clock, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { ExamWithSubject, StudyPlanWithDetails, StudyTask } from '../shared/types';

export default function StudyPlan() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamWithSubject | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanWithDetails | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      loadData();
    }
  }, [examId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam details
      const examData = await fetchWithAuth(`/api/exams/${examId}`);
      setExam(examData);

      // Fetch existing study plans for this exam
      const plansData = await fetchWithAuth(`/api/study-plans?exam_id=${examId}`);
      if (plansData && plansData.length > 0) {
        setStudyPlan(plansData[0]); // We just use the first plan for now
      } else {
        setStudyPlan(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      const newPlan = await fetchWithAuth('/api/study-plans/generate', {
        method: 'POST',
        body: JSON.stringify({ exam_id: examId })
      });
      setStudyPlan(newPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (task: StudyTask & { topic?: { name: string } | null }) => {
    try {
      const updatedTask = await fetchWithAuth(`/api/study-plans/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !task.is_completed })
      });

      setStudyPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === updatedTask.id ? { ...t, is_completed: updatedTask.is_completed } : t)
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="max-w-4xl mx-auto mt-8 rounded-md bg-red-50 p-4 text-sm text-red-700 flex flex-col items-center justify-center h-48">
        <AlertCircle className="mb-2 h-8 w-8" />
        <p className="text-base font-medium">{error}</p>
        <button onClick={() => navigate('/exams')} className="mt-4 text-indigo-600 hover:underline">
          Return to Exams
        </button>
      </div>
    );
  }

  // Group tasks by date
  const groupedTasks: Record<string, typeof studyPlan.tasks> = {};
  if (studyPlan && studyPlan.tasks) {
    studyPlan.tasks.forEach(task => {
      const d = task.task_date;
      if (!groupedTasks[d]) {
        groupedTasks[d] = [];
      }
      groupedTasks[d].push(task);
    });
  }
  
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/exams')} 
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Plan</h1>
          <p className="text-gray-500 mt-1">Prepare for your upcoming exam.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Exam Info Card */}
      {exam && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: exam.subject.color_code || '#6366f1' }}
                />
                <h2 className="text-lg font-semibold text-gray-800">{exam.subject.name}</h2>
              </div>
              <div className="text-gray-600 flex items-center text-sm space-x-4">
                 <div className="flex items-center">
                   <Calendar className="w-4 h-4 mr-1.5" />
                   {new Date(exam.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                 </div>
                 <div className="flex items-center">
                   <Clock className="w-4 h-4 mr-1.5" />
                   {new Date(exam.exam_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
              {exam.notes && (
                <p className="mt-3 text-sm text-gray-500 max-w-2xl">{exam.notes}</p>
              )}
            </div>

            {!studyPlan && (
               <button
                 onClick={handleGeneratePlan}
                 disabled={generating}
                 className="mt-4 md:mt-0 flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-70 shadow-sm"
               >
                 {generating ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                   <Brain className="mr-2 h-4 w-4" />
                 )}
                 {generating ? 'Generating AI Plan...' : 'Generate AI Study Plan'}
               </button>
            )}
         </div>
      )}

      {/* Study Plan View */}
      {studyPlan && (
         <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Your Schedule</h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {studyPlan.tasks.filter(t => t.is_completed).length} / {studyPlan.tasks.length} completed
              </div>
            </div>

            <div className="space-y-6">
               {sortedDates.map(date => {
                 const tasksForDate = groupedTasks[date];
                 const dateObj = new Date(date);
                 
                 // Display nicely
                 let dateLabel = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                 
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
                   <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-3">
                        <h4 className="font-semibold text-gray-800">{dateLabel}</h4>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {tasksForDate.map(task => (
                          <div 
                            key={task.id} 
                            className={`p-5 flex items-start transition-colors hover:bg-gray-50/50 ${task.is_completed ? 'opacity-60' : ''}`}
                          >
                            <button 
                              onClick={() => handleToggleTask(task)}
                              className="mt-0.5 flex-shrink-0 text-indigo-500 hover:text-indigo-700 transition-colors focus:outline-none"
                            >
                              {task.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            
                            <div className="ml-4 flex-1">
                               <div className={`text-base font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                 {task.topic ? task.topic.name : 'General Review & Practice'}
                               </div>
                               <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                 <span className="flex items-center">
                                   <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                                   {task.duration_minutes} min
                                 </span>
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                   task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                   task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                   'bg-green-50 text-green-700 border-green-100'
                                 }`}>
                                   {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                                 </span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      )}
    </div>
  );
}
