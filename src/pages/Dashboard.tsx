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
  AlertCircle,
  PlusCircle,
  Loader2
} from "lucide-react";

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
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.user_metadata?.full_name || "Student";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 shadow-sm ring-1 ring-red-100 flex flex-col items-center text-center max-w-md mx-auto mt-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <button
          onClick={loadDashboard}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, subjects } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Here's an overview of your study progress today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Book className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Subjects</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_subjects}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <ListTodo className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Topics</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_topics}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completed Topics</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed_topics}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 rounded-xl">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Overall Progress</p>
            <p className="text-2xl font-bold text-gray-900">{stats.overall_percentage}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Study</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.today_study_minutes} <span className="text-sm font-normal text-gray-500">min</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Study Streak</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.current_streak} <span className="text-sm font-normal text-gray-500">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      {data.today_tasks && data.today_tasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Today's AI Study Plan
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {data.today_tasks.map(task => (
              <div key={task.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex-1">
                  <div className={`text-base font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.topic ? task.topic.name : 'General Review & Practice'}
                  </div>
                  <div className="flex items-center space-x-3 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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
                {!task.is_completed && (
                  <Link
                    to={`/study${task.topic_id ? `?topicId=${task.topic_id}` : ''}`}
                    className="ml-4 flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Book className="w-4 h-4 mr-1.5" />
                    Study
                  </Link>
                )}
                {task.is_completed && (
                   <span className="ml-4 flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                     <CheckCircle className="w-4 h-4 mr-1.5" /> Done
                   </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Progress Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Subject Progress</h2>
        
        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No subjects yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Get started by adding your first subject. Track topics, monitor progress, and master your courses.
            </p>
            <Link
              to="/subjects"
              className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-sm"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create First Subject
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <div 
                key={subject.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md flex flex-col"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div 
                    className="h-4 w-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: subject.color_code || '#4f46e5' }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 truncate" title={subject.name}>
                    {subject.name}
                  </h3>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm text-gray-500">
                      {subject.completed_topics} / {subject.total_topics} topics completed
                    </p>
                    <span className="font-bold text-gray-900 text-lg leading-none">
                      {subject.completion_percentage}%
                    </span>
                  </div>
                  
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${subject.completion_percentage}%`,
                        backgroundColor: subject.color_code || '#4f46e5'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
