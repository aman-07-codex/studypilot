import { Link, Outlet, useLocation } from "react-router-dom";
import { BookOpen, LogOut, LayoutDashboard, Book, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r bg-white px-4 py-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">StudyPilot</span>
        </div>
        
        <div className="flex-1 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              location.pathname === "/"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/subjects"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              location.pathname.startsWith("/subjects")
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Book className="h-5 w-5" />
            <span className="font-medium">Subjects</span>
          </Link>
          <Link
            to="/exams"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              location.pathname.startsWith("/exams")
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Exams</span>
          </Link>
        </div>

        <div className="border-t pt-4">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">StudyPilot</span>
          </div>
          <button onClick={signOut} className="text-gray-600 p-2">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
