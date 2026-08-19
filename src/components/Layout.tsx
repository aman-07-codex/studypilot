import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { BookOpen, LogOut, LayoutDashboard, Book, Calendar, History, Settings, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, isActive: location.pathname === "/" },
    { name: "Subjects", path: "/subjects", icon: Book, isActive: location.pathname.startsWith("/subjects") },
    { name: "Exams", path: "/exams", icon: Calendar, isActive: location.pathname.startsWith("/exams") },
    { name: "Study Room", path: "/study", icon: BookOpen, isActive: location.pathname.startsWith("/study") && !location.pathname.startsWith("/study-history") },
    { name: "Study History", path: "/study-history", icon: History, isActive: location.pathname.startsWith("/study-history") },
    { name: "Settings", path: "/settings", icon: Settings, isActive: location.pathname.startsWith("/settings") },
  ];

  const renderNavLinks = () => (
    <>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              link.isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{link.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar Navigation */}
      <nav className="w-64 border-r bg-white px-4 py-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">StudyPilot</span>
        </div>
        
        <div className="flex-1 space-y-1">
          {renderNavLinks()}
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
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between border-b bg-white p-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">StudyPilot</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Navigation Drawer */}
        <div 
          className={`fixed inset-y-0 right-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {renderNavLinks()}
          </div>
          
          <div className="border-t p-4 bg-gray-50">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
