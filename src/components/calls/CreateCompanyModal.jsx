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
import { Loader2, Building } from "lucide-react";
import { toast } from "sonner";
import { supabase, CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { config } from "../../lib/config";

export const CreateCompanyModal = ({ isOpen, onClose, onCompanyCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    industry: "",
    city: "",
  });
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      newErrors.name = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let hubspotCompanyData = null;

      // Check if user has HubSpot integration and user ID
      const hasHubSpotIntegration =
        hubspotIntegration?.connected && hubspotIntegration?.hubspotUserId;

      if (hasHubSpotIntegration) {
        try {
          console.log("🔄 Creating company in HubSpot first...");

          // Call HubSpot API to create company
          const hubspotResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}${
              config.api.endpoints.hubspotCompanyCreation
            }`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: user.organization_id,
                ownerid: hubspotIntegration.hubspotUserId,
                company_name: formData.name.trim(),
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
            "✅ HubSpot company created successfully:",
            hubspotApiData
          );
          console.log(
            hubspotApiData,
            hubspotApiData.length > 0,
            hubspotApiData[0].success,
            "check hubspot company",
            hubspotApiData
          );
          // Extract HubSpot company data from API response
          if (hubspotApiData && hubspotApiData.length > 0) {
            hubspotCompanyData = hubspotApiData[0];
            console.log(
              "📊 HubSpot company data extracted:",
              hubspotCompanyData
            );
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
      console.log(hubspotCompanyData, "line 140");
      // Prepare company data for database
      const companyData = {
        name: formData.name.trim(),
        user_id: user.id,
        organization_id: user.organization_id,
      };

      // Add HubSpot-specific fields if HubSpot creation was successful
      if (hubspotCompanyData) {
        companyData.hubspot_company_id = hubspotCompanyData.id;
        companyData.is_hubspot = true;
        companyData.hubspot_created_at = hubspotCompanyData?.properties
          .createdAt
          ? new Date(hubspotCompanyData?.properties.createdAt).toISOString()
          : new Date().toISOString();
        companyData.hubspot_updated_at = hubspotCompanyData?.properties
          .updatedAt
          ? new Date(hubspotCompanyData?.properties.updatedAt).toISOString()
          : new Date().toISOString();

        // Add additional fields from HubSpot if available
        // if (hubspotCompanyData.properties) {
        //   companyData.domain = hubspotCompanyData.properties.domain || formData.domain?.trim() || null;
        //   companyData.industry = hubspotCompanyData.properties.industry || formData.industry?.trim() || null;
        //   companyData.city = hubspotCompanyData.properties.city || formData.city?.trim() || null;
        // }

        console.log(
          "📝 Company data prepared with HubSpot integration:",
          companyData
        );
      } else {
        // For non-HubSpot companies, add form fields if provided
        // companyData.domain = formData.domain?.trim() || null;
        // companyData.industry = formData.industry?.trim() || null;
        // companyData.city = formData.city?.trim() || null;
        companyData.is_hubspot = false;

        console.log(
          "📝 Company data prepared without HubSpot integration:",
          companyData
        );
      }

      // Insert company into database
      const { data, error } = await supabase
        .from("company")
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;

      // Show appropriate success message
      if (hubspotCompanyData) {
        toast.success(
          `Company "${data.name}" created successfully in both HubSpot and database`
        );
      } else {
        toast.success(`Company "${data.name}" created successfully`);
      }

      onCompanyCreated(data);
      handleClose();
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Failed to create company: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      domain: "",
      industry: "",
      city: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Create New Company</span>
          </DialogTitle>
          <DialogDescription>
            Add a new company to associate with your call transcript.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="Enter company name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              aria-describedby={errors.name ? "company-name-error" : undefined}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Additional fields for HubSpot integration */}
          {/* {hubspotIntegration?.connected &&
            hubspotIntegration?.hubspotUserId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company-domain">Domain (Optional)</Label>
                  <Input
                    id="company-domain"
                    placeholder="company.com"
                    value={formData.domain || ""}
                    onChange={(e) =>
                      handleInputChange("domain", e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-industry">Industry (Optional)</Label>
                  <Input
                    id="company-industry"
                    placeholder="Technology, Healthcare, etc."
                    value={formData.industry || ""}
                    onChange={(e) =>
                      handleInputChange("industry", e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-city">City (Optional)</Label>
                  <Input
                    id="company-city"
                    placeholder="San Francisco, New York, etc."
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Will sync to HubSpot
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    This company will be created in both HubSpot and our
                    database
                  </p>
                </div>
              </>
            )} */}
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
              "Create Company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
