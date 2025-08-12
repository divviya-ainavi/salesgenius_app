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
  Send 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Email validation
  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const isFormValid = email.trim() !== "" && isValidEmail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Starting password reset for email:", email);
      
      // Use Supabase Auth password reset
      // Determine the correct redirect URL based on environment
      const getRedirectUrl = () => {
        // Check if we're in production by looking at the hostname
        const isProduction = !window.location.hostname.includes('localhost') && 
                           !window.location.hostname.includes('127.0.0.1') &&
                           !window.location.hostname.includes('.local');
        
        if (isProduction) {
          // Use the current production domain
          return `${window.location.protocol}//${window.location.host}/auth/reset-password`;
        } else {
          // Use localhost for development
          return `${window.location.origin}/auth/reset-password`;
        }
      };

      const redirectUrl = getRedirectUrl();
      console.log("🔗 Using redirect URL for password reset:", redirectUrl);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.error("❌ Supabase password reset failed:", resetError);
        throw resetError;
      }

      console.log("✅ Password reset email sent successfully");
      setIsSubmitted(true);
      toast.success("Password reset email sent! Please check your inbox.");
      
    } catch (error) {
      console.error("❌ Password reset error:", error);
      
      // Handle specific Supabase errors
      if (error.message?.includes("rate limit")) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else if (error.message?.includes("invalid email")) {
        setError("Please enter a valid email address.");
      } else {
        // For security, don't reveal if email exists or not
        setError("If an account with this email exists, you will receive a password reset link.");
      }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
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
                    We've sent a password reset link to:
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
                        <li>• Click the "Reset Password" link</li>
                        <li>• Check your spam folder if you don't see it</li>
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
                  The reset link will expire in 1 hour for security reasons.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SalesGenius.ai
          </h1>
          <p className="text-gray-600">AI-Powered Sales Assistant</p>
        </div>

        {/* Forgot Password Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="pl-10"
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
                className="w-full"
                disabled={!isFormValid || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;