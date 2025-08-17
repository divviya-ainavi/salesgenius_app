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
import { dbHelpers } from "@/lib/supabase";

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

  // Check if user has HubSpot integration
  const hasHubSpotIntegration = hubspotIntegration?.connected && hubspotIntegration?.hubspotUserId;

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
    
    // If HubSpot is integrated, domain is recommended for better matching
    if (hasHubSpotIntegration && !formData.domain.trim()) {
      // Just a warning, not blocking
      console.warn("Domain recommended for HubSpot company creation");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let createdCompany;

      if (hasHubSpotIntegration) {
        // Create company in HubSpot and store in database
        console.log('🏢 Creating company in HubSpot and database...');
        
        const result = await dbHelpers.createHubSpotCompany(
          {
            name: formData.name.trim(),
            domain: formData.domain.trim() || null,
            industry: formData.industry.trim() || null,
            city: formData.city.trim() || null,
          },
          user.organization_id,
          user.id,
          hubspotIntegration.hubspotUserId
        );

        createdCompany = result.company;
        toast.success(`Company "${createdCompany.name}" created in HubSpot and database`);
      } else {
        // Create company only in database
        console.log('🏢 Creating company in database only...');
        
        const { data, error } = await supabase
          .from("company")
          .insert([
            {
              name: formData.name.trim(),
              domain: formData.domain.trim() || null,
              industry: formData.industry.trim() || null,
              city: formData.city.trim() || null,
              user_id: user.id,
              organization_id: user.organization_id,
              is_hubspot: false,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        
        createdCompany = data;
        toast.success(`Company "${createdCompany.name}" created successfully`);
      }

      onCompanyCreated(createdCompany);
      handleClose();
    } catch (error) {
      console.error("Error creating company:", error);
      
      if (hasHubSpotIntegration) {
        toast.error("Failed to create company in HubSpot: " + error.message);
      } else {
        toast.error("Failed to create company: " + error.message);
      }
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
            <span>
              Create New Company
              {hasHubSpotIntegration && (
                <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200">
                  Will sync to HubSpot
                </Badge>
              )}
            </span>
          </DialogTitle>
          <DialogDescription>
            {hasHubSpotIntegration 
              ? "Create a new company in HubSpot and your database."
              : "Add a new company to associate with your call transcript."
            }
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
          {hasHubSpotIntegration && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company-domain">Domain</Label>
                <Input
                  id="company-domain"
                  placeholder="company.com"
                  value={formData.domain}
                  onChange={(e) => handleInputChange("domain", e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended for better HubSpot matching
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-industry">Industry</Label>
                  <Input
                    id="company-industry"
                    placeholder="Technology"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-city">City</Label>
                  <Input
                    id="company-city"
                    placeholder="San Francisco"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}
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
                {hasHubSpotIntegration ? "Creating in HubSpot..." : "Creating..."}
              </>
            ) : (
              <>
                <Building className="w-4 h-4 mr-2" />
                {hasHubSpotIntegration ? "Create in HubSpot" : "Create Company"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
