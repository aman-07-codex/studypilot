import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface Profile {
  full_name: string | null;
  current_streak: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, current_streak")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || "Student"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Your current study streak is{" "}
          <span className="font-semibold text-indigo-600">
            {profile?.current_streak || 0} days
          </span>
          .
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center min-h-[200px] text-center text-gray-500">
          <p>Subjects will appear here</p>
          <p className="text-sm">(Phase 2 Implementation)</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center min-h-[200px] text-center text-gray-500">
          <p>Upcoming Exams will appear here</p>
          <p className="text-sm">(Phase 2 Implementation)</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center min-h-[200px] text-center text-gray-500 md:col-span-2 lg:col-span-1">
          <p>Today's tasks will appear here</p>
          <p className="text-sm">(Phase 2 Implementation)</p>
        </div>
      </div>
    </div>
  );
}
