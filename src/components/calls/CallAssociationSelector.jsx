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

  // Modal states
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateProspectModal, setShowCreateProspectModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dispatch = useDispatch();
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
    handleSyncFromHubSpotDeals(company);
    console.log(company, "Selected Company in CallAssociationSelector");
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    setProspectSearch("");
    setCurrentState(SELECTOR_STATES.COMPLETE);

    // Fetch HubSpot deal notes if this is a HubSpot deal
    if (prospect.is_hubspot && prospect.hubspot_deal_id) {
      fetchHubSpotDealNotes(prospect.hubspot_deal_id, prospect.id);
    }

    // Notify parent component
    onAssociationChange({
      company: selectedCompany,
      prospect: prospect,
    });
  };

  const fetchHubSpotDealNotes = async (hubspotDealId, dealId) => {
    try {
      console.log('🔄 Fetching HubSpot deal notes for deal:', hubspotDealId);
      
      const result = await dbHelpers.getHubSpotDealNotes(dealId, user?.organization_id);
      
      if (result.fromCache) {
        console.log('📋 Deal notes loaded from cache');
      } else {
        console.log('📝 Deal notes synced from HubSpot:', result.message);
        if (result.notes.length > 0) {
          toast.success(`Synced ${result.notes.length} notes from HubSpot`);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching HubSpot deal notes:', error);
      toast.error('Failed to fetch deal notes from HubSpot');
    }
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
              <div className="flex space-x-2">
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
                  hubspotIntegration?.hubspotUserId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncFromHubSpotDeals(selectedCompany)}
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
                {/* Create New Deal Button */}
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
                            <p>{selectedProspect?.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
        selectedCompany={selectedCompany}
      />
    </>
  );
};
