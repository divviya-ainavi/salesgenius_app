import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { dbHelpers, CURRENT_USER, authHelpers } from "@/lib/supabase";
import { config } from "../../lib/config";

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Email validation
  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const isFormValid = email.trim() !== "" && isValidEmail;

  const checkEmailExists = async (email) => {
    try {
      // Check if email exists in profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email.toLowerCase());

      if (error) {
        throw error;
      }

      return data && data.length > 0; // Returns true if email exists
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false; // Assume email doesn't exist on error
    }
  };

  const createJWT = (payload, secret = "SG", type) => {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const base64UrlEncode = (obj) => {
      return btoa(JSON.stringify(obj))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };

    // Set expiration time for 24 hours if type is 'invite'
    const now = Math.floor(Date.now() / 1000);
    const payloadWithExp = {
      ...payload,
      ...(type === "invite" && { exp: now + 86400 }), // 86400 seconds = 24 hours
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payloadWithExp);

    const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Checking if email exists:", email);

      // Check if email is already registered
      const emailExists = await checkEmailExists(email);

      if (emailExists) {
        setError("Email is already in use.");
        toast.error(
          "Email is already in use. Please try a different email or login instead."
        );
        return;
      }

      const token = createJWT({ email }, "SG", "invite");

      const result = await dbHelpers.inviteUserByEmail(
        email,
        null,
        null,
        token,
        null,
        "beta" // Add type as 'beta' for self-signup
      );

      if (result.status === "invited" || result.status === "re-invited") {
        const formData = new FormData();
        formData.append("id", result?.id);
        const response = await fetch(
          `${config.api.baseUrl}${config.api.endpoints.userInviteProd}`,
          {
            method: "POST",
            body: formData,
          }
        );
        // console.log(response, "check response");
        const message = `Account setup link ${
          result.status === "re-invited" ? "re-" : ""
        }sent to ${email}! Check your email to complete registration.`;

        setSuccessMessage(message);
        setIsSuccess(true);
        setIsLoading(false);

        // Also show toast for additional feedback
        toast.success(message);
        // console.log("Invite ID:", result.id); // optional for webhook trigger
      } else if (result.status === "registered") {
        const message =
          "This email is already registered. Please use the login page instead.";
        setError(message);
        setIsLoading(false);
        toast.info(message);
      } else if (result.status === "already-invited") {
        const message =
          "Account setup link was already sent to this email within the last 24 hours. Please check your email.";
        setSuccessMessage(message);
        setIsSuccess(true);
        setIsLoading(false);
        toast.info(message);
      } else {
        const message = result.message || "Failed to send account setup link";
        setError(message);
        setIsLoading(false);
        toast.error(message);
      }
      // console.log("✅ Email is available for registration");
      // toast.success("Account setup link sent! Please check your email to complete registration.");

      // Here you would typically send a verification email
      // For now, we'll just show a success message
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError("An error occurred while checking email. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // If signup was successful, show success screen
  if (isSuccess) {
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

          {/* Success Card */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600">
                    We've sent an account setup link to:
                  </p>
                  <p className="font-medium text-gray-900 mt-1">{email}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-900">
                        What to do next:
                      </p>
                      <ul className="text-sm text-green-800 mt-1 space-y-1">
                        <li>• Check your email inbox</li>
                        <li>• Look for an email from SalesGenius Ai</li>
                        <li>• Click the "Complete Setup" link</li>
                        <li>• Check your spam folder if you don't see it</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail("");
                      setSuccessMessage("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Another Email
                  </Button>

                  <Link to="/auth/login" className="block w-full">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>

                <p className="text-xs text-gray-500">
                  The setup link will expire in 24 hours for security reasons.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        {/* Signup Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your email to get started
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
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                      if (isSuccess) setIsSuccess(false);
                    }}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
                {email && !isValidEmail && (
                  <p className="text-sm text-red-600">
                    Please enter a valid email address
                  </p>
                )}
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
                    Checking Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Continue with Email
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
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

export default SignupPage;
