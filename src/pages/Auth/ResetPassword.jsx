import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  // Component states
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
  const passwordStrength =
    Object.values(passwordValidation).filter(Boolean).length;
  const passwordStrengthPercentage = (passwordStrength / 5) * 100;

  // Parse URL parameters from both search and hash
  const parseUrlParameters = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));

    const allParams = {};

    // Add search params
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }

    // Add hash params (Supabase often uses hash for auth tokens)
    for (const [key, value] of hashParams.entries()) {
      allParams[key] = value;
    }

    console.log("🔍 ResetPassword - All URL parameters:", allParams);
    console.log("🔍 ResetPassword - Current URL:", window.location.href);
    console.log("🔍 ResetPassword - Hash:", window.location.hash);
    console.log("🔍 ResetPassword - Search:", window.location.search);

    return allParams;
  }, [location.search, location.hash]);

  // Validate session on component mount
  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    const validateResetSession = async () => {
      try {
        console.log("🔄 ResetPassword - Starting validation...");

        const urlParams = parseUrlParameters();

        // Check for errors in URL first
        if (urlParams.error || urlParams.error_description) {
          console.error("❌ ResetPassword - Error in URL:", urlParams);
          if (isMounted) {
            setError(
              "Password reset link is invalid or has expired. Please request a new one."
            );
            setIsValidSession(false);
            setIsValidating(false);
          }
          return;
        }

        // Method 1: Check if we already have a valid session
        console.log("🔐 ResetPassword - Checking existing session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (session && !sessionError) {
          console.log(
            "✅ ResetPassword - Found existing session for:",
            session.user.email
          );
          if (isMounted) {
            setIsValidSession(true);
            setUserEmail(session.user.email);
            setIsValidating(false);
          }
          return;
        }

        // Method 2: Handle access_token and refresh_token from URL
        if (urlParams.access_token && urlParams.refresh_token) {
          console.log("🔄 ResetPassword - Setting session from URL tokens...");

          const { data, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: urlParams.access_token,
              refresh_token: urlParams.refresh_token,
            });

          if (!setSessionError && data.session) {
            console.log(
              "✅ ResetPassword - Session established from URL tokens"
            );
            window.history.replaceState(
              {},
              document.title,
              "/auth/reset-password"
            );
            window.location.reload(); // ✅ force reload to apply session
            if (isMounted) {
              setIsValidSession(true);
              setUserEmail(data.session.user.email);
              setIsValidating(false);

              // Clean up URL
              window.history.replaceState(
                {},
                document.title,
                "/auth/reset-password"
              );
            }
            return;
          } else {
            console.error(
              "❌ ResetPassword - Failed to set session from tokens:",
              setSessionError
            );
          }
        }

        // Method 3: Handle single token verification
        if (urlParams.token && urlParams.type === "recovery") {
          console.log("🔄 ResetPassword - Verifying OTP token...");

          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: urlParams.token,
            type: "recovery",
          });

          if (!verifyError && data.session) {
            console.log("✅ ResetPassword - Token verified successfully");
            if (isMounted) {
              setIsValidSession(true);
              setUserEmail(data.session.user.email);
              setIsValidating(false);

              // Clean up URL
              window.history.replaceState(
                {},
                document.title,
                "/auth/reset-password"
              );
            }
            return;
          } else {
            console.error(
              "❌ ResetPassword - Token verification failed:",
              verifyError
            );
          }
        }

        // Method 4: Listen for auth state changes (Supabase might be processing)
        console.log("⏳ ResetPassword - Setting up auth state listener...");

        authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log(
            "🔄 ResetPassword - Auth state change:",
            event,
            session ? "Session exists" : "No session"
          );

          if (event === "PASSWORD_RECOVERY" && session && isMounted) {
            console.log(
              "✅ ResetPassword - Password recovery session established"
            );
            setIsValidSession(true);
            setUserEmail(session.user.email);
            setIsValidating(false);
          } else if (event === "SIGNED_IN" && session && isMounted) {
            console.log("✅ ResetPassword - User signed in during reset flow");
            setIsValidSession(true);
            setUserEmail(session.user.email);
            setIsValidating(false);
          }
        });

        // Set timeout to prevent infinite waiting
        setTimeout(() => {
          if (isMounted && isValidating) {
            console.log(
              "⏰ ResetPassword - Timeout reached, no valid session found"
            );
            setError(
              "Password reset link is invalid or has expired. Please request a new one."
            );
            setIsValidSession(false);
            setIsValidating(false);
          }
        }, 5000);
      } catch (err) {
        console.error("❌ ResetPassword - Validation error:", err);
        if (isMounted) {
          setError("Failed to validate reset link. Please request a new one.");
          setIsValidSession(false);
          setIsValidating(false);
        }
      }
    };

    validateResetSession();

    // Cleanup function
    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [parseUrlParameters, isValidating]);

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

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (error) setError("");
    },
    [error]
  );

  const validateForm = useCallback(() => {
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
  }, [formData.password, formData.confirmPassword, passwordValidation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("🔄 ResetPassword - Updating password for user:", userEmail);

      // Use Supabase Auth to update password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        console.error(
          "❌ ResetPassword - Password update failed:",
          updateError
        );

        // Handle specific errors
        if (updateError.message?.includes("session_not_found")) {
          setError(
            "Password reset session has expired. Please request a new reset link."
          );
        } else if (updateError.message?.includes("weak_password")) {
          setError("Password is too weak. Please choose a stronger password.");
        } else if (updateError.message?.includes("same_password")) {
          setError(
            "New password must be different from your current password."
          );
        } else {
          setError(
            updateError.message ||
              "Failed to update password. Please try again."
          );
        }
        return;
      }

      console.log("✅ ResetPassword - Password updated successfully:", data);

      // Sign out the user so they can log in with new password
      await supabase.auth.signOut();

      toast.success("Password updated successfully!");
      navigate("/auth/login", {
        state: {
          message:
            "Password updated successfully! Please log in with your new password.",
        },
      });
    } catch (err) {
      console.error("❌ ResetPassword - Password reset error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = useCallback(() => {
    navigate("/auth/login");
  }, [navigate]);

  const handleRequestNewLink = useCallback(() => {
    navigate("/auth/forgot-password");
  }, [navigate]);

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
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full"
                >
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
              Resetting password for:{" "}
              <span className="font-medium">{userEmail}</span>
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
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
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
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Password strength:
                      </span>
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
                        {
                          key: "hasSpecialChar",
                          label: "One special character",
                        },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          {passwordValidation[key] ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span
                            className={
                              passwordValidation[key]
                                ? "text-green-600"
                                : "text-gray-500"
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-gray-700"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
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
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
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
              <Button type="submit" disabled={isLoading}>
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
