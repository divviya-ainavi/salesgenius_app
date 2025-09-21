import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  Crown,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase, dbHelpers } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { config } from "@/lib/config";

const AccountSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState(null);
  const [displayRoleLabel, setDisplayRoleLabel] = useState("User");
  const [showOrgFields, setShowOrgFields] = useState(false);
  const [userType, setUserType] = useState(null);

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

  const decodeJWT = (token, secret = config.jwtSecret) => {
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
    const saltedPassword = password + config.passwordSalt;
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
        const daysSinceInvite =
          (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60 * 24);

        if (invite.status == "completed") {
          setError("This invitation has already been used.");
          return;
        } else if (daysSinceInvite > 7) {
          setError("Invitation has expired. Please request a new invitation.");
          return;
        }

        setInviteData(invite);
        setUserType(invite.type); // Store user type

        // Determine if organization fields should be shown
        const hasOrgId = !!invite.organization_id;
        const hasTitleId = !!invite.title_id;
        
        // Show organization fields only if neither organization_id nor title_id are present
        setShowOrgFields(!hasOrgId && !hasTitleId);

        // Set the display role label
        const roleLabel = await getRoleLabel(invite);
        setDisplayRoleLabel(roleLabel);
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

  const validateForm = () => {
    // Validate Organization Details (if shown)
    if (showOrgFields) {
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

    // Validate User Details
    if (!formData.username.trim()) {
      setError("Full name is required");
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let organizationId = inviteData.organization_id;

      // Step 1: Create organization if needed
      if (showOrgFields && !organizationId) {
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

        // Step 1.1: Insert 4 titles for this new organization
        const titleData = [
          { name: "Org Admin", role_id: 2, organization_id: organizationId },
          {
            name: "Sales Director",
            role_id: 3,
            organization_id: organizationId,
          },
          {
            name: "Sales Manager",
            role_id: 4,
            organization_id: organizationId,
          },
          {
            name: "Sales Executive",
            role_id: 5,
            organization_id: organizationId,
          },
        ];

        const { data: insertedTitles, error: titleError } = await supabase
          .from("titles")
          .insert(titleData)
          .select();

        if (titleError) {
          throw new Error(`Failed to insert titles: ${titleError.message}`);
        }

        // Step 1.2: Get the ID of the Org Admin title
        const orgAdminTitle = insertedTitles.find(
          (title) => title.name === "Org Admin"
        );
        if (!orgAdminTitle) {
          throw new Error("Org Admin title not found after insertion.");
        }

        inviteData.title_id = orgAdminTitle.id; // Assign it for use in profile creation
      }

      // Step 2: Create Supabase Auth user
      let supabaseAuthUserId = null;
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: inviteData.email,
            password: formData.password,
          }
        );

        if (authError) {
          console.warn("Supabase Auth signup failed:", authError.message);
          // Continue with custom auth flow
        } else {
          supabaseAuthUserId = authData.user?.id;
          console.log(
            "Supabase Auth user created successfully:",
            supabaseAuthUserId
          );
        }
      } catch (authError) {
        console.warn("Supabase Auth signup error:", authError);
        // Continue with custom auth flow
      }

      // Step 3: Create user profile (with both custom and Supabase auth support)
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
            auth_user_id: supabaseAuthUserId, // Link to Supabase Auth user if created
          },
        ])
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Step 4: Update invite status to completed
      const { error: updateError } = await supabase
        .from("invites")
        .update({
          organization_id: organizationId,
          title_id: inviteData.title_id || null,
          status: "completed",
        })
        .eq("email", inviteData.email);

      if (updateError) {
        console.warn("Failed to update invite status:", updateError);
      }

      // Step 5: Create plan based on user type
      try {
        const today = new Date();
        const userType = inviteData.type; // 'beta' for self-signup, null for admin invite
        
        let planName, endDate, numberOfDays;
        
        if (userType === 'beta') {
          // Beta user: 30-day trial
          planName = 'Beta Trial';
          endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from today
          numberOfDays = 30;
        } else {
          // Admin invited user: 1-year plan
          planName = 'Standard Plan';
          endDate = new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from today
          numberOfDays = 365;
        }

        const { data: planData, error: planError } = await supabase
          .from("plan")
          .insert([
            {
              user_id: profile.id,
              plan_name: planName,
              start_date: today.toISOString().split('T')[0], // YYYY-MM-DD format
              end_date: endDate.toISOString().split('T')[0], // YYYY-MM-DD format
              no_of_days: numberOfDays,
            },
          ])
          .select()
          .single();

        if (planError) {
          console.warn("Failed to create user plan:", planError);
          // Don't throw error - account creation should still succeed
        } else {
          console.log("✅ User plan created successfully:", planData);
        }
      } catch (planCreationError) {
        console.warn("Error creating user plan:", planCreationError);
        // Don't throw error - account creation should still succeed
      }

      // Step 6: Sign out from Supabase Auth (user will login manually)
      if (supabaseAuthUserId) {
        await supabase.auth.signOut();
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

  const getRoleLabel = async (invite = inviteData) => {
    if (invite?.title_id) {
      const title = await dbHelpers.getRoleIdByTitleName(
        invite.title_id,
        invite?.organization_id
      );
      return title || "User";
    } else if (invite?.organization_id && !invite?.title_id) {
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

  const getUserTypeInfo = () => {
    if (userType === 'beta') {
      return {
        icon: Sparkles,
        label: "Beta Trial",
        description: "30-day free trial",
        color: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-800"
      };
    } else {
      return {
        icon: Crown,
        label: "Team Member",
        description: "Full access",
        color: "from-blue-500 to-indigo-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800"
      };
    }
  };

  // Loading state
  if (isLoading && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
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
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Invalid Invitation
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button 
                onClick={() => navigate("/auth/login")} 
                variant="outline"
                className="px-6 py-2.5"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeInfo = getUserTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-auto">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 pt-8 pb-6">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${typeInfo.color} rounded-3xl mb-6 shadow-2xl`}>
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Welcome to SalesGenius.ai
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Let's set up your account and unlock the power of AI-driven sales insights
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Invitation Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Invitation Card */}
            <Card className={`border-0 shadow-xl ${typeInfo.bgColor} ${typeInfo.borderColor} border-2`}>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${typeInfo.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                    <TypeIcon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {typeInfo.label}
                    </h3>
                    <p className={`text-sm font-medium ${typeInfo.textColor}`}>
                      {typeInfo.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">
                        {inviteData?.email}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Setting up as {displayRoleLabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Preview */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-center">
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">AI Call Analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Smart Follow-ups</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">CRM Integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">Sales Analytics</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Setup Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-xl">
                <CardTitle className="text-2xl font-bold text-center text-gray-900">
                  Complete Your Account Setup
                </CardTitle>
                <p className="text-center text-gray-600 mt-2">
                  Just a few details to get you started
                </p>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className="text-red-800 font-medium">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Organization Section (conditional) */}
                  {showOrgFields && (
                    <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Organization Details
                          </h3>
                          <p className="text-sm text-gray-600">
                            Set up your company information
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Company Name */}
                        <div className="space-y-3">
                          <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <Building className="w-4 h-4" />
                            <span>Company Name</span>
                          </Label>
                          <Input
                            id="companyName"
                            type="text"
                            placeholder="Enter your company name"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange("companyName", e.target.value)}
                            className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
                            disabled={isLoading}
                            required={showOrgFields}
                          />
                        </div>

                        {/* Domain */}
                        <div className="space-y-3">
                          <Label htmlFor="domain" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>Company Domain</span>
                          </Label>
                          <Input
                            id="domain"
                            type="text"
                            placeholder="company.com"
                            value={formData.domain}
                            onChange={(e) => handleInputChange("domain", e.target.value)}
                            className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
                            disabled={isLoading}
                            required={showOrgFields}
                          />
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>This will be used for team member invitations and domain verification</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* User Details Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Personal Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tell us about yourself
                        </p>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-3">
                      <Label htmlFor="username" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <UserCheck className="w-4 h-4" />
                        <span>Full Name</span>
                      </Label>
                      <Input
                        autoComplete="off"
                        id="username"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Create Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          autoComplete="off"
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm pr-12"
                          disabled={isLoading}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
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
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Password strength:
                            </span>
                            <span
                              className={cn(
                                "text-sm font-bold",
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
                          
                          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                            <div
                              className={cn(
                                "h-3 rounded-full transition-all duration-500 shadow-sm",
                                getPasswordStrengthColor()
                              )}
                              style={{ width: `${passwordStrengthPercentage}%` }}
                            />
                          </div>

                          {/* Password Requirements Grid */}
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            {[
                              { key: "minLength", label: "At least 8 characters" },
                              { key: "hasUppercase", label: "One uppercase letter" },
                              { key: "hasLowercase", label: "One lowercase letter" },
                              { key: "hasNumber", label: "One number" },
                              { key: "hasSpecialChar", label: "One special character" },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center space-x-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
                                  passwordValidation[key] 
                                    ? "bg-green-100 border-2 border-green-500" 
                                    : "bg-gray-100 border-2 border-gray-300"
                                )}>
                                  {passwordValidation[key] && (
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  )}
                                </div>
                                <span className={cn(
                                  "font-medium transition-colors duration-200",
                                  passwordValidation[key] ? "text-green-700" : "text-gray-500"
                                )}>
                                  {label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Confirm Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          autoComplete="off"
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm pr-12"
                          disabled={isLoading}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {formData.confirmPassword && (
                        <div className="flex items-center space-x-2">
                          {formData.password === formData.confirmPassword ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-700 font-medium">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-8">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Creating Your Account...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 mr-3" />
                          Complete Setup & Get Started
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    By creating an account, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetup;