import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/apiClient';
import { Profile } from '../shared/types';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Award, Clock, Activity, Loader2, Save, LogOut } from 'lucide-react';

interface HistoryStats {
  total_minutes: number;
  total_sessions: number;
  today_minutes: number;
  current_streak: number;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tzOffset = new Date().getTimezoneOffset();
      const [profileData, statsData] = await Promise.all([
        fetchWithAuth('/api/profile'),
        fetchWithAuth(`/api/study-sessions/stats?tzOffset=${tzOffset}`)
      ]);
      setProfile(profileData);
      setStats(statsData);
      setFullName(profileData.full_name || '');
    } catch (err: any) {
      console.error("Failed to load settings data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    
    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    
    try {
      setSavingProfile(true);
      const updatedProfile = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName.trim() })
      });
      setProfile(updatedProfile);
      setFullName(updatedProfile.full_name || '');
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    
    if (!password || password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile, account security, and view lifetime statistics.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Stats & Actions */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Streak</p>
                  <p className="text-lg font-bold text-gray-900">{stats?.current_streak || 0} days</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Study Time</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats ? Math.floor(stats.total_minutes / 60) : 0}h {stats ? stats.total_minutes % 60 : 0}m
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Sessions</p>
                  <p className="text-lg font-bold text-gray-900">{stats?.total_sessions || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Profile Details Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <User className="w-5 h-5 mr-2 text-gray-400" />
              Profile Details
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="pl-10 block w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-gray-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Your email is managed through your authentication provider.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {profileMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${profileMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {profileMsg.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Account Security Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <Shield className="w-5 h-5 mr-2 text-gray-400" />
              Account Security
            </h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                  placeholder="••••••••"
                />
              </div>

              {passwordMsg && (
                <div className={`p-3 rounded-lg text-sm font-medium ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {passwordMsg.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {updatingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
