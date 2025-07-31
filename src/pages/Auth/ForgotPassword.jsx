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
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { authHelpers } from "@/lib/supabase";
import { config } from "@/lib/config";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setError(""); // Clear general error

    if (!value.trim()) {
      setEmailError("");
      setIsEmailValid(false);
      return;
    }

    if (value.trim().length < 3) {
      setEmailError("Email is too short");
      setIsEmailValid(false);
      return;
    }

    if (!validateEmail(value.trim())) {
      setEmailError("Please enter a valid email address");
      setIsEmailValid(false);
      return;
    }

    setEmailError("");
    setIsEmailValid(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email address is required");
      setEmailError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setEmailError("");

    try {
      // Try Supabase Auth password reset first
      try {
        const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        );

        if (supabaseError) {
          console.log('Supabase password reset failed, trying custom flow:', supabaseError.message);
          // Fall back to custom password reset
          const result = await authHelpers.forgotPassword(email.trim());
          
          if (result.success) {
            setIsSubmitted(true);
            toast.success("Email sent successfully! Please check your inbox.");
          } else {
            // Always show generic message for security
            toast.success(result?.message || "Please check your email.");
            setIsSubmitted(true);
          }
        } else {
          // Supabase password reset successful
          console.log('Supabase password reset email sent successfully');
          setIsSubmitted(true);
          toast.success("Password reset email sent! Please check your inbox.");
        }
      } catch (supabaseError) {
        console.log('Supabase password reset error, using custom flow:', supabaseError);
        // Fall back to custom password reset
        const result = await authHelpers.forgotPassword(email.trim());
        
        if (result.success) {
          setIsSubmitted(true);
          toast.success("Email sent successfully! Please check your inbox.");
        } else {
          // Always show generic message for security
          toast.success(result?.message || "Please check your email.");
          setIsSubmitted(true);
        }
      }
    } catch (error) {
      console.error("Password reset error:", error);
      // Always show generic message for security - don't reveal if email exists
      setIsSubmitted(true);
      toast.success("Email sent successfully! Please check your inbox.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen if email was submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 mb-6">
                If an account with this email exists, we've sent password reset
                instructions to <span className="font-medium">{email}</span>
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/auth/login")}
                  className="w-full"
                >
                  Back to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try Different Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SalesGenius.ai
          </h1>
          <p className="text-gray-600">Reset Your Password</p>
        </div>

        {/* Forgot Password Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Forgot Password
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your
              password
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
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
                      handleEmailChange(e.target.value);
                    }}
                    className="pl-10"
                    // className={`pl-10 ${
                    //   emailError
                    //     ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    //     : isEmailValid
                    //     ? "border-grey-500 focus:border-green-500 focus:ring-green-500"
                    //     : ""
                    // }`}
                    disabled={isLoading}
                    required
                  />
                  {/* Email validation icon */}
                  {/* {email.trim() && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isEmailValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : emailError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  )} */}
                </div>
                {/* Email error message */}
                {emailError && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{emailError}</span>
                  </p>
                )}
                {/* {isEmailValid && !emailError && (
                  <p className="text-sm text-green-600 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid email address</span>
                  </p>
                )} */}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!email.trim() || !isEmailValid || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
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
