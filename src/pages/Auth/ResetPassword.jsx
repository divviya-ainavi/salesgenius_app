import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Form data state
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Calculate password strength
  const passwordStrength = Object.values(passwordValidation).filter(Boolean).length;
  const passwordStrengthPercentage = (passwordStrength / 5) * 100;

  // Validate session on component mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        console.log("🔍 ResetPassword - Starting session validation...");
        console.log("📍 Current URL:", window.location.href);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("🔐 Current session:", session ? "Found" : "None");
        console.log("❌ Session error:", sessionError);
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setError("Failed to validate reset session. Please request a new reset link.");
          setIsValidSession(false);
          setIsValidating(false);
          return;
        }

        if (session && session.user) {
          console.log("✅ Valid session found for user:", session.user.email);
          setIsValidSession(true);
          setUserEmail(session.user.email);
          setIsValidating(false);
          return;
        }

        // If no session, check URL parameters and try to establish one
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Combine both parameter sources
        const allParams = {};
        for (const [key, value] of urlParams.entries()) {
          allParams[key] = value;
        }
        for (const [key, value] of hashParams.entries()) {
          allParams[key] = value;
        }
        
        console.log("📋 All URL parameters:", allParams);

        // Check for error parameters
        if (allParams.error) {
          console.error("❌ Error in URL parameters:", allParams);
          let errorMessage = "Password reset link is invalid or has expired.";
          
          if (allParams.error === "access_denied") {
            if (allParams.error_code === "otp_expired") {
              errorMessage = "This password reset link has expired. Please request a new one.";
            } else {
              errorMessage = "This password reset link is invalid or has already been used.";
            }
          }
          
          setError(errorMessage);
          setIsValidSession(false);
          setIsValidating(false);
          return;
        }

        // Try to handle access_token and refresh_token if present
        if (allParams.access_token && allParams.refresh_token) {
          console.log("🔄 Setting session from URL tokens...");
          
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: allParams.access_token,
            refresh_token: allParams.refresh_token,
          });

          if (setSessionError) {
            console.error("❌ Failed to set session:", setSessionError);
            setError("Failed to establish reset session. Please request a new reset link.");
            setIsValidSession(false);
            setIsValidating(false);
            return;
          }

          if (data.session) {
            console.log("✅ Session established from URL tokens");
            setIsValidSession(true);
            setUserEmail(data.session.user.email);
            setIsValidating(false);
            return;
          }
        }

        // If we reach here, no valid session could be established
        console.log("❌ No valid session found, checking for recovery flow...");
        
        // Wait a moment for potential auth state changes
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: newSession } }) => {
            if (newSession) {
              console.log("✅ Session found after delay:", newSession.user.email);
              setIsValidSession(true);
              setUserEmail(newSession.user.email);
              setIsValidating(false);
            } else {
              console.log("❌ Still no session after delay");
              setError("Invalid or expired password reset link. Please request a new one.");
              setIsValidSession(false);
              setIsValidating(false);
            }
          });
        }, 2000);

      } catch (err) {
        console.error("❌ Session validation error:", err);
        setError("Failed to validate reset link. Please request a new one.");
        setIsValidSession(false);
        setIsValidating(false);
      }
    };

    validateSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change:", event, session ? "Session exists" : "No session");
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log("✅ Password recovery session established");
        setIsValidSession(true);
        setUserEmail(session.user.email);
        setIsValidating(false);
      } else if (event === 'SIGNED_OUT') {
        console.log("👋 User signed out");
        setIsValidSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validate password in real-time
  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    if (!isPasswordValid) {
      setError("Password does not meet security requirements");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("🔄 Updating password for user:", userEmail);

      // Use Supabase Auth to update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        console.error("❌ Password update failed:", updateError);
        
        // Handle specific errors
        if (updateError.message?.includes("session_not_found")) {
          setError("Password reset session has expired. Please request a new reset link.");
        } else if (updateError.message?.includes("weak_password")) {
          setError("Password is too weak. Please choose a stronger password.");
        } else if (updateError.message?.includes("same_password")) {
          setError("New password must be different from your current password.");
        } else {
          setError(updateError.message || "Failed to update password. Please try again.");
        }
        return;
      }

      console.log("✅ Password updated successfully");
      
      // Sign out the user so they can log in with new password
      await supabase.auth.signOut();
      
      toast.success("Password updated successfully!");
      navigate("/auth/login", {
        state: { message: "Password updated successfully! Please log in with your new password." }
      });

    } catch (err) {
      console.error("❌ Password reset error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  const handleRequestNewLink = () => {
    navigate("/auth/forgot-password");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  };

  // Loading state while validating session
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Validating Reset Link
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your password reset link...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              
              <div className="space-y-3">
                <Button onClick={handleRequestNewLink} className="w-full">
                  Request New Reset Link
                </Button>
                <Button onClick={handleBackToLogin} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid session - show password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Reset Your Password
          </h1>
          <p className="text-xl text-gray-600">
            Choose a new secure password for your account
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">
              Resetting password for: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 pb-12">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Create New Password
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Your new password must be secure and easy to remember
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-11 pr-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Password strength:</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          passwordStrength <= 2
                            ? "text-red-600"
                            : passwordStrength <= 3
                            ? "text-yellow-600"
                            : passwordStrength <= 4
                            ? "text-blue-600"
                            : "text-green-600"
                        )}
                      >
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          getPasswordStrengthColor()
                        )}
                        style={{ width: `${passwordStrengthPercentage}%` }}
                      />
                    </div>

                    {/* Password Requirements */}
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {[
                        { key: "minLength", label: "At least 8 characters" },
                        { key: "hasUppercase", label: "One uppercase letter" },
                        { key: "hasLowercase", label: "One lowercase letter" },
                        { key: "hasNumber", label: "One number" },
                        { key: "hasSpecialChar", label: "One special character" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          {passwordValidation[key] ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span
                            className={
                              passwordValidation[key] ? "text-green-600" : "text-gray-500"
                            }
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-11 pr-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  formData.password && (
                    <p className="text-sm text-green-600 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Passwords match</span>
                    </p>
                  )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !validateForm()}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToLogin}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;