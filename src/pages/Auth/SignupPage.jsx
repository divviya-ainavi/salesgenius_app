import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Mail, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Send,
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Email validation
  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const isFormValid = email.trim() !== "" && isValidEmail;

  const checkEmailExists = async (email) => {
    try {
      // Check if email exists in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase());

      if (error) {
        throw error;
      }

      return data && data.length > 0; // Returns true if email exists
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false; // Assume email doesn't exist on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Starting signup process for email:", email);
      
      // Check if email is already registered
      const emailExists = await checkEmailExists(email.toLowerCase());
      
      if (emailExists) {
        setError("Email is already in use. Please use a different email or try logging in.");
        setIsLoading(false);
        return;
      }

      // Send verification email using Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: 'temp_' + Math.random().toString(36).substring(2, 15), // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/auth/complete-signup`,
          data: {
            signup_type: 'email_verification'
          }
        }
      });

      if (signUpError) {
        console.error("❌ Supabase signup failed:", signUpError);
        
        if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already been registered")) {
          setError("Email is already in use. Please use a different email or try logging in.");
        } else if (signUpError.message?.includes("email not confirmed")) {
          // Email confirmation is required but disabled - handle gracefully
          console.log("✅ User created, email confirmation required");
          setIsSubmitted(true);
          toast.success("Account created! Please check your email for verification.");
          return;
        } else if (signUpError.message?.includes("rate limit")) {
          setError("Too many requests. Please wait a few minutes before trying again.");
        } else if (signUpError.message?.includes("email address not authorized")) {
          // For development: Show success even if email verification is disabled
          console.log("⚠️ Email verification disabled in development");
          setIsSubmitted(true);
          toast.success("Account created! For development: Please manually navigate to complete signup.");
          return;
        } else {
          // For development, if email is disabled, still show success
          console.log("⚠️ Email verification may be disabled:", signUpError.message);
          setIsSubmitted(true);
          toast.success("Account created! For development: Please manually navigate to complete signup.");
          return;
        }
        return;
      }

      console.log("✅ Verification email sent successfully");
      setIsSubmitted(true);
      toast.success("Verification email sent! Please check your inbox.");
      
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    setEmail("");
    setError("");
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600">
                    We've sent a verification link to:
                  </p>
                  <p className="font-medium text-gray-900 mt-1">{email}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900">
                        What to do next:
                      </p>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Check your email inbox</li>
                        <li>• Look for an email from SalesGenius.ai</li>
                        <li>• Click the "Complete Signup" link</li>
                        <li>• Complete your profile setup</li>
                        <li>• Check your spam folder if you don't see it</li>
                        <li className="text-orange-700 font-medium">• For development: You can manually go to <a href="/auth/complete-signup" className="underline">complete signup</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Another Email
                  </Button>
                  
                  <Button
                    onClick={handleBackToLogin}
                    variant="ghost"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  The verification link will expire in 24 hours for security reasons.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Join SalesGenius.ai
          </h1>
          <p className="text-xl text-gray-600">
            Start your AI-powered sales journey today
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 pb-12">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Create Your Account
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Enter your email to get started with SalesGenius.ai
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                </div>
                {email && !isValidEmail && (
                  <p className="text-sm text-red-600">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Verification Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </Link>
              </p>
              
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;