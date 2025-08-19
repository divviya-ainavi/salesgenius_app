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
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCompanyModal } from "./CreateCompanyModal";
import { CreateProspectModal } from "./CreateProspectModal";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { config } from "../../lib/config";
import { setCallCompanyAPI } from "../../store/slices/authSlice";
import { useDispatch } from "react-redux";

const SELECTOR_STATES = {
  SELECT_COMPANY: "select_company",
  SELECT_PROSPECT: "select_prospect",
  SELECT_RESEARCH: "select_research",
  COMPLETE: "complete",
};

export const CallAssociationSelector = ({
  onAssociationChange,
  onAssociationReset,
  selectedAssociation = null,
  isProcessing,
  onFetchingStateChange,
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

  // Modal states
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateProspectModal, setShowCreateProspectModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dispatch = useDispatch();
  const [isFetchingDealNotes, setIsFetchingDealNotes] = useState(false);
  const [dealNotes, setDealNotes] = useState("");
  
  // Research company states
  const [researchCompanies, setResearchCompanies] = useState([]);
  const [selectedResearchCompany, setSelectedResearchCompany] = useState(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);

  // const [hubspotIntegrationStatus, setHubspotIntegrationStatus] = useState(null);
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
    callCompanyAPI,
  } = useSelector((state) => state.auth);
  console.log(hubspotIntegration, "HubSpot Integration Status");
  // Check HubSpot integration status on component mount
  const handleSyncFromHubSpot = async () => {
    const hasHubSpotIntegration =
      hubspotIntegration?.connected && hubspotIntegration?.hubspotUserId;
    dispatch(setCallCompanyAPI(false));
    if (!user?.organization_id) {
      toast.error("Organization information not available");
      return;
    }

    if (!hubspotIntegration?.hubspotUserId) {
      toast.error("Hubspot information is not available for for your account");
      return;
    }

    setIsSyncing(true);
    try {
      // Call HubSpot API to get companies
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${
          config.api.endpoints.hubspotCompanies
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user?.organization_id,
            ownerid: hubspotIntegration?.hubspotUserId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HubSpot API error: ${response.status} ${response.statusText}`
        );
      }

      const apiData = await response.json();
      console.log("📊 HubSpot API response:", apiData);

      const result = await dbHelpers.syncHubSpotCompanies(
        user.organization_id,
        hubspotIntegration,
        user?.id,
        apiData
      );

      toast.success(
        `Sync completed: ${result.inserted} new, ${result.updated} updated, ${result.failed} failed`
      );

      // Refresh companies list
      setCompanySearch(" "); // Trigger search refresh

      setTimeout(() => setCompanySearch(""), 100);
    } catch (error) {
      console.error("Error syncing HubSpot companies:", error);
      toast.error("Failed to sync companies from HubSpot: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };
  console.log(selectedCompany, "Selected Company in CallAssociationSelector");
  const handleSyncFromHubSpotDeals = async (companyDetails) => {
    if (!user?.organization_id) {
      toast.error("Organization information not available");
      return;
    }

    setIsSyncing(true);
    try {
      // Call HubSpot API to get companies
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${
          config.api.endpoints.hubspotDeals
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user?.organization_id,
            ownerid: hubspotIntegration?.hubspotUserId,
            companyid: companyDetails?.hubspot_company_id || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HubSpot API error: ${response.status} ${response.statusText}`
        );
      }

      const apiData = await response.json();
      console.log("📊 HubSpot API response:", apiData);

      const result = await dbHelpers.syncHubSpotDeals(
        companyDetails?.id,
        user.organization_id,
        hubspotIntegration?.hubspotUserId,
        user?.id,
        apiData
      );

      toast.success(
        `Sync completed: ${result.inserted} new, ${result.updated} updated, ${result.failed} failed`
      );

      // Refresh companies list
      setProspectSearch(" "); // Trigger search refresh
      setTimeout(() => setProspectSearch(""), 100);
    } catch (error) {
      console.error("Error syncing HubSpot companies:", error);
      toast.error("Failed to sync companies from HubSpot: " + error.message);
    } finally {
      setIsSyncing(false);
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
  console.log(hubspotIntegration, "HubSpot Integration Status");
  // Search companies
  useEffect(() => {
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
        let query = await dbHelpers.getCompaniesByUserId(
          user?.id,
          `%${companySearch.trim()}%`
        );
        // let query =
        // supabase
        //   .from("company")
        //   .select("*")
        //   .order("name", { ascending: true });

        // if (companySearch.trim()) {
        //   query = query.ilike("name", `%${companySearch.trim()}%`);
        // }

        const data = await dbHelpers.getCompaniesByUserId(
          user?.id,
          companySearch.trim() ? `%${companySearch.trim()}%` : ""
        );
        // console.log(data, "company data");
        // if (error) throw error;
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

  useEffect(() => {
    if (callCompanyAPI && hubspotIntegration?.connected) {
      handleSyncFromHubSpot();
    }
  }, []);

  // Search prospects
  useEffect(() => {
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
        let query = supabase
          .from("prospect")
          .select("*")
          .eq("company_id", selectedCompany.id)
          .order("name", { ascending: true });

        if (prospectSearch.trim()) {
          query = query.ilike("name", `%${prospectSearch.trim()}%`);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;
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
  }, [prospectSearch, currentState, selectedCompany]);

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCompanySearch("");
    setCurrentState(SELECTOR_STATES.SELECT_PROSPECT);
    if (
      hubspotIntegration?.connected &&
      hubspotIntegration?.hubspotUserId &&
      selectedCompany?.hubspot_company_id
    ) {
      handleSyncFromHubSpotDeals(company);
    }
    console.log(company, "Selected Company in CallAssociationSelector");
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    setProspectSearch("");
    
    // Check for research company data for this user
    checkForResearchCompanyData();

    // Fetch HubSpot deal notes if this is a HubSpot deal
    if (prospect.is_hubspot && prospect.hubspot_deal_id) {
      fetchHubSpotDealNotes(prospect.hubspot_deal_id, prospect.id);
    }
  };

  const fetchHubSpotDealNotes = async (hubspotDealId, dealId) => {
    setIsFetchingDealNotes(true);
    onFetchingStateChange?.(true);
    try {
      console.log("🔄 Fetching HubSpot deal notes for deal:", hubspotDealId);

      const result = await dbHelpers.getHubSpotDealNotes(
        dealId,
        user?.organization_id,
        hubspotDealId,
        user
      );
      console.log(result, "HubSpot Deal Notes Result");
      if (result.fromCache) {
        console.log("📋 Deal notes loaded from cache");
        toast.success("Deal notes fetched successfully");
      } else {
        console.log("📝 Deal notes synced from HubSpot:", result.message);
        if (result.notes.length > 0) {
          toast.success(
            `Fetched ${result.notes.length} deal notes from HubSpot`
          );
        }
      }

      // Set the merged notes in state
      setDealNotes(result.mergedNotes || "");
    } catch (error) {
      console.error("❌ Error fetching HubSpot deal notes:", error);
      toast.error("Failed to fetch deal notes from HubSpot");
    } finally {
      setIsFetchingDealNotes(false);
      onFetchingStateChange?.(false);
    }
  };

  // Function to check for research company data for the current user
  const checkForResearchCompanyData = async () => {
    if (!user?.id) return;

    setIsLoadingResearch(true);
    try {
      console.log('🔍 Checking for research data for user:', user.id);
      
      // Get all research companies for this user
      const { data: researchData, error } = await supabase
        .from('ResearchCompany')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching research companies:', error);
        setCurrentState(SELECTOR_STATES.COMPLETE);
        return;
      }

      console.log('📊 Found research companies:', researchData?.length || 0);

      // If no research data exists, skip research screen
      if (!researchData || researchData.length === 0) {
        console.log('📭 No research data found, skipping research screen');
        setResearchCompanies([]);
        setSelectedResearchCompany(null);
        setCurrentState(SELECTOR_STATES.COMPLETE);
        onAssociationChange({
          company: selectedCompany,
          prospect: selectedProspect,
          researchCompany: null,
        });
        return;
      }

      // If research data exists, show research selection screen
      setResearchCompanies(researchData);
      
      // Try to find a matching research company by name, otherwise use the first one
      const normalizedCompanyName = selectedCompany.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
        
      const matchingResearch = researchData.find(research => {
        const normalizedResearchName = research.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        return normalizedResearchName === normalizedCompanyName;
      });
      
      setSelectedResearchCompany(matchingResearch || researchData[0]);
      setCurrentState(SELECTOR_STATES.SELECT_RESEARCH);
      
      if (matchingResearch) {
        console.log('✅ Found matching research company:', matchingResearch.company_name);
      } else {
        console.log('📋 No exact match, defaulting to most recent research');
      }
    } catch (error) {
      console.error('Error checking research companies:', error);
      setCurrentState(SELECTOR_STATES.COMPLETE);
      onAssociationChange({
        company: selectedCompany,
        prospect: selectedProspect,
        researchCompany: null,
      });
    } finally {
      setIsLoadingResearch(false);
    }
  };

  // Function to handle research company selection
  const handleResearchCompanySelect = (researchCompany) => {
    setSelectedResearchCompany(researchCompany);
  };

  const handleUseResearch = () => {
        setCurrentState(SELECTOR_STATES.SELECT_RESEARCH);
    onAssociationChange({
      company: selectedCompany,
      prospect: selectedProspect,
      researchCompany: selectedResearchCompany,
    });
  };

  const handleSkipResearch = () => {
    setSelectedResearchCompany(null);
    setCurrentState(SELECTOR_STATES.COMPLETE);
    onAssociationChange({
      company: selectedCompany,
      prospect: selectedProspect,
      researchCompany: null,
    });
  };

  const handleEditCompanyFromResearch = () => {
    setSelectedCompany(null);
    setSelectedProspect(null);
    setSelectedResearchCompany(null);
    setResearchCompanies([]);
    setCompanySearch("");
    setProspectSearch("");
    setCurrentState(SELECTOR_STATES.SELECT_COMPANY);
  };

  const handleEditProspectFromResearch = () => {
    setSelectedProspect(null);
    setSelectedResearchCompany(null);
    setResearchCompanies([]);
    setProspectSearch("");
    setCurrentState(SELECTOR_STATES.SELECT_PROSPECT);
  };

  const handleReset = () => {
    setSelectedCompany(null);
    setSelectedProspect(null);
    setSelectedResearchCompany(null);
    setResearchCompanies([]);
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
              <div className="flex space-x-2 items-center">
                {/* Search Input with Icon */}
                <div className="relative flex-1">
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

                {/* Sync Button */}
                {hubspotIntegration?.connected &&
                  hubspotIntegration?.hubspotUserId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncFromHubSpot}
                            disabled={isSyncing}
                            className="text-orange-600 hover:bg-orange-50 border-orange-200 whitespace-nowrap"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sync companies from HubSpot</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>

              {/* Company Results */}
              {companySearchError && (
                <p className="text-sm text-red-600 mt-1">
                  {companySearchError}
                </p>
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
                              {company.is_hubspot && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                                >
                                  HubSpot
                                </Badge>
                              )}
                            </div>
                            {company.domain && (
                              <div className="text-sm text-gray-500">
                                {company.domain}
                              </div>
                            )}
                            {company.industry && (
                              <div className="text-sm text-gray-500">
                                {company.industry}
                              </div>
                            )}
                            {company.city && (
                              <div className="text-sm text-gray-500">
                                📍 {company.city}
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
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                    >
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

              <label className="text-sm font-medium text-gray-700">
                Select Deal
              </label>

              <div className="flex space-x-2">
                <div className="relative flex-1">
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
                {hubspotIntegration?.connected &&
                  hubspotIntegration?.hubspotUserId &&
                  selectedCompany?.hubspot_company_id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSyncFromHubSpotDeals(selectedCompany)
                            }
                            disabled={isSyncing}
                            className="text-orange-600 hover:bg-orange-50 border-orange-200 whitespace-nowrap"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sync deals from HubSpot</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>

              {/* Prospect Results - Separate container */}
              {prospectSearchError && (
                <p className="text-sm text-red-600 mt-1">
                  {prospectSearchError}
                </p>
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
                            "w-full justify-start p-3 hover:bg-gray-50 transition-colors h-14",
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
                                  <div className="text-left flex-1">
                                    <div className="font-medium truncate overflow-hidden whitespace-nowrap max-w-[250px] flex items-center">
                                      {prospect.name}
                                      {prospect.is_hubspot && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                                        >
                                          HubSpot
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {selectedProspect?.id === prospect.id ? (
                                    <Check className="w-5 h-5 ml-auto text-blue-600 flex-shrink-0" />
                                  ) : null}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-medium">{prospect.name}</p>
                                  {prospect.deal_stage && (
                                    <p className="text-xs">
                                      Stage: {prospect.deal_stage}
                                    </p>
                                  )}
                                  {prospect.amount && (
                                    <p className="text-xs">
                                      Value: ${prospect.amount.toLocaleString()}
                                    </p>
                                  )}
                                  {prospect.close_date && (
                                    <p className="text-xs">
                                      Close:{" "}
                                      {new Date(
                                        prospect.close_date
                                      ).toLocaleDateString()}
                                    </p>
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

          {/* State 3: Select Research Company */}
          {currentState === SELECTOR_STATES.SELECT_RESEARCH && (
            <div className="space-y-4">
              {/* Previous Selections Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Company:</span> {selectedCompany?.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCompanyFromResearch}
                    className="text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Deal:</span> {selectedProspect?.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditProspectFromResearch}
                    className="text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <label className="text-sm font-medium text-gray-700">
                Research Data Found
              </label>

              {/* Research Found Message */}
              <div className="flex items-center space-x-2 text-blue-600 mb-3">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Found {researchCompanies.length} research profile{researchCompanies.length !== 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Using research data will enhance AI processing with company-specific insights.
              </p>

              {/* Research Company Selection */}
              <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                {researchCompanies.map((research) => (
                  <Button
                    key={research.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
                      selectedResearchCompany?.id === research.id
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                        : ""
                    )}
                    onClick={() => handleResearchCompanySelect(research)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center">
                          {research.company_name}
                          {selectedResearchCompany?.id === research.id && (
                            <Check className="w-4 h-4 ml-2 text-blue-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(research.created_at).toLocaleDateString()}
                        </div>
                        {research.summary_note && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {research.summary_note.substring(0, 80)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleUseResearch}
                  disabled={!selectedResearchCompany}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Selected Research
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipResearch}
                  className="flex-1"
                >
                  Skip Research
                </Button>
              </div>
            </div>
          )}

          {currentState === SELECTOR_STATES.COMPLETE && (
    } catch (error) {
      console.error('Error checking research companies:', error);
      setCurrentState(SELECTOR_STATES.COMPLETE);
    } finally {
      setIsLoadingResearch(false);
    }
  };

  // Function to handle research company selection
  const handleResearchCompanySelect = (researchCompany) => {
    setSelectedResearchCompany(researchCompany);
  };

  const handleUseResearch = () => {
    setCurrentState(SELECTOR_STATES.COMPLETE);
    onAssociationChange({
      company: selectedCompany,
      prospect: selectedProspect,
      researchCompany: selectedResearchCompany,
    });
  };

  const handleSkipResearch = () => {
    setSelectedResearchCompany(null);
    setCurrentState(SELECTOR_STATES.COMPLETE);
    onAssociationChange({
      company: selectedCompany,
      prospect: selectedProspect,
      researchCompany: null,
    });
  };

  const handleReset = () => {
    setSelectedCompany(null);
    setSelectedProspect(null);
    setSelectedResearchCompany(null);
    setResearchCompanies([]);
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
              <div className="flex space-x-2 items-center">
                {/* Search Input with Icon */}
                <div className="relative flex-1">
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

                {/* Sync Button */}
                {hubspotIntegration?.connected &&
                  hubspotIntegration?.hubspotUserId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncFromHubSpot}
                            disabled={isSyncing}
                            className="text-orange-600 hover:bg-orange-50 border-orange-200 whitespace-nowrap"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sync companies from HubSpot</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>

              {/* Company Results */}
              {companySearchError && (
                <p className="text-sm text-red-600 mt-1">
                  {companySearchError}
                </p>
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
                              {company.is_hubspot && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                                >
                                  HubSpot
                                </Badge>
                              )}
                            </div>
                            {company.domain && (
                              <div className="text-sm text-gray-500">
                                {company.domain}
                              </div>
                            )}
                            {company.industry && (
                              <div className="text-sm text-gray-500">
                                {company.industry}
                              </div>
                            )}
                            {company.city && (
                              <div className="text-sm text-gray-500">
                                📍 {company.city}
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
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                    >
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

              <label className="text-sm font-medium text-gray-700">
                Select Deal
              </label>

              <div className="flex space-x-2">
                <div className="relative flex-1">
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
                {hubspotIntegration?.connected &&
                  hubspotIntegration?.hubspotUserId &&
                  selectedCompany?.hubspot_company_id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSyncFromHubSpotDeals(selectedCompany)
                            }
                            disabled={isSyncing}
                            className="text-orange-600 hover:bg-orange-50 border-orange-200 whitespace-nowrap"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sync deals from HubSpot</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>

              {/* Prospect Results - Separate container */}
              {prospectSearchError && (
                <p className="text-sm text-red-600 mt-1">
                  {prospectSearchError}
                </p>
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
                                  <div className="text-left flex-1">
                                    <div className="font-medium truncate overflow-hidden whitespace-nowrap max-w-[250px] flex items-center">
                                      {prospect.name}
                                      {prospect.is_hubspot && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200"
                                        >
                                          HubSpot
                                        </Badge>
                                      )}
                                    </div>
                                    {/* {prospect.deal_stage && (
                                      <div className="text-xs text-gray-500">
                                        Stage: {prospect.deal_stage}
                                      </div>
                                    )}
                                    {prospect.amount && (
                                      <div className="text-xs text-gray-500">
                                        Value: $
                                        {prospect.amount.toLocaleString()}
                                      </div>
                                    )} */}
                                  </div>
                                  {selectedProspect?.id === prospect.id ? (
                                    <Check className="w-5 h-5 ml-auto text-blue-600 flex-shrink-0" />
                                  ) : null}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-medium">{prospect.name}</p>
                                  {prospect.deal_stage && (
                                    <p className="text-xs">
                                      Stage: {prospect.deal_stage}
                                    </p>
                                  )}
                                  {prospect.amount && (
                                    <p className="text-xs">
                                      Value: ${prospect.amount.toLocaleString()}
                                    </p>
                                  )}
                                  {prospect.close_date && (
                                    <p className="text-xs">
                                      Close:{" "}
                                      {new Date(
                                        prospect.close_date
                                      ).toLocaleDateString()}
                                    </p>
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

          {/* State 3: Select Research Company */}
          {currentState === SELECTOR_STATES.SELECT_RESEARCH && (
            <div className="space-y-3">
              {/* Previous Selections Display */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">
                    <span className="font-medium">Company:</span> {selectedCompany?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">
                    <span className="font-medium">Deal:</span> {selectedProspect?.name}
                  </span>
                </div>
              </div>

              <div className="text-sm font-medium text-gray-700">
                Research Data Found
              </div>

              {/* Research Found Message */}
              <div className="flex items-center space-x-2 text-blue-600 mb-3">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Found {researchCompanies.length} research profile{researchCompanies.length !== 1 ? 's' : ''} for "{selectedCompany?.name}"
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Using research data will enhance AI processing with company-specific insights.
              </p>

              {/* Research Company Selection */}
              <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                {researchCompanies.map((research) => (
                  <Button
                    key={research.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
                      selectedResearchCompany?.id === research.id
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                        : ""
                    )}
                    onClick={() => handleResearchCompanySelect(research)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {research.company_name}
                          {selectedResearchCompany?.id === research.id && (
                            <Check className="w-4 h-4 ml-2 inline text-blue-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(research.created_at).toLocaleDateString()}
                        </div>
                        {research.summary_note && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {research.summary_note.substring(0, 80)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleUseResearch}
                  disabled={!selectedResearchCompany}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Selected Research
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipResearch}
                  className="flex-1"
                >
                  Skip Research
                </Button>
              </div>
            </div>
          )}

          {currentState === SELECTOR_STATES.COMPLETE && (
            <div className="space-y-3">
              {/* Deal Notes Fetching Progress */}
              {isFetchingDealNotes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Fetching deal notes from HubSpot...
                      </p>
                      <p className="text-xs text-blue-600">
                        Getting cumulative sales insights to enhance processing
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
        selectedCompany={selectedCompany}
      />
    </>
  );
};
