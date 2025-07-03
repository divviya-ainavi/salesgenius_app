import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Users
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AccountSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("user"); // This would come from invitation data
  const [invitationData, setInvitationData] = useState(null);

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

  // Check if user is org admin
  const isOrgAdmin = userRole === "org_admin" || userRole === "super_admin";

  // Load invitation data on component mount
  useEffect(() => {
    const loadInvitationData = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");
      
      if (!token || !email) {
        setError("Invalid invitation link. Please contact your administrator.");
        return;
      }

      try {
        // In a real implementation, you would validate the invitation token
        // and fetch the user's role and organization details
        
        // Mock invitation data - replace with actual API call
        const mockInvitationData = {
          email: email,
          role: "org_admin", // This would come from the invitation
          organizationName: "Acme Corporation",
          invitedBy: "admin@acme.com",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        setInvitationData(mockInvitationData);
        setUserRole(mockInvitationData.role);
        
        // Pre-fill organization name if available
        if (mockInvitationData.organizationName && isOrgAdmin) {
          setFormData(prev => ({
            ...prev,
            companyName: mockInvitationData.organizationName
          }));
        }
      } catch (err) {
        console.error("Error loading invitation data:", err);
        setError("Failed to load invitation details. Please try again.");
      }
    };

    loadInvitationData();
  }, [searchParams, isOrgAdmin]);

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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    // Check required fields
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

    // Check password strength
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    if (!isPasswordValid) {
      setError("Password does not meet security requirements");
      return false;
    }

    // Check org admin specific fields
    if (isOrgAdmin) {
      if (!formData.companyName.trim()) {
        setError("Company name is required");
        return false;
      }
      
      if (!formData.domain.trim()) {
        setError("Domain is required");
        return false;
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(formData.domain)) {
        setError("Please enter a valid domain (e.g., company.com)");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // In a real implementation, you would:
      // 1. Create the user account
      // 2. Set up their profile
      // 3. Create/update organization if org admin
      // 4. Assign appropriate roles and permissions
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Account created successfully!");
      
      // Redirect to login or dashboard
      navigate("/auth/login");
      
    } catch (err) {
      console.error("Account setup error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "super_admin":
        return Shield;
      case "org_admin":
        return Building;
      default:
        return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "org_admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "org_admin":
        return "Organization Administrator";
      default:
        return "User";
    }
  };

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading invitation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(userRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Account Setup
          </h1>
          <p className="text-gray-600">
            You've been invited to join SalesGenius.ai
          </p>
        </div>

        {/* Invitation Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RoleIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Invitation for {invitationData.email}
                  </p>
                  <p className="text-sm text-blue-700">
                    Invited by {invitationData.invitedBy}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", getRoleColor(userRole))}>
                {getRoleLabel(userRole)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Setup Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Account Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isOrgAdmin 
                ? "Set up your account and organization details"
                : "Set up your account details"
              }
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

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Personal Information</h3>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {[
                        { key: 'minLength', label: 'At least 8 characters' },
                        { key: 'hasUppercase', label: 'One uppercase letter' },
                        { key: 'hasLowercase', label: 'One lowercase letter' },
                        { key: 'hasNumber', label: 'One number' },
                        { key: 'hasSpecialChar', label: 'One special character' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          {passwordValidation[key] ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-300" />
                          )}
                          <span className={passwordValidation[key] ? 'text-green-600' : 'text-gray-500'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Organization Information Section - Only for Org Admins */}
              {isOrgAdmin && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Organization Information</h3>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    {/* Domain */}
                    <div className="space-y-2">
                      <Label htmlFor="domain">Company Domain *</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="domain"
                          type="text"
                          placeholder="company.com"
                          value={formData.domain}
                          onChange={(e) => handleInputChange("domain", e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be used for email domain verification
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Complete Account Setup
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSetup;