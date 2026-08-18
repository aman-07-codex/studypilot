import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/apiClient';
import { Profile } from '../shared/types';
import { supabase } from '../lib/supabase';
import { User, Mail, CheckCircle2, AlertCircle, Shield, Award, Clock, Activity, Loader2, Save, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

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
      const [profileData, dashboardData] = await Promise.all([
        fetchWithAuth('/api/profile'),
        fetchWithAuth(`/api/dashboard?tzOffset=${tzOffset}`)
      ]);
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setStats(dashboardData.stats);
    } catch (err: any) {
      console.error('Error loading settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const updated = await fetchWithAuth('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName })
      });
      setProfile(updated);
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
    if (password !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    if (password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      setUpdatingPassword(true);
      setPasswordMsg(null);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, account security, and view lifetime statistics.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Stats & Actions */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Study Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Current Streak</p>
                  <p className="text-xl font-bold tracking-tight">{stats?.current_streak || 0} days</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Study Time</p>
                  <p className="text-xl font-bold tracking-tight">
                    {stats ? Math.floor(stats.total_minutes / 60) : 0}h {stats ? stats.total_minutes % 60 : 0}m
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-success/10 text-success rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Sessions</p>
                  <p className="text-xl font-bold tracking-tight">{stats?.total_sessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={signOut}
            variant="danger"
            className="w-full flex justify-start items-center text-left py-6 px-5"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-semibold text-base">Sign Out of StudyPilot</span>
          </Button>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Details Form */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-primary" />
                Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="pl-10 bg-surface-hover opacity-80"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground font-medium">Your email is managed through your authentication provider.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Full Name</label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                
                {profileMsg && (
                  <div className={`p-3 rounded-lg text-sm font-semibold flex items-center ${profileMsg.type === 'error' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                    {profileMsg.text}
                  </div>
                )}
                
                <div className="pt-2">
                  <Button type="submit" isLoading={savingProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Security Form */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">New Password</label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Confirm New Password</label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                {passwordMsg && (
                  <div className={`p-3 rounded-lg text-sm font-semibold flex items-center ${passwordMsg.type === 'error' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                    {passwordMsg.text}
                  </div>
                )}
                
                <div className="pt-2">
                  <Button type="submit" isLoading={updatingPassword} variant="secondary">
                    <Shield className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
