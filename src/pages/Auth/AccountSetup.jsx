import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Users,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase, dbHelpers } from "@/lib/supabase";
import CryptoJS from "crypto-js";

const AccountSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepperConfig, setStepperConfig] = useState({
    showOrgStep: false,
    showUserStep: true,
    totalSteps: 1,
  });

  // Form data state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    domain: "",
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

  const decodeJWT = (token, secret = "SG") => {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split(".");

      const base64UrlDecode = (str) => {
        return JSON.parse(atob(str.replace(/-/g, "+").replace(/_/g, "/")));
      };

      // Decode header and payload
      const header = base64UrlDecode(encodedHeader);
      const payload = base64UrlDecode(encodedPayload);

      // Recreate signature to verify
      const expectedSignature = btoa(
        `${encodedHeader}.${encodedPayload}.${secret}`
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const isValid = signature === expectedSignature;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      return {
        email: payload?.email,
        isExpired,
        isValid,
      };
    } catch (error) {
      console.error("JWT decode error:", error);
      return { email: null, isExpired: true, isValid: false };
    }
  };

  // Hash password function
  const hashPassword = (password) => {
    const saltedPassword = password + "SG_2025";
    return CryptoJS.SHA256(saltedPassword).toString();
  };

  // Load invitation data on component mount
  useEffect(() => {
    const loadInvitationData = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("Invalid invitation link. Please contact your administrator.");
        return;
      }

      const decodedToken = decodeJWT(token);

      if (
        !decodedToken.isValid ||
        decodedToken.isExpired ||
        !decodedToken.email
      ) {
        setError(
          "Invalid or expired invitation link. Please contact your administrator."
        );
        return;
      }

      try {
        setIsLoading(true);

        // Fetch invite details from database
        const { data: invite, error: inviteError } = await supabase
          .from("invites")
          .select("*")
          .eq("email", decodedToken.email)
          .single();

        if (inviteError || !invite) {
          setError("Invitation not found. Please contact your administrator.");
          return;
        }

        // Check if invite is still valid
        const inviteDate = new Date(invite.invited_at);
        const now = new Date();
        const hoursSinceInvite =
          (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceInvite > 24) {
          setError("Invitation has expired. Please request a new invitation.");
          return;
        }

        setInviteData(invite);

        // Determine stepper configuration based on invite data
        const hasOrgId = !!invite.organization_id;
        const hasTitleId = !!invite.title_id;

        let config = {
          showOrgStep: false,
          showUserStep: true,
          totalSteps: 1,
        };

        if (hasOrgId && hasTitleId) {
          // Case 1: Both organization_id and title_id present - Show only User Details
          config = {
            showOrgStep: false,
            showUserStep: true,
            totalSteps: 1,
          };
        } else if (!hasOrgId && !hasTitleId) {
          // Case 2: Neither organization_id nor title_id - Show Organization Details + User Details
          config = {
            showOrgStep: true,
            showUserStep: true,
            totalSteps: 2,
          };
        } else if (hasOrgId && !hasTitleId) {
          // Case 3: Only organization_id present - Show only User Details
          config = {
            showOrgStep: false,
            showUserStep: true,
            totalSteps: 1,
          };
        }

        setStepperConfig(config);
      } catch (err) {
        console.error("Error loading invitation data:", err);
        setError("Failed to load invitation details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitationData();
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

  const validateCurrentStep = () => {
    const isOrgStep = stepperConfig.showOrgStep && currentStep === 1;
    const isUserStep =
      (stepperConfig.showOrgStep && currentStep === 2) ||
      (!stepperConfig.showOrgStep && currentStep === 1);

    if (isOrgStep) {
      // Validate Organization Details
      if (!formData.companyName.trim()) {
        setError("Company name is required");
        return false;
      }
      if (!formData.domain.trim()) {
        setError("Domain is required");
        return false;
      }
      const domainRegex =
        /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(formData.domain)) {
        setError("Please enter a valid domain (e.g., company.com)");
        return false;
      }
    }

    if (isUserStep) {
      // Validate User Details
      if (!formData.username.trim()) {
        setError("Username is required");
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
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setError("");
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCurrentStep()) return;

    setIsLoading(true);

    try {
      let organizationId = inviteData.organization_id;

      // Step 1: Create organization if needed
      if (stepperConfig.showOrgStep && !organizationId) {
        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert([
            {
              name: formData.companyName,
              domain: formData.domain,
              status_id: 1, // Active status
            },
          ])
          .select()
          .single();

        if (orgError) {
          throw new Error(`Failed to create organization: ${orgError.message}`);
        }

        organizationId = newOrg.id;
      }

      // Step 2: Create user profile
      const hashedPassword = hashPassword(formData.password);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            email: inviteData.email,
            full_name: formData.username,
            organization_id: organizationId,
            title_id: inviteData.title_id || null,
            status_id: 1, // Active status
            hashed_password: hashedPassword,
          },
        ])
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Step 3: Update invite status to completed
      const { error: updateError } = await supabase
        .from("invites")
        .update({
          status: "completed",
          // updated_at: new Date().toISOString()
        })
        .eq("email", inviteData.email);

      if (updateError) {
        console.warn("Failed to update invite status:", updateError);
        // Don't throw error as account creation was successful
      }

      toast.success("Account created successfully!");
      navigate("/auth/login");
    } catch (err) {
      console.error("Account setup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (stepperConfig.showOrgStep) {
      return currentStep === 1 ? "Organization Details" : "User Details";
    } else {
      return "User Details";
    }
  };

  const getStepDescription = () => {
    if (stepperConfig.showOrgStep) {
      return currentStep === 1
        ? "Set up your organization information"
        : "Create your secure login credentials";
    } else {
      return "Create your secure login credentials";
    }
  };

  const getRoleLabel = () => {
    if (inviteData?.title_id) {
      return "Team Member";
    } else if (inviteData?.organization_id && !inviteData?.title_id) {
      return "Organization Member";
    } else {
      return "Organization Administrator";
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

  // Loading state
  if (isLoading && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Invitation
              </h3>
              <p className="text-gray-600">
                Verifying your invitation details...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invalid Invitation
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate("/auth/login")} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = (currentStep / stepperConfig.totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to SalesGenius.ai
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Let's set up your account and get you started
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {stepperConfig.totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        {/* Invitation Info Card */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {inviteData?.email}
                  </p>
                  <p className="text-gray-600">
                    Setting up as {getRoleLabel()}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-200"
              >
                <Users className="w-4 h-4 mr-2" />
                {getRoleLabel()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Setup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              {getStepTitle()}
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              {getStepDescription()}
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

              {/* Step 1: Organization Details (when needed) */}
              {stepperConfig.showOrgStep && currentStep === 1 && (
                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="companyName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="domain"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Company Domain
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="domain"
                        type="text"
                        placeholder="company.com"
                        value={formData.domain}
                        onChange={(e) =>
                          handleInputChange("domain", e.target.value)
                        }
                        className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      This will be used for email domain verification and team
                      member invitations
                    </p>
                  </div>
                </div>
              )}

              {/* User Details Step */}
              {((stepperConfig.showOrgStep && currentStep === 2) ||
                (!stepperConfig.showOrgStep && currentStep === 1)) && (
                <div className="space-y-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        className="pl-11 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Password
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
                            {
                              key: "minLength",
                              label: "At least 8 characters",
                            },
                            {
                              key: "hasUppercase",
                              label: "One uppercase letter",
                            },
                            {
                              key: "hasLowercase",
                              label: "One lowercase letter",
                            },
                            { key: "hasNumber", label: "One number" },
                            {
                              key: "hasSpecialChar",
                              label: "One special character",
                            },
                          ].map(({ key, label }) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2"
                            >
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
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="px-6"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < stepperConfig.totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
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

export default AccountSetup;
