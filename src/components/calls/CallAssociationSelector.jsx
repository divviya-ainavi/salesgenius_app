import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building,
  DollarSign,
  Search,
  Plus,
  Edit,
  Check,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sync,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCompanyModal } from "./CreateCompanyModal";
import { CreateProspectModal } from "./CreateProspectModal";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import hubspotService from "@/services/hubspotService";
import { toast } from "sonner";

const SELECTOR_STATES = {
  SELECT_COMPANY: "select_company",
  SELECT_PROSPECT: "select_prospect",
  COMPLETE: "complete",
};

export const CallAssociationSelector = ({
  onAssociationChange,
  onAssociationReset,
  selectedAssociation = null,
  isProcessing,
}) => {
  const [currentState, setCurrentState] = useState(
    SELECTOR_STATES.SELECT_COMPANY
  );
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);

  // Search states
  const [companySearch, setCompanySearch] = useState("");
  const [prospectSearch, setProspectSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [prospects, setProspects] = useState([]);

  // Loading states
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [companySearchError, setCompanySearchError] = useState(null);
  const [prospectSearchError, setProspectSearchError] = useState(null);
  const [isSyncingCompanies, setIsSyncingCompanies] = useState(false);
  const [isSyncingProspects, setIsSyncingProspects] = useState(false);
  const [hubspotConnectionStatus, setHubspotConnectionStatus] = useState(null);

  // Modal states
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateProspectModal, setShowCreateProspectModal] = useState(false);
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  // Check HubSpot connection status on mount
  useEffect(() => {
    checkHubSpotConnection();
  }, [organizationDetails?.id]);

  const checkHubSpotConnection = async () => {
    if (!organizationDetails?.id) return;
    
    try {
      const status = await hubspotService.checkIntegrationStatus(organizationDetails.id);
      setHubspotConnectionStatus(status);
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotConnectionStatus({ connected: false, error: error.message });
    }
  };
  // Initialize from props if provided
  useEffect(() => {
    if (selectedAssociation) {
      setSelectedCompany(selectedAssociation.company);
      setSelectedProspect(selectedAssociation.prospect);
      setCurrentState(SELECTOR_STATES.COMPLETE);
    }
  }, [selectedAssociation]);

  // Search companies
  useEffect(() => {
    if (!user?.id) {
      console.warn("No user ID available for company search");
      setCompanies([]);
      return;
    }

    if (companySearch.trim().length > 0 && companySearch.trim().length < 2) {
      setCompanySearchError("Please enter at least 2 characters.");
      setCompanies([]);
      return;
    }
    setCompanySearchError(null);
    const searchCompanies = async () => {
      if (currentState !== SELECTOR_STATES.SELECT_COMPANY) return;

      setLoadingCompanies(true);
      try {
        // Use enhanced query that includes HubSpot status
        const data = await dbHelpers.getCompaniesWithHubSpotStatus(
          user?.id,
          companySearch.trim() ? `%${companySearch.trim()}%` : ""
        );
        setCompanies(data || []);
      } catch (error) {
        console.error("Error searching companies:", error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    const debounceTimer = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounceTimer);
  }, [companySearch, currentState]);

  // Search prospects
  useEffect(() => {
    if (!user?.id) {
      console.warn("No user ID available for prospect search");
      setProspects([]);
      return;
    }

    if (prospectSearch.trim().length > 0 && prospectSearch.trim().length < 2) {
      setProspectSearchError("Please enter at least 2 characters.");
      setProspects([]);
      return;
    }
    setProspectSearchError(null);
    const searchProspects = async () => {
      if (currentState !== SELECTOR_STATES.SELECT_PROSPECT || !selectedCompany)
        return;

      setLoadingProspects(true);
      try {
        // Use enhanced query that includes HubSpot status
        const data = await dbHelpers.getProspectsWithHubSpotStatus(
          selectedCompany.id,
          prospectSearch.trim() ? `%${prospectSearch.trim()}%` : ""
        );
        setProspects(data || []);
      } catch (error) {
        console.error("Error searching prospects:", error);
        setProspects([]);
      } finally {
        setLoadingProspects(false);
      }
    };

    const debounceTimer = setTimeout(searchProspects, 300);
    return () => clearTimeout(debounceTimer);
  }, [prospectSearch, currentState, selectedCompany, user?.id]);

  const handleSyncCompanies = async () => {
    if (!hubspotConnectionStatus?.connected) {
      toast.error("HubSpot is not connected. Please connect HubSpot first.");
      return;
    }

    setIsSyncingCompanies(true);
    try {
      // Get any HubSpot user for the organization to make API calls
      const hubspotUser = await dbHelpers.getAnyHubSpotUserForOrg(organizationDetails.id);
      
      if (!hubspotUser) {
        throw new Error('No HubSpot users found for this organization');
      }

      const result = await hubspotService.syncCompanies(
        organizationDetails.id,
        hubspotUser.hubspot_user_id
      );

      toast.success(
        `Successfully synced ${result.inserted} new companies and updated ${result.updated} existing companies from HubSpot`
      );

      // Refresh the companies list
      const refreshedData = await dbHelpers.getCompaniesWithHubSpotStatus(
        user?.id,
        companySearch.trim() ? `%${companySearch.trim()}%` : ""
      );
      setCompanies(refreshedData || []);
    } catch (error) {
      console.error("Error syncing companies from HubSpot:", error);
      toast.error(`Failed to sync companies: ${error.message}`);
    } finally {
      setIsSyncingCompanies(false);
    }
  };

  const handleSyncProspects = async () => {
    if (!hubspotConnectionStatus?.connected) {
      toast.error("HubSpot is not connected. Please connect HubSpot first.");
      return;
    }

    if (!selectedCompany?.hubspot_company_id) {
      toast.error("This company is not from HubSpot. Only HubSpot companies can sync deals.");
      return;
    }

    setIsSyncingProspects(true);
    try {
      // Get any HubSpot user for the organization to make API calls
      const hubspotUser = await dbHelpers.getAnyHubSpotUserForOrg(organizationDetails.id);
      
      if (!hubspotUser) {
        throw new Error('No HubSpot users found for this organization');
      }

      const result = await hubspotService.syncDeals(
        selectedCompany.hubspot_company_id,
        selectedCompany.id,
        organizationDetails.id,
        hubspotUser.hubspot_user_id
      );

      toast.success(
        `Successfully synced ${result.inserted} new deals and updated ${result.updated} existing deals from HubSpot`
      );

      // Refresh the prospects list
      const refreshedData = await dbHelpers.getProspectsWithHubSpotStatus(
        selectedCompany.id,
        prospectSearch.trim() ? `%${prospectSearch.trim()}%` : ""
      );
      setProspects(refreshedData || []);
    } catch (error) {
      console.error("Error syncing prospects from HubSpot:", error);
      toast.error(`Failed to sync deals: ${error.message}`);
    } finally {
      setIsSyncingProspects(false);
    }
  };
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCompanySearch("");
    setCurrentState(SELECTOR_STATES.SELECT_PROSPECT);
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    setProspectSearch("");
    setCurrentState(SELECTOR_STATES.COMPLETE);

    // Notify parent component
    onAssociationChange({
      company: selectedCompany,
      prospect: prospect,
    });
  };

  const handleReset = () => {
    setSelectedCompany(null);
    setSelectedProspect(null);
    setCompanySearch("");
    setProspectSearch("");
    setCurrentState(SELECTOR_STATES.SELECT_COMPANY);
    onAssociationReset();
  };

  const handleCompanyCreated = (newCompany) => {
    setShowCreateCompanyModal(false);
    handleCompanySelect(newCompany);
  };

  const handleProspectCreated = (newProspect) => {
    setShowCreateProspectModal(false);
    handleProspectSelect(newProspect);
  };

  return (
    <>
      <Card className="w-full border-none shadow-none">
        <CardContent className="space-y-4">
          {/* State 1: Select Company */}
          {currentState === SELECTOR_STATES.SELECT_COMPANY && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Select Company
              </label>
              
              {/* HubSpot Sync Option */}
              {hubspotConnectionStatus?.connected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Sync companies from HubSpot
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncCompanies}
                      disabled={isSyncingCompanies}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {isSyncingCompanies ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Sync className="w-4 h-4 mr-1" />
                          Sync from HubSpot
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Import companies from your HubSpot account
                  </p>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  data-tour="company-selector"
                  placeholder="Search for a company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-10"
                  aria-invalid={companySearchError ? "true" : "false"}
                />
                {loadingCompanies && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Company Results */}
              {companySearchError && (
                <p className="text-sm text-red-600 mt-1">{companySearchError}</p>
              )}
              {
                <div
                  className={
                    companySearch || companies.length > 0
                      ? "border border-gray-200 rounded-md max-h-40 min-h-40 overflow-y-auto"
                      : "border border-gray-200 rounded-md overflow-y-auto max-h-40 min-h-40"
                  }
                >
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 text-blue-600 hover:bg-blue-50 font-medium border-b border-gray-200"
                      onClick={() => setShowCreateCompanyModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Company...
                    </Button>

                    {(companySearch || companies.length > 0) &&
                      companies.map((company) => (
                        <Button
                          key={company.id}
                          variant="ghost"
                          className="w-full justify-start p-3 hover:bg-gray-50"
                          onClick={() => handleCompanySelect(company)}
                        >
                          <Building className="w-4 h-4 mr-2 text-gray-400" />
                          <div className="text-left">
                            <div className="font-medium line-clamp-2-wrap">
                              {company.name}
                            </div>
                            {company.domain && (
                              <div className="text-sm text-gray-500">
                                {company.domain}
                              </div>
                              {company.is_hubspot && (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                  HubSpot
                                </Badge>
                              )}
                            )}
                            {company.industry && (
                              <div className="text-xs text-gray-400">
                                {company.industry}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                  </>
                </div>
              }
            </div>
          )}

          {currentState === SELECTOR_STATES.SELECT_PROSPECT && (
            <div className="space-y-3">
              {/* Selected Company Display */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground truncate max-w-[250px]">
                    {selectedCompany.name}
                  </span>
                  {selectedCompany.is_hubspot && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                      HubSpot
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </Button>
              </div>

              {/* HubSpot Deals Sync Option */}
              {hubspotConnectionStatus?.connected && selectedCompany?.is_hubspot && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Sync deals from HubSpot
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncProspects}
                      disabled={isSyncingProspects}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {isSyncingProspects ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Sync className="w-4 h-4 mr-1" />
                          Sync Deals
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Import deals for {selectedCompany.name} from HubSpot
                  </p>
                </div>
              )}
              <label className="text-sm font-medium text-gray-700">
                Select Deal
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  data-tour="prospect-selector"
                  placeholder="Search for a deal..."
                  value={prospectSearch}
                  onChange={(e) => setProspectSearch(e.target.value)}
                  className="pl-10"
                  aria-invalid={prospectSearchError ? "true" : "false"}
                />
                {loadingProspects && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Prospect Results - Separate container */}
              {prospectSearchError && (
                <p className="text-sm text-red-600 mt-1">{prospectSearchError}</p>
              )}
              <div className="space-y-3 mt-3">
                {/* Create New Deal Button - Moved above the list */}
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 text-blue-600 hover:bg-blue-50 font-medium border border-gray-200 rounded-md mb-2"
                  onClick={() => setShowCreateProspectModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Deal...
                </Button>

                {/* Deals List */}
                <div className="border border-gray-200 rounded-md min-h-40 max-h-40 overflow-y-auto">
                  {loadingProspects ? (
                    <div className="p-3 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <>
                      {prospects.map((prospect) => (
                        <Button
                          key={prospect.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start p-3 hover:bg-gray-100 transition-colors h-14",
                            selectedProspect?.id === prospect.id
                              ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 shadow-md"
                              : ""
                          )}
                          onClick={() => handleProspectSelect(prospect)}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-between w-full py-1">
                                  <div className="flex items-center space-x-2 flex-1">
                                    <span className="font-medium text-left truncate overflow-hidden whitespace-nowrap max-w-[200px]">
                                      {prospect.name}
                                    </span>
                                    {prospect.is_hubspot && (
                                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                        HubSpot
                                      </Badge>
                                    )}
                                  </div>
                                  {selectedProspect?.id === prospect.id ? (
                                    <Check className="w-5 h-5 ml-auto text-blue-600 flex-shrink-0" />
                                  ) : null}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-medium">{prospect.name}</p>
                                  {prospect.amount && (
                                    <p className="text-sm">Amount: ${prospect.amount?.toLocaleString()}</p>
                                  )}
                                  {prospect.deal_stage && (
                                    <p className="text-sm">Stage: {prospect.deal_stage}</p>
                                  )}
                                  {prospect.close_date && (
                                    <p className="text-sm">Close Date: {new Date(prospect.close_date).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentState === SELECTOR_STATES.COMPLETE && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-green-800">
                    Selection Complete
                  </h3>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-green-600" />
                    <span className="text-sm flex items-center">
                      <span className="font-medium mr-1">Company:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate overflow-hidden whitespace-nowrap max-w-[200px]">
                              {selectedCompany?.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{selectedCompany?.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {selectedCompany?.is_hubspot && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200 ml-2">
                          HubSpot
                        </Badge>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm flex items-center">
                      <span className="font-medium mr-1">Prospect:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate overflow-hidden whitespace-nowrap max-w-[200px]">
                              {selectedProspect?.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">{selectedProspect?.name}</p>
                              {selectedProspect?.amount && (
                                <p className="text-sm">Amount: ${selectedProspect.amount?.toLocaleString()}</p>
                              )}
                              {selectedProspect?.deal_stage && (
                                <p className="text-sm">Stage: {selectedProspect.deal_stage}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {selectedProspect?.is_hubspot && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200 ml-2">
                          HubSpot
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full hover:bg-green-100 transition-colors mt-2"
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Change Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateCompanyModal
        isOpen={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      <CreateProspectModal
        isOpen={showCreateProspectModal}
        onClose={() => setShowCreateProspectModal(false)}
        onProspectCreated={handleProspectCreated}
        companyId={selectedCompany?.id}
      />
    </>
  );
};
