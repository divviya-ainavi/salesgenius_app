import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase, authHelpers } from "@/lib/supabase";
import { supabaseAuthHelpers } from "@/lib/supabase";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { config } from "@/lib/config";
import {
  setUser,
  setUserProfileInfo,
  setUserRole,
  setUserRoleId,
  setIsAuthenticated,
} from "@/store/slices/authSlice"; // adjust import path as needed
import {
  setOrganizationDetails,
  setTitleName,
} from "../../store/slices/authSlice";
import { dbHelpers } from "../../lib/supabase";
import { setAllTitles } from "../../store/slices/orgSlice";

const LoginPage = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  // const { roles } = useSelector((state) => state.org);

  // Compute form validity
  const isFormValid =
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    /\S+@\S+\.\S+/.test(formData.email);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/calls");
      }
    };
    checkAuth();

    // Show success message if redirected from password reset
    if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Try Supabase Authentication first, fallback to custom auth
      const result = await supabaseAuthHelpers.signInWithEmail(
        formData.email,
        formData.password
      );

      if (result.success) {
        const { user, profile, method } = result;

        if (!profile) throw new Error("User profile not found");
        
        console.log(`Login successful via ${method} authentication`);

        // Extract organization_details and remove from profile
        const { organization_details, ...profileWithoutOrgDetails } = profile;

        // Dispatch main profile (without org details)
        dispatch(setUser(profileWithoutOrgDetails));
        dispatch(setIsAuthenticated(true));
        dispatch(setUserProfileInfo(profile.full_name || profile.email));
        const titles = await dbHelpers?.getTitles(organization_details?.id);
        dispatch(setAllTitles(titles));
        // Store organization_details separately
        if (organization_details) {
          dispatch(setOrganizationDetails(organization_details));

          // Optionally send to DB
          // await yourApi.saveOrganizationDetails(organization_details);
        }

        // Set title & role
        if (profile.title_name) {
          dispatch(setTitleName(profile.title_name));
        } else {
          dispatch(setTitleName(""));
        }
        if (profile.title_id) {
          const roles = await dbHelpers.getRoles();
          const roleId = await dbHelpers.getRoleIdByTitleId(profile.title_id);
          dispatch(setUserRoleId(roleId));
          // console.log(
          //   "Role details 120:",
          //   roles,
          //   roles?.filter((x) => x.id == roleId)
          // );
          if (roles?.length > 0) {
            dispatch(setUserRole(roles?.filter((x) => x.id == roleId)?.[0]));
          } else {
            dispatch(setUserRole(null));
          }
        }

        // Save cleaned profile to authHelpers and localStorage
        await authHelpers.setCurrentUser({ ...profileWithoutOrgDetails, id: user.id });
        localStorage.setItem("login_timestamp", Date.now().toString());

        toast.success("Login successful!");
        navigate("/calls");
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle specific error types
      if (error.message === "Invalid login credentials") {
        setError("Invalid email or password. Please try again.");
      } else if (error.message === "Email not confirmed") {
        setError("Please confirm your email address before logging in.");
      } else if (error.message === "Too many requests") {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError(
          error.message || "An error occurred during login. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your account to continue
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
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
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
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => toast.info("Registration coming soon!")}
                >
                  Contact your administrator
                </button>
              </p>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => navigate("/auth/forgot-password")}
              >
                Forgot your password?
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
