import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase, authHelpers } from "@/lib/supabase";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { config } from "@/lib/config";
import {
  setUser,
  setUserProfileInfo,
  setUserRole,
  setUserRoleId,
  setIsAuthenticated,
  setHasSeenOnboardingTour,
  setHubspotIntegration,
  setHubspotUserDetails,
} from "@/store/slices/authSlice"; // adjust import path as needed
import { setIsBetaUser } from "@/store/slices/authSlice";
import {
  setOrganizationDetails,
  setTitleName,
} from "../../store/slices/authSlice";
import { dbHelpers } from "../../lib/supabase";
import {
  setAllTitles,
  setAvailablePlans,
  setBusinessKnowledge,
  setBusinessKnowledgeError,
  setBusinessKnowledgeLoading,
  setCurrentPlan,
  setPersonalInsightKnowledge,
  setPlanDetails,
} from "../../store/slices/orgSlice";
import { checkIntegrationStatus } from "../../services/hubspotService";

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
  const { userRole, hubspotIntegration } = useSelector((state) => state.auth);

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

  // console.log("LoginPage rendered", hubspotIntegration);

  const loadPlanData = async (user_id) => {
    try {
      if (user_id) {
        // Get user's current plan from user_plan table with plan_master details
        const userPlanData = await dbHelpers.getUserPlanAndPlanMasters(user_id);

        if (userPlanData && userPlanData.length > 0) {
          // console.log(userPlanData, "user plan data");
          const userPlan = userPlanData[0];
          const planMaster = userPlan.plan_master;

          const endDate = new Date(userPlan.end_date);
          const canceled_at = new Date(userPlan.canceled_at);
          const today = new Date();
          const isDateExpired =
            endDate?.toLocaleDateString("en-CA") <
            today?.toLocaleDateString("en-CA");
          const isStatusExpired =
            userPlan.status === "expired" ||
            userPlan.status === "cancelled" ||
            userPlan.is_active === false;
          const isExpired = isDateExpired || isStatusExpired;
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          );
          // console.log(userPlan, "user plan 109");
          dispatch(setCurrentPlan(planMaster));
          dispatch(
            setPlanDetails({
              ...userPlan,
              // ...planMaster,
              isExpired,
              daysRemaining,
              renewalDate: endDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              canceled_at: canceled_at.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            })
          );
        }
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
    } finally {
      console.log("Finished loading plan data");
    }
  };

  const AllPlan = async () => {
    const plansData = await dbHelpers?.getPlanMasters();

    dispatch(setAvailablePlans(plansData || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let userId = null;
      let profile = null;

      // Try Supabase Auth first
      try {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

        if (authError) {
          console.log(
            "Supabase Auth failed, trying custom auth:",
            authError.message
          );
          // Fall back to custom authentication
          userId = await authHelpers.loginWithCustomPassword(
            formData.email,
            formData.password
          );
        } else {
          // Supabase Auth successful - get profile by auth_user_id
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("auth_user_id", authData.user.id);
          console.log("profileData", profileData);
          if (profileError || !profileData || profileData.length === 0) {
            // Profile not found with auth_user_id, try by email
            const { data: emailProfile, error: emailError } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", formData.email);

            if (emailError || !emailProfile || emailProfile.length === 0) {
              throw new Error("Profile not found for authenticated user");
            }

            // Link the profile to the Supabase Auth user
            const { error: linkError } = await supabase
              .from("profiles")
              .update({ auth_user_id: authData.user.id })
              .eq("id", emailProfile[0].id);

            if (linkError) {
              console.warn("Failed to link profile to auth user:", linkError);
            }

            profile = emailProfile[0];
          } else {
            profile = profileData[0];
          }

          userId = profile.id;
          console.log("Supabase Auth login successful");
        }
      } catch (supabaseError) {
        console.log("Supabase Auth error, using custom auth:", supabaseError);
        // Fall back to custom authentication
        userId = await authHelpers.loginWithCustomPassword(
          formData.email,
          formData.password
        );
      }
      console.log("User ID from auth:", userId);
      if (userId) {
        profile = await authHelpers.getUserProfile(userId);

        if (!profile) throw new Error("User profile not found");

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
          if (roles?.length > 0) {
            dispatch(setUserRole(roles?.filter((x) => x.id == roleId)?.[0]));
          } else {
            dispatch(setUserRole(null));
          }
        }

        // Save cleaned profile to authHelpers and localStorage
        await authHelpers.setCurrentUser(profileWithoutOrgDetails);
        localStorage.setItem("login_timestamp", Date.now().toString());

        // Load onboarding tour status
        let tourStatus = false;
        try {
          tourStatus = await dbHelpers.getOnboardingTourStatus(userId);
          // Set tour status based on database - false means tour will run
          dispatch(setHasSeenOnboardingTour(tourStatus || false));
          console.log("✅ Loaded onboarding tour status:", tourStatus);
        } catch (error) {
          console.warn("⚠️ Failed to load onboarding tour status:", error);
          // Default to false if we can't load the status
          dispatch(setHasSeenOnboardingTour(false));
        }
        loadPlanData(profile.id);
        AllPlan();
        // Load business knowledge data for the organization
        if (profile.organization_id) {
          try {
            console.log(
              "🔍 Loading business knowledge for organization:",
              profile.organization_id
            );
            dispatch(setBusinessKnowledgeLoading(true));
            dispatch(setBusinessKnowledgeError(null));

            const businessKnowledge =
              await dbHelpers.getBusinessKnowledgeByOrgId(
                profile.organization_id
              );
            console.log("business knowledge", businessKnowledge);
            if (businessKnowledge) {
              const cleanedData = businessKnowledge.map(
                ({
                  id,
                  organization_id,
                  user_id,
                  processed_file_ids,
                  is_active,
                  updated_at,
                  created_at,
                  ...rest
                }) => rest
              );
              dispatch(setBusinessKnowledge(cleanedData));
              console.log("✅ Business knowledge loaded successfully");
            } else {
              dispatch(setBusinessKnowledge(null));
              console.log("📭 No business knowledge found for organization");
            }
            const personalKnowledge = await dbHelpers.getPersonalInsights(
              profile.id
            );
            // console.log("business knowledge", businessKnowledge);
            if (personalKnowledge) {
              const cleanedData = personalKnowledge.map(
                ({
                  id,
                  organization_id,
                  user_id,
                  processed_file_ids,
                  is_active,
                  updated_at,
                  created_at,
                  ...rest
                }) => rest
              );
              dispatch(setPersonalInsightKnowledge(cleanedData));
              console.log("✅ Business knowledge loaded successfully");
            } else {
              dispatch(setPersonalInsightKnowledge(null));
              console.log("📭 No business knowledge found for organization");
            }
          } catch (error) {
            console.error("❌ Error loading business knowledge:", error);
            dispatch(setBusinessKnowledgeError(error.message));
            dispatch(setBusinessKnowledge(null));
          } finally {
            dispatch(setBusinessKnowledgeLoading(false));
          }
        }

        // Check HubSpot integration status for the organization
        if (profile.organization_id) {
          try {
            console.log(
              "🔍 Checking HubSpot integration for organization:",
              profile.organization_id
            );
            const hubspotStatus =
              await authHelpers.getOrganizationHubSpotStatus(
                profile.organization_id
              );

            // If HubSpot is connected, get user's HubSpot details
            let hubspotUserDetails = null;
            if (hubspotStatus.connected) {
              console.log("🔍 Getting HubSpot user details for user:", userId);
              hubspotUserDetails = await dbHelpers.getHubSpotUserDetails(
                userId,
                profile.organization_id
              );
              console.log(
                hubspotUserDetails,
                userId,
                profile,
                "HubSpot user details"
              );
              if (hubspotUserDetails) {
                console.log("✅ Found HubSpot user details:", {
                  hubspot_user_id: hubspotUserDetails.hubspot_user_id,
                  email: hubspotUserDetails.email,
                  name: `${hubspotUserDetails.first_name} ${hubspotUserDetails.last_name}`,
                });

                // Store HubSpot user details in Redux
                dispatch(setHubspotUserDetails(hubspotUserDetails));
              } else {
                console.log("📭 No HubSpot user details found for user");
              }
            }
            dispatch(
              setHubspotIntegration({
                connected: hubspotStatus.connected,
                hubspotUserId: hubspotUserDetails?.hubspot_user_id || null,
                hubspotUserDetails: hubspotUserDetails,
                lastSync: hubspotStatus.connected
                  ? new Date().toISOString()
                  : null,
                accountInfo: hubspotStatus.connected
                  ? {
                      maskedToken: hubspotStatus.encryptedToken
                        ? "xxxxx" + hubspotStatus.encryptedToken.slice(-4)
                        : null,
                      userEmail: hubspotUserDetails?.email || null,
                      userName: hubspotUserDetails
                        ? `${hubspotUserDetails.first_name} ${hubspotUserDetails.last_name}`.trim()
                        : null,
                    }
                  : null,
              })
            );

            // Show appropriate message to user
            if (hubspotStatus.connected) {
              console.log("✅ HubSpot integration is active");
              // Optionally show a subtle success message
              // toast.success("HubSpot integration is active");
            } else {
              console.log("⚠️ HubSpot integration not found or incomplete");
              // Optionally show a subtle info message
              // toast.info("HubSpot integration not configured");
            }
          } catch (error) {
            console.error("❌ Error checking HubSpot integration:", error);
            // Set default state on error
            dispatch(
              setHubspotIntegration({
                connected: false,
                lastSync: null,
                accountInfo: null,
                hasToken: false,
                hasUsers: false,
                userCount: 0,
                error: error.message,
              })
            );
          }
        } else {
          console.log("⚠️ No organization ID found for user");
          // Set default state when no organization
          dispatch(
            setHubspotIntegration({
              connected: false,
              hubspotUserId: null,
              hubspotUserDetails: null,
              lastSync: null,
              accountInfo: null,
              hasToken: false,
              hasUsers: false,
              userCount: 0,
              error: "No organization associated with user",
            })
          );
        }
        toast.success("Login successful!");

        // Start Sales Calls tour only for first-time users
        const shouldStartTour = !(tourStatus || false); // If tourStatus is false/null, start tour
        if (shouldStartTour) {
          setTimeout(() => {
            if (window.startSalesCallsTour) {
              console.log("🎯 Starting tour for first-time user");
              window.startSalesCallsTour();
            }
          }, 2000); // 2 second delay to ensure page loads and tour is ready
        } else {
          console.log(
            "👤 Returning user - tour already completed, skipping auto-start"
          );
        }

        navigate("/calls");
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

  console.log("user role", userRole);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SalesGenius Ai
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
                <Link
                  to="/auth/signup"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up here
                </Link>
              </p>
              <button
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
