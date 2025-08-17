import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, CURRENT_USER } from '@/lib/supabase';
import { useSelector } from 'react-redux';
import { config } from '@/lib/config';

export const CreateProspectModal = ({ isOpen, onClose, onProspectCreated, companyId }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    closeDate: '',
    dealStage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isHubSpotCompany, setIsHubSpotCompany] = useState(false);

  const {
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  // Load company details when modal opens
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!companyId || !isOpen) return;

      try {
        const { data: company, error } = await supabase
          .from('company')
          .select('*')
          .eq('id', companyId)
          .single();

        if (error) throw error;

        setSelectedCompany(company);
        setIsHubSpotCompany(company.is_hubspot || false);
      } catch (error) {
        console.error('Error loading company details:', error);
        setSelectedCompany(null);
        setIsHubSpotCompany(false);
      }
    };

    loadCompanyDetails();
  }, [companyId, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Prospect name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createHubSpotDeal = async () => {
    try {
      console.log('🔄 Creating deal in HubSpot...');

      const payload = {
        id: user.organization_id,
        ownerid: hubspotIntegration.hubspotUserId,
        companyid: selectedCompany.hubspot_company_id,
        dealname: formData.name.trim(),
      };

      // Add optional fields if provided
      if (formData.amount) {
        payload.amount = parseFloat(formData.amount);
      }
      if (formData.closeDate) {
        payload.closedate = formData.closeDate;
      }
      if (formData.dealStage) {
        payload.dealstage = formData.dealStage;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${config.api.endpoints.hubspotDealCreation}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      console.log('✅ HubSpot deal created successfully:', apiData);

      // Extract deal data from API response
      if (apiData && apiData.length > 0 && apiData[0].success) {
        return apiData[0];
      } else {
        throw new Error('Invalid HubSpot API response format');
      }
    } catch (error) {
      console.error('❌ Error creating deal in HubSpot:', error);
      throw error;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      let hubspotDealData = null;

      // Check if we should create in HubSpot first
      const shouldCreateInHubSpot = 
        hubspotIntegration?.connected && 
        hubspotIntegration?.hubspotUserId && 
        isHubSpotCompany &&
        selectedCompany?.hubspot_company_id;

      if (shouldCreateInHubSpot) {
        try {
          hubspotDealData = await createHubSpotDeal();
          console.log('📊 HubSpot deal data received:', hubspotDealData);
        } catch (hubspotError) {
          console.error('❌ Error creating deal in HubSpot:', hubspotError);
          toast.error(
            `Failed to create deal in HubSpot: ${hubspotError.message}. Creating in database only.`
          );
          // Continue with database creation even if HubSpot fails
        }
      }

      // Prepare prospect data for database
      const prospectData = {
        name: formData.name.trim(),
        company_id: companyId,
        user_id: CURRENT_USER.id,
        calls: 0,
      };

      // Add HubSpot-specific fields if HubSpot creation was successful
      if (hubspotDealData) {
        prospectData.hubspot_deal_id = hubspotDealData.id;
        prospectData.is_hubspot = true;
        prospectData.hubspot_created_at = hubspotDealData.properties?.createdate
          ? new Date(hubspotDealData.properties.createdate).toISOString()
          : new Date().toISOString();
        prospectData.hubspot_updated_at = hubspotDealData.properties?.hs_lastmodifieddate
          ? new Date(hubspotDealData.properties.hs_lastmodifieddate).toISOString()
          : new Date().toISOString();
        prospectData.hubspot_owner_id = hubspotDealData.properties?.hubspot_owner_id || hubspotIntegration.hubspotUserId;
        prospectData.amount = hubspotDealData.properties?.amount || (formData.amount ? parseFloat(formData.amount) : null);
        prospectData.close_date = hubspotDealData.properties?.closedate 
          ? new Date(hubspotDealData.properties.closedate).toISOString()
          : (formData.closeDate ? new Date(formData.closeDate).toISOString() : null);
        prospectData.deal_stage = hubspotDealData.properties?.dealstage || formData.dealStage || null;
      } else {
        // For non-HubSpot deals, add form fields if provided
        prospectData.amount = formData.amount ? parseFloat(formData.amount) : null;
        prospectData.close_date = formData.closeDate ? new Date(formData.closeDate).toISOString() : null;
        prospectData.deal_stage = formData.dealStage || null;
        prospectData.is_hubspot = false;
      }

      const { data, error } = await supabase
        .from('prospect')
        .insert([prospectData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Show appropriate success message
      if (hubspotDealData) {
        toast.success(
          `Deal "${data.name}" created successfully in both HubSpot and database`
        );
      } else {
        toast.success(`Deal "${data.name}" created successfully`);
      }

      onProspectCreated(data);
      handleClose();
    } catch (error) {
      console.error('Error creating prospect:', error);
      toast.error('Failed to create prospect: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      amount: '',
      closeDate: '',
      dealStage: '',
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
          {isHubSpotCompany && hubspotIntegration?.connected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-orange-800">This deal will be created in both HubSpot and our database</p>
            </div>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prospect-name">Deal Name *</Label>
            <Input
              id="prospect-name"
              placeholder="Enter deal name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
              aria-describedby={errors.name ? "prospect-name-error" : undefined}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Additional fields for HubSpot deals */}
          {isHubSpotCompany && hubspotIntegration?.connected && (
            <>
              <div className="space-y-2">
                <Label htmlFor="deal-amount">Deal Amount (Optional)</Label>
                <Input
                  id="deal-amount"
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="close-date">Expected Close Date (Optional)</Label>
                <Input
                  id="close-date"
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleInputChange('closeDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-stage">Deal Stage (Optional)</Label>
                <Input
                  id="deal-stage"
                  placeholder="Qualified, Proposal, Negotiation, etc."
                  value={formData.dealStage}
                  onChange={(e) => handleInputChange('dealStage', e.target.value)}
                  disabled={isLoading}
                />
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
                Creating...
              </>
            ) : (
              'Create Deal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};