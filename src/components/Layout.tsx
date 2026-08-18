import { Link, Outlet, useLocation } from "react-router-dom";
import { BookOpen, LogOut, LayoutDashboard, Book, Calendar, History, Settings, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ui/theme-toggle";

export function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", to: "/", icon: LayoutDashboard },
    { name: "Subjects", to: "/subjects", icon: Book },
    { name: "Exams", to: "/exams", icon: Calendar },
    { name: "Study Room", to: "/study", icon: BookOpen },
    { name: "Study History", to: "/study-history", icon: History },
    { name: "Settings", to: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-border bg-surface px-4 py-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">StudyPilot</span>
        </div>
        
        <div className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.to === "/" 
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to) && !(item.to === "/study" && location.pathname.startsWith("/study-history"));
              
            return (
              <Link
                key={item.name}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-6">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.email?.split('@')[0]}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">StudyPilot</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
