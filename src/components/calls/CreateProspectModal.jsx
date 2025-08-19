import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase, CURRENT_USER } from "@/lib/supabase";
import { config } from "../../lib/config";
import { useSelector } from "react-redux";

export const CreateProspectModal = ({
  isOpen,
  onClose,
  onProspectCreated,
  companyId,
  selectedCompany,
}) => {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Prospect name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let hubspotDealData = null;

      // Check if user has HubSpot integration and user ID
      const hasHubSpotIntegration =
        hubspotIntegration?.connected &&
        hubspotIntegration?.hubspotUserId &&
        selectedCompany?.hubspot_company_id;

      if (hasHubSpotIntegration) {
        try {
          console.log("🔄 Creating company in HubSpot first...");

          // Call HubSpot API to create company
          const hubspotResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}${
              config.api.endpoints.hubspotDealCreation
            }`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: user.organization_id,
                company_id: selectedCompany?.hubspot_company_id,
                deal_name: formData.name.trim(),
              }),
            }
          );

          if (!hubspotResponse.ok) {
            throw new Error(
              `HubSpot API error: ${hubspotResponse.status} ${hubspotResponse.statusText}`
            );
          }

          const hubspotApiData = await hubspotResponse.json();
          console.log(
            hubspotApiData,
            hubspotApiData?.[0],
            "HubSpot API Response Data"
          );

          // Extract HubSpot company data from API response
          if (hubspotApiData && hubspotApiData.length > 0) {
            hubspotDealData = hubspotApiData[0];
          } else {
            throw new Error("Invalid HubSpot API response format");
          }
        } catch (hubspotError) {
          console.error("❌ Error creating company in HubSpot:", hubspotError);
          toast.error(
            `Failed to create company in HubSpot: ${hubspotError.message}. Creating in database only.`
          );
          // Continue with database creation even if HubSpot fails
        }
      }
      const dealData = {
        name: formData.name.trim(),
        company_id: companyId,
        user_id: user?.id,
        calls: 0,
      };
      console.log(hubspotDealData, "HubSpot Deal Data");
      // Add HubSpot-specific fields if HubSpot creation was successful
      if (hubspotDealData) {
        dealData.hubspot_deal_id = hubspotDealData.id;
        dealData.is_hubspot = true;
        dealData.hubspot_created_at = hubspotDealData?.createdAt
          ? new Date(hubspotDealData?.createdAt).toISOString()
          : new Date().toISOString();
        dealData.hubspot_updated_at = hubspotDealData?.updatedAt
          ? new Date(hubspotDealData?.updatedAt).toISOString()
          : new Date().toISOString();
        dealData.deal_value = 0;

        // Add additional fields from HubSpot if available
        // if (hubspotCompanyData.properties) {
        //   companyData.domain = hubspotCompanyData.properties.domain || formData.domain?.trim() || null;
        //   companyData.industry = hubspotCompanyData.properties.industry || formData.industry?.trim() || null;
        //   companyData.city = hubspotCompanyData.properties.city || formData.city?.trim() || null;
        // }
      } else {
        // For non-HubSpot companies, add form fields if provided
        // companyData.domain = formData.domain?.trim() || null;
        // companyData.industry = formData.industry?.trim() || null;
        // companyData.city = formData.city?.trim() || null;
        dealData.is_hubspot = false;
      }

      const { data, error } = await supabase
        .from("prospect")
        .insert([dealData])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Prospect "${data.name}" created successfully`);
      onProspectCreated(data);
      handleClose();
    } catch (error) {
      console.error("Error creating prospect:", error);
      toast.error("Failed to create prospect: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Create New Deal</span>
          </DialogTitle>
          <DialogDescription>
            Add a new deal to associate with your call transcript.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prospect-name">Deal Name *</Label>
            <Input
              id="prospect-name"
              placeholder="Enter deal name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              aria-describedby={errors.name ? "prospect-name-error" : undefined}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Deal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
