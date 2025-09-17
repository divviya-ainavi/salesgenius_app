import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  User,
  Lock,
  Building,
  Globe,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { config } from "@/lib/config";

const CompleteSignup = () => {
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
    name: "",
    companyName: "",
    companyDomain: "",
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

    console.log("🔍 CompleteSignup - All URL parameters:", allParams);
    return allParams;
  }, [location.search, location.hash]);

  // Validate session on component mount
  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    const validateSignupSession = async () => {
      try {
        console.log("🔄 CompleteSignup - Starting validation...");

        const urlParams = parseUrlParameters();

        // Check for errors in URL first
        if (urlParams.error || urlParams.error_description) {
          console.error("❌ CompleteSignup - Error in URL:", urlParams);
          if (isMounted) {
            setError("Verification link is invalid or has expired. Please request a new one.");
            setIsValidSession(false);
            setIsValidating(false);
          }
          return;
        }

        // Method 1: Check if we already have a valid session
        console.log("🔐 CompleteSignup - Checking existing session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session && !sessionError) {
          console.log("✅ CompleteSignup - Found existing session for:", session.user.email);
          if (isMounted) {
            setIsValidSession(true);
            setUserEmail(session.user.email);
            setIsValidating(false);
          }
          return;
        }

        // Method 2: Handle access_token and refresh_token from URL
        if (urlParams.access_token && urlParams.refresh_token) {
          console.log("🔄 CompleteSignup - Setting session from URL tokens...");

          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: urlParams.access_token,
            refresh_token: urlParams.refresh_token,
          });

          if (!setSessionError && data.session) {
            console.log("✅ CompleteSignup - Session established from URL tokens");
            if (isMounted) {
              setIsValidSession(true);
              setUserEmail(data.session.user.email);
              setIsValidating(false);

              // Clean up URL
              window.history.replaceState({}, document.title, "/auth/complete-signup");
            }
            return;
          } else {
            console.error("❌ CompleteSignup - Failed to set session from tokens:", setSessionError);
          }
        }

        // Method 3: Handle single token verification
        if (urlParams.token && urlParams.type === "signup") {
          console.log("🔄 CompleteSignup - Verifying OTP token...");

          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: urlParams.token,
            type: "signup",
          });

          if (!verifyError && data.session) {
            console.log("✅ CompleteSignup - Token verified successfully");
            if (isMounted) {
              setIsValidSession(true);
              setUserEmail(data.session.user.email);
              setIsValidating(false);

              // Clean up URL
              window.history.replaceState({}, document.title, "/auth/complete-signup");
            }
            return;
          } else {
            console.error("❌ CompleteSignup - Token verification failed:", verifyError);
          }
        }

        // Method 4: Listen for auth state changes
        console.log("⏳ CompleteSignup - Setting up auth state listener...");

        authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 CompleteSignup - Auth state change:", event, session ? "Session exists" : "No session");

          if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && isMounted) {
            console.log("✅ CompleteSignup - User signed in during signup flow");
            setIsValidSession(true);
            setUserEmail(session.user.email);
            setIsValidating(false);
          }
        });

        // Set timeout to prevent infinite waiting
        setTimeout(() => {
          if (isMounted && isValidating) {
            console.log("⏰ CompleteSignup - Timeout reached, no valid session found");
            setError("Verification link is invalid or has expired. Please request a new one.");
            setIsValidSession(false);
            setIsValidating(false);
          }
        }, 5000);

      } catch (err) {
        console.error("❌ CompleteSignup - Validation error:", err);
        if (isMounted) {
          setError("Failed to validate verification link. Please request a new one.");
          setIsValidSession(false);
          setIsValidating(false);
        }
      }
    };

    validateSignupSession();

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

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  }, [error]);

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!formData.companyDomain.trim()) {
      setError("Company domain is required");
      return false;
    }
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(formData.companyDomain)) {
      setError("Please enter a valid domain (e.g., company.com)");
      return false;
    }
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
  }, [formData, passwordValidation]);

  // Hash password function
  const hashPassword = (password) => {
    const saltedPassword = password + config.passwordSalt;
    return CryptoJS.SHA256(saltedPassword).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("🔄 CompleteSignup - Creating account for user:", userEmail);

      // Step 1: Update the Supabase Auth user with the new password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        console.error("❌ CompleteSignup - Password update failed:", updateError);
        setError(updateError.message || "Failed to set password. Please try again.");
        return;
      }

      console.log("✅ CompleteSignup - Password updated successfully");

      // Step 2: Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert([
          {
            name: formData.companyName.trim(),
            domain: formData.companyDomain.trim(),
            status_id: 1, // Active status
          },
        ])
        .select()
        .single();

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      console.log("✅ CompleteSignup - Organization created:", newOrg.id);

      // Step 3: Create default titles for the organization
      const titleData = [
        { name: "Org Admin", role_id: 2, organization_id: newOrg.id },
        { name: "Sales Director", role_id: 3, organization_id: newOrg.id },
        { name: "Sales Manager", role_id: 4, organization_id: newOrg.id },
        { name: "Sales Executive", role_id: 5, organization_id: newOrg.id },
      ];

      const { data: insertedTitles, error: titleError } = await supabase
        .from("titles")
        .insert(titleData)
        .select();

      if (titleError) {
        throw new Error(`Failed to create titles: ${titleError.message}`);
      }

      // Get the Org Admin title ID
      const orgAdminTitle = insertedTitles.find(title => title.name === "Org Admin");
      if (!orgAdminTitle) {
        throw new Error("Org Admin title not found after creation.");
      }

      console.log("✅ CompleteSignup - Titles created, Org Admin ID:", orgAdminTitle.id);

      // Step 4: Create user profile
      const hashedPassword = hashPassword(formData.password);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            email: userEmail,
            full_name: formData.name.trim(),
            organization_id: newOrg.id,
            title_id: orgAdminTitle.id,
            status_id: 1, // Active status
            hashed_password: hashedPassword,
            auth_user_id: updateData.user.id, // Link to Supabase Auth user
          },
        ])
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log("✅ CompleteSignup - Profile created successfully");

      // Step 5: Sign out the user so they can login normally
      await supabase.auth.signOut();

      toast.success("Account created successfully! Please log in with your new credentials.");
      navigate("/auth/login", {
        state: {
          message: "Account created successfully! Please log in with your new credentials.",
          email: userEmail,
        },
      });

    } catch (err) {
      console.error("❌ CompleteSignup - Account creation error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = useCallback(() => {
    navigate("/auth/signup");
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
                Validating Verification Link
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your email verification link...
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
                Invalid Verification Link
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>

              <div className="space-y-3">
                <Button onClick={handleBackToSignup} className="w-full">
                  Request New Verification Link
                </Button>
                <Button
                  onClick={() => navigate("/auth/login")}
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

  // Valid session - show profile completion form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-600">
            Just a few more details to get you started
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">
              Setting up account for: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Profile Information
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Tell us about yourself and your company
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

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Personal Information</span>
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <span>Company Information</span>
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm font-semibold text-gray-700">
                    Company Name *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-domain" className="text-sm font-semibold text-gray-700">
                    Company Domain *
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="company-domain"
                      type="text"
                      placeholder="company.com"
                      value={formData.companyDomain}
                      onChange={(e) => handleInputChange("companyDomain", e.target.value)}
                      className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    This will be used for email domain verification and team member invitations
                  </p>
                </div>
              </div>

              {/* Security Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Security</span>
                </h3>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password *
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
                        <span className={cn(
                          "text-sm font-medium",
                          passwordStrength <= 2 ? "text-red-600" :
                          passwordStrength <= 3 ? "text-yellow-600" :
                          passwordStrength <= 4 ? "text-blue-600" : "text-green-600"
                        )}>
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
                            <span className={passwordValidation[key] ? "text-green-600" : "text-gray-500"}>
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
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
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
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                    <p className="text-sm text-green-600 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Account Setup
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToSignup}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Signup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteSignup;