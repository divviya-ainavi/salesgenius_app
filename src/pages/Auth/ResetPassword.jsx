import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authHelpers, supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

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

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      // Check for Supabase Auth errors first
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");
      
      if (error) {
        console.error("Supabase Auth error:", { error, errorCode, errorDescription });
        
        // Handle specific Supabase Auth errors
        if (error === "access_denied") {
          setError("Access denied. The password reset link may have expired or been used already.");
        } else if (errorCode === "otp_expired") {
          setError("Password reset link has expired. Please request a new one.");
        } else if (errorDescription) {
          setError(`Reset failed: ${errorDescription}`);
        } else {
          setError("Password reset link is invalid or has expired. Please request a new one.");
        }
        
        setTokenValid(false);
        setIsValidating(false);
        return;
      }
      
      // Check if this is a Supabase Auth password reset
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const type = searchParams.get("type");
      
      // Check for custom token (legacy flow)
      const customToken = searchParams.get("token");

      if (type === "recovery" && accessToken && refreshToken) {
        // This is a Supabase Auth password reset
        try {
          console.log("Setting Supabase session for password reset...");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error("Error setting Supabase session:", error);
            setError(`Session error: ${error.message}`);
            setTokenValid(false);
          } else {
            console.log("Supabase session set successfully for password reset");
            setTokenValid(true);
          }
        } catch (error) {
          console.error("Supabase session error:", error);
          setError(`Failed to validate reset link: ${error.message}`);
          setTokenValid(false);
        }
      } else if (customToken) {
        // This is a custom token (legacy flow)
        try {
          console.log("Validating custom reset token...");
          const result = await authHelpers.validateResetToken(customToken);
          if (result.valid) {
            setTokenValid(true);
          } else {
            setError("Custom reset token is invalid or has expired.");
            setTokenValid(false);
          }
        } catch (error) {
          console.error("Custom token validation error:", error);
          setError(`Token validation failed: ${error.message}`);
          setTokenValid(false);
        }
      } else {
        // No valid token found
        setError("No valid reset token found. Please request a new password reset link.");
        setTokenValid(false);
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [searchParams]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if this is Supabase Auth or custom flow
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");
    const customToken = searchParams.get("token");

    setIsLoading(true);

    try {
      if (type === "recovery" && accessToken) {
        // Use Supabase Auth password update
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (error) {
          throw new Error(`Supabase password update failed: ${error.message}`);
        }

        console.log("Password updated successfully via Supabase Auth");
        toast.success("Password reset successfully!");
        
        // Sign out to force fresh login
        await supabase.auth.signOut();
        
        navigate("/auth/login", { 
          state: { message: "Your password has been reset successfully. Please log in with your new password." }
        });
      } else if (customToken) {
        // Use custom password reset flow
        const result = await authHelpers.resetPassword(customToken, formData.password);

        if (result.success) {
          toast.success("Password reset successfully!");
          navigate("/auth/login", { 
            state: { message: "Your password has been reset successfully. Please log in with your new password." }
          });
        } else {
          setError(result.error || "Failed to reset password");
        }
      } else {
        setError("Invalid reset token or session");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      
      // Handle specific Supabase errors
      if (error.message?.includes("session_not_found")) {
        setError("Password reset session has expired. Please request a new reset link.");
      } else if (error.message?.includes("same_password")) {
        setError("New password must be different from your current password.");
      } else {
        setError(error.message || "An error occurred while resetting your password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getResetMethod = () => {
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");
    const customToken = searchParams.get("token");
    
    if (type === "recovery" && accessToken) {
      return "Supabase Auth";
    } else if (customToken) {
      return "Custom Flow";
    }
    return "Unknown";
  };

  // Show reset method indicator in development
  const showDebugInfo = import.meta.env.DEV;

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
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
              {showDebugInfo && (
                <p className="text-xs text-muted-foreground mt-2">
                  Method: {getResetMethod()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/auth/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth/login")}
                  className="w-full"
                >
                  Back to Login
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
          <p className="text-gray-600">Create Your New Password</p>
          {showDebugInfo && (
            <p className="text-xs text-muted-foreground mt-1">
              Reset Method: {getResetMethod()}
            </p>
          )}
        </div>

        {/* Reset Password Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span>Reset Password</span>
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your new password below
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

              {/* New Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
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
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
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
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !formData.password ||
                  !formData.confirmPassword ||
                  formData.password !== formData.confirmPassword ||
                  !Object.values(passwordValidation).every(Boolean) ||
                  isLoading
                }
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
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

export default ResetPassword;