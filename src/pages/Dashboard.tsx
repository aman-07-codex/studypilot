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
      const dashboardData = await fetchWithAuth("/api/dashboard");
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

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
