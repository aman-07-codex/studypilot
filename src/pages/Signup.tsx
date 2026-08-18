import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 bg-surface p-10 rounded-2xl shadow-lg border border-border animate-in zoom-in-95 fade-in duration-500">
        <div className="flex flex-col items-center">
          <div className="rounded-xl bg-primary/10 p-4 mb-4 shadow-sm">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Start your academic journey with StudyPilot.
          </p>
        </div>
        
        {success ? (
          <div className="rounded-lg bg-success/10 p-6 text-sm text-success border border-success/20 text-center shadow-sm">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" />
            <p className="font-semibold text-lg mb-1">Success!</p>
            <p>Please check your email for a confirmation link to complete registration.</p>
            <Link to="/login" className="mt-6 inline-block font-semibold underline hover:text-success/80">
              Return to login
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-lg bg-danger/10 p-4 text-sm text-danger flex items-center shadow-sm">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-sm" isLoading={loading}>
              Sign up
            </Button>
          </form>
        )}
        
        {!success && (
          <p className="text-center text-sm text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
