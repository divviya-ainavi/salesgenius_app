import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import crmService from "@/services/crmService";
import { CURRENT_USER } from "@/lib/supabase";
import { config } from "@/lib/config";

const HubSpotCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Connecting to HubSpot...");
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setMessage(
          `HubSpot connection failed: ${error}${
            errorDescription ? ` - ${errorDescription}` : ""
          }`
        );
        toast.error(`HubSpot connection failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received from HubSpot.");
        toast.error("No authorization code received from HubSpot.");
        return;
      }

      try {
        setMessage("Exchanging authorization code for access token...");

        const result = await crmService.hubspot.connect(code, CURRENT_USER.id);

        if (result.success) {
          setStatus("success");
          setMessage("Successfully connected to HubSpot!");
          setAccountInfo({
            name: result.account_name || "HubSpot Account",
            hubId: result.hub_id || "Unknown",
          });

          toast.success("Successfully connected to HubSpot!");

          // Redirect after a short delay to show success message
          setTimeout(() => {
            navigate("/follow-ups/actions");
          }, 2000);
        } else {
          throw new Error("Connection failed without specific error");
        }
      } catch (err) {
        console.error("Error connecting to HubSpot:", err);
        setStatus("error");
        setMessage(`Failed to connect to HubSpot: ${err.message}`);
        toast.error(`Failed to connect to HubSpot: ${err.message}`);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    const authUrl = `${config.hubspot.authUrl}?client_id=${config.hubspot.clientId}&redirect_uri=${encodeURIComponent(
      config.hubspot.redirectUri
    )}&scope=${encodeURIComponent(config.hubspot.scopes)}`;
    
    window.location.href = authUrl;
  };

  const handleGoToActionItems = () => {
    navigate("/follow-ups/actions");
  };

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "processing" && (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === "error" && (
              <AlertCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "processing" && "Connecting to HubSpot"}
            {status === "success" && "Connection Successful!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{message}</p>

          {accountInfo && status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Account Connected
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  <strong>Account:</strong> {accountInfo.name}
                </p>
                <p>
                  <strong>Hub ID:</strong> {accountInfo.hubId}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {status === "success" && (
              <>
                <Button onClick={handleGoToActionItems} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Action Items
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoToSettings}
                  className="w-full"
                >
                  Go to Settings
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoToSettings}
                  className="w-full"
                >
                  Go to Settings
                </Button>
              </>
            )}

            {status === "processing" && (
              <Button
                variant="outline"
                onClick={handleGoToSettings}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {status === "success" &&
                "You will be redirected automatically in a few seconds."}
              {status === "processing" && "This may take a few moments..."}
              {status === "error" &&
                "Please try again or contact support if the issue persists."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotCallback;
