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
import { supabaseAuthHelpers, authHelpers } from "@/lib/supabase";

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
      const token = searchParams.get("token");

      if (!token) {
        setTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const result = await authHelpers.validateResetToken(token);
        setTokenValid(result.valid);
      } catch (error) {
        console.error("Token validation error:", error);
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const token = searchParams.get("token");
    const accessToken = searchParams.get("access_token");
    
    if (!token && !accessToken) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (accessToken) {
        // Supabase Auth password reset
        result = await supabaseAuthHelpers.updatePassword(formData.password);
      } else {
        // Custom password reset
        result = await authHelpers.resetPassword(token, formData.password);
      }

      if (result.success) {
        toast.success("Password reset successfully!");
        navigate("/auth/login", { 
          state: { message: "Your password has been reset successfully. Please log in with your new password." }
        });
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred while resetting your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
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