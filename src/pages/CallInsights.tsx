import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  Star,
  Eye,
  MessageSquare,
  CheckSquare,
  FileText,
  Building,
  User,
  Calendar,
  Clock,
  Database,
  Layers,
  Zap,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Plus,
  Edit,
  Save,
  X,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Ear,
  Hand,
  Loader2,
  Headphones,
  Info,
  Brain,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@radix-ui/react-tooltip";
import useEmblaCarousel from "embla-carousel-react";
import { setCallInsightSelectedId } from "../store/slices/prospectSlice";
import { useDispatch } from "react-redux";
import { config } from "../lib/config";
import { supabase } from "../lib/supabase";

const communicationStyleConfigs = {
  Visual: {
    icon: Eye,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Prefers charts, graphs, and visual demonstrations",
  },
  Auditory: {
    icon: Ear,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Learns through listening and verbal communication",
  },
  Kinesthetic: {
    icon: Hand,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Prefers hands-on experiences and practical examples",
  },
};

// Personality type icons mapping
const personalityTypeIcons = {
  D: Brain,
  I: MessageSquare,
  S: Users,
  C: BarChart3,
};

// Communication modality icons mapping
const communicationModalityIcons = {
  Visual: Eye,
  Auditory: Ear,
  Kinesthetic: Hand,
};

const CallInsights = () => {
  usePageTimer("Call Insights");
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [insights, setInsights] = useState([]);
  const [communicationStyles, setCommunicationStyles] = useState([]);
  const [howToEngageSummary, setHowToEngageSummary] = useState(null);
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [newInsight, setNewInsight] = useState({
    content: "",
    type: "my_insights",
    typeId: "d12b7f8f-6c0d-4294-9e93-15e85c2ed035",
  });

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editingInsightId, setEditingInsightId] = useState(null);
  const [editingInsightContent, setEditingInsightContent] = useState("");
  const [isSavingInsight, setIsSavingInsight] = useState(false);
  const [allInsights, setAllInsights] = useState([]);

  // Company name editing state
  const [isEditingCompanyName, setIsEditingCompanyName] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState("");
  const [researchCompanyCount, setResearchCompanyCount] = useState(null);
  const [people, setPeople] = useState([]);

  const [insightTypes, setInsightTypes] = useState({});
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const { cummulativeSpinner, callInsightSelectedId } = useSelector(
    (state) => state.prospect
  );
  const [cummulativeSummary, setCummulativeSummary] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const { communicationStyleTypes } = useSelector((state) => state.org);
  const dispatch = useDispatch();

  // Salesperson checkbox state
  const [salespersonIds, setSalespersonIds] = useState(new Set());
  const [isUpdatingSalesperson, setIsUpdatingSalesperson] = useState(false);
  const [isPushingToHubSpot, setIsPushingToHubSpot] = useState(false);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);
  const [hubspotDataCount, setHubspotDataCount] = useState(0);
  const [isLoadingHubspotCount, setIsLoadingHubspotCount] = useState(false);
  const [isSyncingHubspot, setIsSyncingHubspot] = useState(false);
  console.log(selectedProspect, "check selected prospect 1");
  // Function to refresh peoples data
  const refreshPeoplesData = async () => {
    if (!selectedProspect?.id || !user?.id) return;
    try {
      const updatedPeople = await dbHelpers.getPeopleByProspectId(
        selectedProspect.id,
        user.id
      );

      // Update the selected prospect with new peoples data
      setSelectedProspect((prev) => ({
        ...prev,
        people: updatedPeople,
      }));

      // Also update the prospects list to keep it in sync
      setAllInsights((prev) =>
        prev.map((prospect) =>
          prospect.id === selectedProspect.id
            ? { ...prospect, people: updatedPeople }
            : prospect
        )
      );

      console.log("✅ Refreshed peoples data:", updatedPeople);
    } catch (error) {
      console.error("❌ Error refreshing peoples data:", error);
    }
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const CARDS_PER_VIEW = 4;

  // Arrow functions
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Dot click
  const scrollTo = useCallback(
    (index) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    const onInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect();
    };

    emblaApi.on("init", onInit);
    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);

    // Run once immediately
    onInit();

    return () => {
      emblaApi.off("init", onInit);
      emblaApi.off("reInit", onInit);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  function resolveInsightIcon(iconName) {
    const insightIcons = {
      TrendingUp,
      Target,
      Star,
      Users,
      Clock,
      Lightbulb,
      Eye,
      MessageSquare,
      Save,
      X,
    };
    return insightIcons[iconName] || Lightbulb;
  }

  function mapInsightTypesToObject(insightTypesArray) {
    return insightTypesArray.reduce((acc, item) => {
      acc[item.key] = {
        id: item.id,
        icon: resolveInsightIcon(item.icon), // e.g., "Lightbulb"
        label: item.label,
        description: item.description || "No description",
        color:
          item?.key == "buying_signal"
            ? "bg-green-100 text-green-800 border-green-200"
            : item?.key == "pain_point"
            ? "bg-red-100 text-red-800 border-red-200"
            : item?.key == "competitive_edge"
            ? "bg-blue-100 text-blue-800 border-blue-200"
            : item?.key == "stakeholder_dynamics"
            ? "bg-purple-100 text-purple-800 border-purple-200"
            : item?.key == "budget_insight"
            ? "bg-orange-100 text-orange-800 border-orange-200"
            : item?.key == "champion_identified"
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : item?.key == "risk_or_objection"
            ? "bg-orange-100 text-orange-800 border-orange-200"
            : item?.key == "comptetior_mention"
            ? "bg-blue-100 text-blue-800 border-blue-200"
            : item?.key == "decision_maker_identified"
            ? "bg-purple-100 text-purple-800 border-purple-200"
            : item?.key == "timeline_insight"
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : "bg-yellow-100 text-yellow-800 border-yellow-200", // fallback
      };
      return acc;
    }, {});
  }

  useEffect(() => {
    const loadInsightTypes = async () => {
      const types = await dbHelpers.getSalesInsightTypes();
      const mapped = mapInsightTypesToObject(types);
      setInsightTypes(mapped);
    };
    loadInsightTypes();
  }, []);
  // console.log(insightTypes, "insight types");
  useEffect(() => {
    const fetchCount = async () => {
      if (!user?.id) return;
      try {
        const result = await dbHelpers?.getResearchCompanyCountByUser(user?.id);
        setResearchCompanyCount(result);
      } catch (error) {
        console.error("Failed to load research count:", error);
        setResearchCompanyCount(null);
      } finally {
        console.log("Research count fetched");
      }
    };

    fetchCount();
    const fetchInsightsAndSetProspect = async () => {
      try {
        let insights = await dbHelpers.getProspectData(user?.id);

        // Sort insights by created_at descending
        insights = insights.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        const enrichedInsights = await Promise.all(
          insights.map(async (insight) => {
            const people = await dbHelpers.getPeopleByProspectId(
              insight.id,
              user?.id
            );
            return { ...insight, people, company_id: insight?.company?.id };
          })
        );

        setAllInsights(enrichedInsights);

        // setAllInsights(insights);
        let defaultInsight;

        if (location.state?.selectedCall) {
          const selectedCall = location.state.selectedCall;
          // console.log(selectedCall?.id, "check passed id call insights");
          defaultInsight = insights.find(
            (insight) => insight.id == selectedCall.id
          );

          // console.log(
          //   insights.find((insight) => insight.id == selectedCall.id),
          //   insights,
          //   selectedCall.id,
          //   "check default insights 237"
          // );
        }
        if (
          !defaultInsight &&
          insights?.length > 0 &&
          insights?.filter((x) => x.id == callInsightSelectedId)?.length > 0
        ) {
          defaultInsight = insights?.filter(
            (x) => x.id == callInsightSelectedId
          )?.[0]; // most recent
        }
        // console.log(defaultInsight, "check default insights");
        if (!defaultInsight && insights?.length > 0) {
          defaultInsight = insights[0]; // most recent
        }

        if (defaultInsight) {
          const companyName =
            defaultInsight?.company?.name || "Unknown Company";

          const people = await dbHelpers.getPeopleByProspectId(
            defaultInsight.id,
            user?.id
          );
          const callNotes = defaultInsight?.is_hubspot
            ? await dbHelpers.getCallNotes(defaultInsight?.id, user?.id)
            : [];
          // console.log(defaultInsight, "check default insight");
          const prospect = {
            id: defaultInsight.id,
            name: defaultInsight?.name,
            companyName,
            company_id: defaultInsight?.company?.id,
            calls: defaultInsight?.calls,
            prospectName:
              people
                ?.map((p) => p.name)
                .filter(Boolean)
                .join(", ") || "Unknown",
            title:
              people
                ?.map((p) => p.title)
                .filter(Boolean)
                .join(", ") || "Unknown",
            totalCalls: 1,
            lastCallDate: defaultInsight.created_at,
            lastEngagement: "Just now",
            status: "new",
            deal_value: defaultInsight?.deal_value || "TBD",
            probability: 50,
            nextAction: "Initial follow-up",
            dataSources: {
              fireflies: 1,
              hubspot: 0,
              presentations: 0,
              emails: 0,
            },
            fullInsight: defaultInsight,
            people, // ✅ attach people to selectedProspect
            call_summary: defaultInsight?.call_summary || "",
            communication_style_ids: defaultInsight?.communication_style_ids,
            is_hubspot: defaultInsight?.is_hubspot || false,
            hubspot_deal_id: defaultInsight?.hubspot_deal_id || null,
            deal_stage: defaultInsight?.deal_stage || null,
            hubspotDataCount: callNotes?.length || 0,
            researchCompanyId: defaultInsight?.research_id || null,
          };
          setCummulativeSummary(defaultInsight?.call_summary);
          setSelectedProspect(prospect);
          loadProspectInsights(defaultInsight);
          dispatch(setCallInsightSelectedId(defaultInsight?.id));
        } else {
          toast.info("No call insights found yet.");
        }
      } catch (error) {
        console.error("Failed to fetch call insights", error);
        toast.error("Error loading call insight data");
      }
    };

    fetchInsightsAndSetProspect();
  }, [location.state]);

  // console.log(allInsights, "get all insights 290");
  const fetchCommunicationStyles = async (styleIds) => {
    if (!styleIds?.length) return [];

    // const { data, error } = await dbHelpers.supabase
    //   .from("communication_styles")
    //   .select("*")
    //   .in("id", styleIds);
    const data = await dbHelpers.getCommunicationStylesData(styleIds, user?.id);

    // Sort: is_primary first
    return data.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });
  };

  const updateAllInsightsEntry = (updatedInsight) => {
    setAllInsights((prev) =>
      prev.map((insight) =>
        insight.id === updatedInsight.id ? updatedInsight : insight
      )
    );
  };

  // const loadProspectInsights = (insightData) => {
  //   setInsights(insightData.sales_insights || []);
  //   setCommunicationStyles(insightData.communication_styles || []);

  //   // Load mock data for demonstration - in real app this would come from the database
  //   if (insightData.id && mockCumulativeInsights.acme_corp) {
  //     setHowToEngageSummary(
  //       mockCumulativeInsights.acme_corp.howToEngageSummary
  //     );
  //   }
  // };
  const loadProspectInsights = async (insightData) => {
    // Check if prospect has sales_insight_ids
    if (
      insightData.sales_insight_ids &&
      insightData.sales_insight_ids.length > 0
    ) {
      const specificInsights = await dbHelpers.getSalesInsightsByIdNewFlow(
        insightData.sales_insight_ids,
        insightData.id,
        user?.id
      );

      // Group insights by type for display
      // const groupedSpecificInsights = specificInsights.reduce(
      //   (acc, insight) => {
      //     const typeKey = insight.type || "unknown";
      //     const existingGroup = acc.find((group) => group.type === typeKey);

      //     if (existingGroup) {
      //       existingGroup.insights.push(insight);
      //     } else {
      //       acc.push({
      //         type: typeKey,
      //         type_id: insight.type_id || insight.insight_type_id,
      //         average_score: insight.relevance_score || 0,
      //         insights: [insight],
      //       });
      //     }

      //     return acc;
      //   },
      //   []
      // );

      // console.log("✅ Grouped specific insights:", groupedSpecificInsights);
      setInsights(specificInsights);
    } else {
      // Use existing flow - get all insights by prospect ID
      const groupedInsights = await dbHelpers.getSalesInsightsByProspectId(
        insightData.id,
        user?.id
      );
      setInsights(groupedInsights);
    }

    const styles = await fetchCommunicationStyles(
      insightData.communication_style_ids
    );
    setCommunicationStyles(styles);

    // Load existing salesperson selections
    const existingSalespersonIds = new Set(
      styles.filter((style) => style.is_salesperson).map((style) => style.id)
    );
    setSalespersonIds(existingSalespersonIds);

    const peopleList = await dbHelpers.getPeopleByProspectId(
      insightData.id,
      user?.id
    );
    setPeople(peopleList);
  };
  // console.log(people, "get people list");

  const refreshCommunicationStyles = async () => {
    const styles = await fetchCommunicationStyles(
      selectedProspect?.communication_style_ids
    );

    setCommunicationStyles(styles);

    // Update salesperson selections
    const existingSalespersonIds = new Set(
      styles.filter((style) => style.is_salesperson).map((style) => style.id)
    );
    setSalespersonIds(existingSalespersonIds);
  };

  const refreshCummulativeSummary = async () => {
    // console.log(selectedProspect?.id, "check spin summary");
    if (selectedProspect?.id != undefined) {
      const summary = await dbHelpers.getProspectSummary(selectedProspect?.id);
      // console.log(summary, "check spin summary");
      setCummulativeSummary(summary?.call_summary);
    }
  };

  useEffect(() => {
    refreshCommunicationStyles();
    refreshCummulativeSummary();
  }, [cummulativeSpinner]);
  // console.log(
  //   communicationStyles,
  //   cummulativeSpinner,
  //   selectedProspect?.communication_style_ids,
  //   "check spin"
  // );
  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    setCummulativeSummary(prospect?.call_summary);
    loadProspectInsights(prospect.fullInsight);
    dispatch(setCallInsightSelectedId(prospect?.id));
    toast.success(`Loaded insights for ${prospect.companyName}`);
  };

  const handleEditCompanyName = () => {
    setIsEditingCompanyName(true);
    setEditingCompanyName(selectedProspect.companyName);
  };

  // console.log(selectedProspect, "check selected prospect");

  const handleSaveCompanyName = async () => {
    if (!editingCompanyName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }

    try {
      const newCompanyName = editingCompanyName.trim();
      if (selectedProspect?.is_hubspot) {
        if (
          hubspotIntegration?.connected &&
          hubspotIntegration?.hubspotUserId
        ) {
          const companyData = await dbHelpers.getHubspotCompanyId(
            selectedProspect
          );
          const apiFormData = new FormData();
          apiFormData.append("id", user?.organization_id);
          apiFormData.append("companyid", companyData?.hubspot_company_id);
          apiFormData.append("ownerid", hubspotIntegration?.hubspotUserId);
          apiFormData.append("companyname", editingCompanyName.trim());

          const response = await fetch(
            `${config.api.baseUrl}${config.api.endpoints.updateCompanyName}`,
            {
              method: "POST",
              body: apiFormData,
            }
          );
        }
      }

      // Update company table
      await dbHelpers.updateCompanyName(
        selectedProspect.company_id,
        newCompanyName
      );

      // Update local state (important: update company.name if used in UI)
      setSelectedProspect((prev) => ({
        ...prev,
        companyName: newCompanyName,
        company: {
          ...prev.company,
          name: newCompanyName,
        },
        fullInsight: {
          ...prev.fullInsight,
          company_details: {
            ...prev.fullInsight.company_details,
            name: newCompanyName,
          },
        },
      }));
      setAllInsights((prev) =>
        prev.map((insight) =>
          insight.id === selectedProspect.id
            ? {
                ...insight,
                company: {
                  ...insight.company,
                  name: newCompanyName,
                },
              }
            : insight
        )
      );

      setIsEditingCompanyName(false);
      setEditingCompanyName("");
      toast.success("Company name updated successfully");
    } catch (error) {
      console.error("Error updating company name:", error);
      toast.error("Failed to update company name");
    }
  };

  const handleCancelEditCompanyName = () => {
    setIsEditingCompanyName(false);
    setEditingCompanyName("");
  };

  const handleAddInsight = async () => {
    if (
      !newInsight.content.trim() ||
      !selectedProspect?.id ||
      !newInsight.typeId
    ) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const newEntry = {
        content: newInsight.content.trim(),
        type_id: newInsight.typeId,
        relevance_score: 0,
        is_selected: true,
        source: "User Input",
        timestamp: new Date().toISOString(),
        user_id: user?.id,
      };

      // 1. Insert into sales_insights
      const inserted = await dbHelpers.insertSalesInsight(newEntry);
      if (!inserted) throw new Error("Insert failed");

      // 2. Update recent insight row by adding this sales_insight id
      await dbHelpers.updateInsightWithNewSalesInsightId(
        selectedProspect.id,
        inserted.id
      );

      // 3. Refresh insights list for the UI
      const groupedInsights = await dbHelpers.getSalesInsightsByProspectId(
        selectedProspect.id,
        user?.id
      );
      setInsights(groupedInsights);

      // 4. Reset form state
      setNewInsight({
        content: "",
        type: "my_insights",
        typeId: "d12b7f8f-6c0d-4294-9e93-15e85c2ed035", // Default 'my_insights' typeId
      });
      setIsAddingInsight(false);

      toast.success("Insight added successfully");
    } catch (error) {
      console.error("Error in handleAddInsight:", error);
      toast.error("Failed to add insight");
    }
  };

  const handleMoveInsight = async (typeId, direction) => {
    if (!selectedProspect?.id || !insights || insights.length === 0) return;

    // Clone the current insights array
    const newInsights = [...insights];

    // Find the index of the block with the matching type_id
    const currentIndex = newInsights.findIndex(
      (insight) => insight.type_id === typeId
    );

    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === newInsights.length - 1)
    ) {
      // Can't move
      return;
    }

    // Swap logic
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newInsights[currentIndex], newInsights[targetIndex]] = [
      newInsights[targetIndex],
      newInsights[currentIndex],
    ];

    // Reassign new priority based on position
    const updatedPriorityList = newInsights.map((insight, index) => ({
      type_id: insight.type_id,
      priority: index + 1,
      average_score: insight.average_score,
    }));

    // Update in Supabase
    const success = await dbHelpers.updateSalesInsightPriorityList(
      selectedProspect.id,
      updatedPriorityList
    );

    if (success) {
      setInsights(newInsights);
      toast.success("Insight priority updated");
    } else {
      toast.error("Failed to update priority list");
    }
  };

  const handleEditInsightContent = (insightId, content) => {
    setEditingInsightId(insightId);
    setEditingInsightContent(content);
  };

  const handleSaveInsightContent = async (id, content) => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSavingInsight(true);
    try {
      // ✅ Update the insight content in Supabase
      const updated = await dbHelpers.updateSalesInsightContent(
        id,
        content.trim(),
        user?.id
      );

      if (updated) {
        console.log("Insight updated successfully:", updated);
      }

      // ✅ Update local state
      setInsights((prev) =>
        prev.map((group) => ({
          ...group,
          insights: group.insights.map((insight) =>
            insight.id === id
              ? { ...insight, content: content.trim() }
              : insight
          ),
        }))
      );

      setEditingInsightId(null);
      setEditingInsightContent("");
      toast.success("Insight updated successfully");
    } catch (error) {
      console.error("Error updating insight:", error);
      toast.error("Failed to update insight");
    } finally {
      setIsSavingInsight(false);
    }
  };

  const handleCancelInsightEdit = () => {
    setEditingInsightId(null);
    setEditingInsightContent("");
  };

  const handleDeleteInsightContent = async (insightId) => {
    if (!insightId) {
      toast.error("Invalid insight ID");
      return;
    }

    try {
      // ✅ Mark the insight as inactive in Supabase
      const updated = await dbHelpers.deleteSalesInsightContent(
        insightId,
        {
          is_active: false,
        },
        user?.id
      );

      if (updated) {
        console.log("Insight marked as inactive:", updated);
      }

      // ✅ Remove the insight from local state
      setInsights((prev) =>
        prev.map((group) => ({
          ...group,
          insights: group.insights.filter(
            (insight) => insight.id !== insightId
          ),
        }))
      );

      toast.success("Insight deleted successfully");
    } catch (error) {
      console.log("Error deleting insight:", error);
      toast.error("Failed to delete insight");
    } finally {
      setIsSavingInsight(false);
    }
  };
  console.log(selectedProspect, "check selected prospect 2");
  const handleSyncHubspotData = async () => {
    if (!selectedProspect?.is_hubspot || !selectedProspect?.hubspot_deal_id) {
      toast.error("This is not a HubSpot deal");
      return;
    }

    if (!hubspotIntegration?.connected || !hubspotIntegration?.hubspotUserId) {
      toast.error("HubSpot integration not available");
      return;
    }
    const companyDetails = await dbHelpers.getHubspotCompanyId(
      selectedProspect
    );
    if (!companyDetails?.hubspot_company_id) {
      toast.error("HubSpot company ID not available for this deal");
      return;
    }

    setIsSyncingHubspot(true);

    try {
      // Step 1: Sync company data from HubSpot
      console.log("📊 Step 1: Syncing company data from HubSpot...");
      const companyResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}hub-get-company-detail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user?.organization_id,
            companyid: companyDetails?.hubspot_company_id,
            ownerid: hubspotIntegration?.hubspotUserId,
          }),
        }
      );

      if (!companyResponse.ok) {
        throw new Error(
          `Company sync failed: ${companyResponse.status} ${companyResponse.statusText}`
        );
      }

      const companyData = await companyResponse.json();
      console.log("📊 Company data received:", companyData);

      if (companyData && companyData.length > 0) {
        const company = companyData[0];

        // Update company in database
        const { error: companyUpdateError } = await supabase
          .from("company")
          .update({
            name: company.properties.name,
            hubspot_updated_at: company.updatedAt,
          })
          .eq("hubspot_company_id", company.id);

        if (companyUpdateError) {
          console.error("❌ Error updating company:", companyUpdateError);
          toast.error("Failed to update company data");
        } else {
          console.log("✅ Company updated successfully");

          // Update local state
          setAllInsights((prevProspects) =>
            prevProspects.map((p) =>
              p.company_id === selectedProspect.company_id
                ? {
                    ...p,
                    company: {
                      ...p.company,
                      name: company.properties.name,
                      hubspot_updated_at: company.updatedAt,
                    },
                    companyName: company.properties.name,
                  }
                : p
            )
          );
          setSelectedProspect((prev) => ({
            ...prev,
            companyName: company.properties.name,
            company: {
              ...prev.company,
              name: company.properties.name,
            },
          }));
        }
      }

      // Step 2: Sync deal data from HubSpot
      console.log("💼 Step 2: Syncing deal data from HubSpot...");
      const dealResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}hub-get-deal-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dealid: selectedProspect.hubspot_deal_id,
            id: user?.organization_id,
          }),
        }
      );

      if (!dealResponse.ok) {
        throw new Error(
          `Deal sync failed: ${dealResponse.status} ${dealResponse.statusText}`
        );
      }

      const dealData = await dealResponse.json();
      console.log("💼 Deal data received:", dealData);

      if (dealData && dealData.length > 0) {
        const deal = dealData[0];

        // Update prospect in database
        const { error: prospectUpdateError } = await supabase
          .from("prospect")
          .update({
            name: deal.properties.dealname,
            deal_value: deal.properties.amount
              ? parseFloat(deal.properties.amount)
              : null,
            close_date: deal.properties.closedate,
            deal_stage: deal.properties.dealstage,
            hubspot_updated_at: deal.updatedAt,
          })
          .eq("hubspot_deal_id", deal.id);

        if (prospectUpdateError) {
          console.error("❌ Error updating prospect:", prospectUpdateError);
          toast.error("Failed to update deal data");
        } else {
          console.log("✅ Prospect updated successfully");

          // Update local state
          setAllInsights((prevProspects) =>
            prevProspects.map((p) =>
              p.id === selectedProspect.id
                ? {
                    ...p,
                    name: deal.properties.dealname,
                    deal_value: deal.properties.amount
                      ? parseFloat(deal.properties.amount)
                      : null,
                    close_date: deal.properties.closedate,
                    deal_stage: deal.properties.dealstage,
                    hubspot_updated_at: deal.updatedAt,
                  }
                : p
            )
          );

          // Update selected prospect
          setSelectedProspect((prev) => ({
            ...prev,
            name: deal.properties.dealname,
            amount: deal.properties.amount
              ? parseFloat(deal.properties.amount)
              : null,
            close_date: deal.properties.closedate,
            deal_stage: deal.properties.dealstage,
            hubspot_updated_at: deal.updatedAt,
            company: {
              ...prev.company,
              name: companyData[0]?.properties?.name || prev.company.name,
            },
          }));
        }
      }

      // Show success message
      const updates = [];
      if (companyData?.length > 0) updates.push("company");
      if (dealData?.length > 0) updates.push("deal");

      if (updates.length > 0) {
        toast.success(`Successfully synced ${updates.join(", ")} from HubSpot`);
      } else {
        toast.info("No new data to sync from HubSpot");
      }
    } catch (error) {
      console.error("❌ Error syncing HubSpot data:", error);
      toast.error("Failed to sync HubSpot data: " + error.message);
    } finally {
      setIsSyncingHubspot(false);
    }
  };

  const handlePushToHubSpot = async () => {
    if (!hubspotIntegration?.connected || !hubspotIntegration?.hubspotUserId) {
      toast.error("HubSpot integration not available");
      return;
    }

    if (!selectedProspect?.hubspot_deal_id) {
      toast.error("This deal is not synced with HubSpot");
      return;
    }

    if (!selectedProspect?.company_id) {
      toast.error("Company is not synced with HubSpot");
      return;
    }

    if (totalInsightsCount === 0) {
      toast.error("No insights available to push");
      return;
    }

    setIsPushingToHubSpot(true);

    try {
      const companyData = await dbHelpers.getHubspotCompanyId(selectedProspect);
      console.log(companyData, "check company data");

      // Create formatted HTML content for HubSpot
      const formatInsightsForHubSpot = (insights) => {
        const allInsights = [];

        // Process each insight category
        insights.forEach((category) => {
          if (category.insights && category.insights.length > 0) {
            const selectedInsights = category.insights.filter(
              (insight) => insight.is_selected
            );
            if (selectedInsights.length > 0) {
              allInsights.push({
                type: category.type,
                averageScore: category.average_score,
                insights: selectedInsights,
              });
            }
          }
        });

        if (allInsights.length === 0) {
          return "<p>No insights available to push.</p>";
        }

        // Create clean, professional HTML content
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px;">
            <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #007bff;">SalesGenius AI Insights</h2>
              <p style="margin: 0; font-size: 14px; color: #6c757d;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        allInsights.forEach((category) => {
          const categoryTitle = category.type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          htmlContent += `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;">
                ${categoryTitle}
                <span style="font-weight: normal; font-size: 14px; color: #6c757d; margin-left: 8px;">(Avg Score: ${category.averageScore.toFixed(
                  1
                )})</span>
              </h3>
              <div style="background: #ffffff; border: 1px solid #dee2e6; border-radius: 6px; padding: 16px;">
          `;

          category.insights.forEach((insight, index) => {
            htmlContent += `
              <div style="margin-bottom: ${
                index < category.insights.length - 1 ? "16px" : "0"
              }; ${
              index < category.insights.length - 1
                ? "border-bottom: 1px solid #f1f3f4; padding-bottom: 16px;"
                : ""
            }">
                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #212529;">${
                  insight.content
                }</p>
                <div style="font-size: 13px; color: #6c757d;">
                  <span style="margin-right: 16px;"><strong>Speaker:</strong> ${
                    insight.speaker || "Unknown"
                  }</span>
                  <span style="margin-right: 16px;"><strong>Score:</strong> ${
                    insight.relevance_score || "N/A"
                  }</span>
                  <span><strong>Source:</strong> ${
                    insight.source || "N/A"
                  }</span>
                </div>
              </div>
            `;
          });

          htmlContent += `
              </div>
            </div>
          `;
        });

        // Add simple summary
        const totalInsights = allInsights.reduce(
          (sum, category) => sum + category.insights.length,
          0
        );
        htmlContent += `
          <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6c757d; font-weight: 500;">
              Total: ${totalInsights} insights across ${allInsights.length} categories
            </p>
          </div>
          </div>
        `;

        return htmlContent;
      };

      // Format insights for HubSpot body with HTML
      const formattedBody = formatInsightsForHubSpot(insights);

      // Prepare API payload
      const payload = {
        Hubspotdata: {
          engagement: {
            active: true,
            ownerId: hubspotIntegration.hubspotUserId,
            timestamp: Date.now(),
            type: "NOTE",
          },
          associations: {
            dealIds: [selectedProspect.hubspot_deal_id],
            companyIds: [companyData?.hubspot_company_id],
          },
          metadata: {
            body: formattedBody.trim(),
          },
        },
        id: user?.organization_id,
        dealid: selectedProspect.hubspot_deal_id,
        companyid: companyData?.hubspot_company_id,
        ownerId: hubspotIntegration.hubspotUserId,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}SI-push-HS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      toast.success("Data successfully pushed to HubSpot!");
    } catch (error) {
      console.error("Error pushing to HubSpot:", error);
      toast.error("Failed to push insights to HubSpot: " + error.message);
    } finally {
      setIsPushingToHubSpot(false);
    }
  };

  // Helper function to get category colors
  const getCategoryColor = (type) => {
    const colorMap = {
      buying_signal: "#28a745", // Green
      pain_point: "#dc3545", // Red
      risk_or_objection: "#fd7e14", // Orange
      competitor_mention: "#6f42c1", // Purple
      decision_maker_identified: "#007bff", // Blue
      budget_insight: "#20c997", // Teal
      timeline_insight: "#ffc107", // Yellow
      champion_identified: "#e83e8c", // Pink
      my_insights: "#6c757d", // Gray
    };
    return colorMap[type] || "#6c757d";
  };

  // Helper function to get score colors
  const getScoreColor = (score) => {
    if (score >= 80) return "#28a745"; // Green for high scores
    if (score >= 60) return "#ffc107"; // Yellow for medium scores
    if (score >= 40) return "#fd7e14"; // Orange for low scores
    return "#dc3545"; // Red for very low scores
  };

  // console.log(allInsights, "check all insights");
  const filteredProspects = allInsights?.filter(
    (prospect) =>
      prospect?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate carousel values
  const totalPages = Math.ceil(filteredProspects.length / CARDS_PER_VIEW);
  const showCarousel = filteredProspects.length > CARDS_PER_VIEW;
  const startIndex = currentIndex * CARDS_PER_VIEW;
  const endIndex = Math.min(
    startIndex + CARDS_PER_VIEW,
    filteredProspects.length
  );
  const visibleProspects = showCarousel
    ? filteredProspects.slice(startIndex, endIndex)
    : filteredProspects;

  // Carousel navigation functions
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleDotClick = (pageIndex) => {
    setCurrentIndex(pageIndex);
  };

  // Reset carousel when search changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest(".prospect-carousel")) {
        if (e.key === "ArrowLeft" && currentIndex > 0) {
          handlePrevious();
        } else if (e.key === "ArrowRight" && currentIndex < totalPages - 1) {
          handleNext();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalPages]);

  // console.log(allInsights, "all insights data");
  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "new":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "decreasing":
        return <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />;
      case "new":
        return <Star className="w-3 h-3 text-blue-600" />;
      default:
        return null;
    }
  };
  const totalInsightsCount = insights?.reduce(
    (sum, item) => sum + item?.insights?.length,
    0
  );

  // Name editing handlers
  const handleNameEdit = (stakeholder) => {
    // Cancel role editing if active
    if (editingRoleId) {
      setEditingRoleId(null);
      setEditRoleValue("");
    }

    setEditingNameId(stakeholder.id);
    setEditNameValue(stakeholder.stakeholder);
  };

  const handleNameSave = async (stakeholderId) => {
    if (!editNameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdatingName(true);
    try {
      await dbHelpers.updateCommunicationStyleName(
        stakeholderId,
        editNameValue.trim(),
        selectedProspect?.id,
        user?.id
      );

      // Update local state
      setCommunicationStyles((prev) =>
        prev.map((style) =>
          style.id === stakeholderId
            ? { ...style, stakeholder: editNameValue.trim() }
            : style
        )
      );

      setEditingNameId(null);
      setEditNameValue("");

      // Refresh peoples data to sync with updated name
      await refreshPeoplesData();

      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleNameCancel = () => {
    setEditingNameId(null);
    setEditNameValue("");
  };

  const handleRoleEdit = (stakeholder) => {
    // Cancel name editing if active
    if (editingNameId) {
      setEditingNameId(null);
      setEditNameValue("");
    }

    setEditingRoleId(stakeholder.id);
    setEditRoleValue(stakeholder.role || "");
  };

  const handleRoleSave = async (commStyleId) => {
    try {
      await dbHelpers?.updateCommunicationStyleRole(
        commStyleId,
        editRoleValue,
        selectedProspect?.id,
        user?.id
      );

      // Update local state
      setCommunicationStyles((prev) =>
        prev.map((style) =>
          style.id === commStyleId ? { ...style, role: editRoleValue } : style
        )
      );

      setEditingRoleId(null);
      setEditRoleValue("");
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleRoleCancel = () => {
    setEditingRoleId(null);
    setEditRoleValue("");
  };

  // Handle salesperson checkbox change
  const handleSalespersonToggle = async (stakeholderId, isChecked) => {
    setIsUpdatingSalesperson(true);

    try {
      // Update database
      await dbHelpers.updateCommunicationStyleSalesperson(
        stakeholderId,
        isChecked,
        selectedProspect?.id,
        user?.id
      );

      // Update local state
      const newSalespersonIds = new Set(salespersonIds);
      if (isChecked) {
        newSalespersonIds.add(stakeholderId);
      } else {
        newSalespersonIds.delete(stakeholderId);
      }
      setSalespersonIds(newSalespersonIds);

      // Update communication styles to reflect the change
      setCommunicationStyles((prev) =>
        prev.map((style) =>
          style.id === stakeholderId
            ? { ...style, is_salesperson: isChecked }
            : style
        )
      );

      toast.success(
        isChecked ? "Marked as salesperson" : "Removed salesperson marking"
      );
    } catch (error) {
      console.error("Error updating salesperson status:", error);
      toast.error("Failed to update salesperson status");
    } finally {
      setIsUpdatingSalesperson(false);
    }
  };

  // Sort communication styles: primary first, then non-salesperson, then salesperson at bottom
  const sortedCommunicationStyles = [...communicationStyles].sort((a, b) => {
    // Primary decision makers always first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;

    // Among non-primary: salesperson goes to bottom
    if (!a.is_primary && !b.is_primary) {
      if (a.is_salesperson && !b.is_salesperson) return 1;
      if (!a.is_salesperson && b.is_salesperson) return -1;
    }

    return 0;
  });
  // console.log("Total insights count:", totalInsightsCount);

  // console.log(insights, "get list of insights");
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Call Insights
          </h1>
          <p className="text-muted-foreground">
            Accelerating Prospect Conversion - Your ultimate hub for AI-driven
            prospect intelligence
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/calls")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Sales Calls
          </Button>
        </div>
      </div>

      {/* Cumulative Intelligence Active Indicator */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"></div>

      {filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Deals Processed</h3>
            <p className="text-muted-foreground mb-4">
              No deals have been processed yet. Upload and process call
              transcripts to see prospect insights here.
            </p>
            <Button onClick={() => navigate("/calls")} variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              Go to Sales Calls
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Deal Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search deals by company or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Prospect List */}
            <div className="relative">
              {/* Left Arrow */}

              <button
                onClick={scrollPrev}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full border hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow */}

              <button
                onClick={scrollNext}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full border hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Carousel Viewport */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                  {filteredProspects.map((prospect) => {
                    const companyName =
                      prospect.company?.name || "Unknown Company";
                    const prospectNames =
                      prospect.people
                        ?.map((p) => p.name)
                        .filter(Boolean)
                        .join(", ") || "Unknown";
                    const titles =
                      prospect.people
                        ?.map((p) => p.title)
                        .filter(Boolean)
                        .join(", ") || "Unknown";
                    const totalCalls = prospect?.calls;
                    const dealValue = "TBD";
                    const probability = 50;
                    const lastEngagement = new Date(
                      prospect.created_at
                    ).toLocaleDateString();
                    const status = "new";

                    return (
                      <div
                        key={prospect.id}
                        className={cn(
                          "min-w-[300px] max-w-[300px] shrink-0 border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                          selectedProspect?.id === prospect.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={async () => {
                          const callNotes = prospect?.is_hubspot
                            ? await dbHelpers.getCallNotes(
                                prospect?.id,
                                user?.id
                              )
                            : [];
                          handleProspectSelect({
                            id: prospect.id,
                            name: prospect.name,
                            companyName,
                            company_id: prospect?.company_id,
                            prospectNames,
                            titles,
                            totalCalls,
                            lastCallDate: prospect.created_at,
                            lastEngagement,
                            status,
                            deal_value: prospect?.deal_value || "TBD",
                            probability,
                            nextAction: "Initial follow-up",
                            dataSources: {
                              fireflies: 1,
                              hubspot: 0,
                              presentations: 0,
                              emails: 0,
                            },
                            fullInsight: prospect,
                            calls: prospect?.calls || 1,
                            people: prospect.people,
                            call_summary: prospect?.call_summary,
                            communication_style_ids:
                              prospect?.communication_style_ids,
                            is_hubspot: prospect?.is_hubspot || false,
                            hubspot_deal_id: prospect?.hubspot_deal_id || null,
                            deal_stage: prospect?.deal_stage || null,
                            hubspotDataCount: callNotes?.length || 0,
                            researchCompanyId: prospect?.research_id || null,
                          });
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {companyName}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {prospectNames}
                            </p>
                          </div>
                          <span
                            className={cn("text-xs", getStatusColor(status))}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Calls:
                            </span>
                            <span className="font-medium">{totalCalls}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Deal Value:
                            </span>
                            <span className="font-medium">
                              {prospect?.deal_value || "TBD"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Deal Stage:
                            </span>
                            <span className="font-medium">
                              {prospect?.deal_stage || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last Engagement:
                            </span>
                            <span className="font-medium">
                              {lastEngagement}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Opportunity:
                            </span>
                            <span className="font-medium">{prospect.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center mt-4 gap-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      index === selectedIndex ? "bg-primary" : "bg-gray-300"
                    )}
                  ></button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Prospect Selection */}

      {selectedProspect && (
        <>
          {/* Company Name Section with Edit Capability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Company Information</span>
                </div>
                {selectedProspect?.is_hubspot &&
                  selectedProspect?.hubspot_deal_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncHubspotData}
                      disabled={
                        isSyncingHubspot || !hubspotIntegration?.connected
                      }
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                    >
                      {isSyncingHubspot ? (
                        <>
                          Syncing
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync from HubSpot
                        </>
                      )}
                    </Button>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Company Name:
                </span>
                {isEditingCompanyName ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      value={editingCompanyName}
                      onChange={(e) => setEditingCompanyName(e.target.value)}
                      className="flex-1"
                      placeholder="Enter company name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCompanyName();
                        if (e.key === "Escape") handleCancelEditCompanyName();
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveCompanyName}
                      disabled={!editingCompanyName.trim()}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditCompanyName}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-lg font-semibold">
                      {selectedProspect.companyName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCompanyName}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cummulative Intelligence Section */}
          <Card data-tour="cumulative-intelligence">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Cumulative Intelligence</span>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <ExternalLink
                    className={cn(
                      "w-4 h-4",
                      insights?.length > 0 ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                  <span className="text-sm">Calls:</span>
                  {/* {console.log(selectedProspect, "selected prospect calls")} */}
                  <Badge
                    variant={selectedProspect?.calls ? "default" : "secondary"}
                  >
                    {(selectedProspect?.communication_style_ids != null &&
                      selectedProspect?.calls) ||
                      0}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Database
                    className={cn(
                      "w-4 h-4",
                      selectedProspect.dataSources.hubspot > 0
                        ? "text-orange-600"
                        : "text-gray-400"
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      HubSpot:
                    </span>
                    <Badge
                      variant={
                        selectedProspect?.hubspotDataCount > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      <span className="font-medium">
                        {selectedProspect?.hubspotDataCount}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText
                    className={cn(
                      "w-4 h-4",
                      selectedProspect?.researchCompanyId != null
                        ? "text-purple-600"
                        : "text-gray-400"
                    )}
                  />
                  <span className="text-sm">Research:</span>
                  <Badge
                    variant={
                      selectedProspect?.researchCompanyId != null
                        ? "default"
                        : "secondary"
                    }
                    // variant={"secondary"}
                  >
                    {selectedProspect?.researchCompanyId != null ? 1 : 0}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare
                    className={cn(
                      "w-4 h-4",
                      selectedProspect.dataSources.emails > 0
                        ? "text-green-600"
                        : "text-gray-400"
                    )}
                  />
                  <span className="text-sm">Internal data:</span>
                  <Badge
                    variant={
                      selectedProspect.dataSources.emails > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedProspect.dataSources.emails}
                  </Badge>
                </div>
              </div>

              {cummulativeSpinner ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {cummulativeSummary || ""}
                </p>
              )}
            </CardContent>
          </Card>
          {/* Sales Insights Section */}
          <Card data-tour="sales-insights-section">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Sales Insights</span>
                  <Badge variant="secondary">
                    {totalInsightsCount} insights
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {console.log(hubspotIntegration, "hubspot integration")}
                  {hubspotIntegration?.connected &&
                    hubspotIntegration?.hubspotUserId &&
                    hubspotIntegration?.hubspotUserId != undefined &&
                    selectedProspect?.is_hubspot && (
                      <Button
                        variant="outline"
                        onClick={handlePushToHubSpot}
                        disabled={
                          totalInsightsCount === 0 ||
                          !hubspotIntegration?.connected ||
                          isPushingToHubSpot
                        }
                        size="sm"
                      >
                        {isPushingToHubSpot ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Pushing...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Push to HubSpot
                          </>
                        )}
                      </Button>
                    )}

                  <Button
                    onClick={() => setIsAddingInsight(true)}
                    disabled={isAddingInsight}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Insight
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Insight */}
              {/* {console.log(newInsight, "newInsight type")} */}
              {isAddingInsight && (
                <div className="border border-dashed border-primary rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Select
                      value={newInsight.type}
                      onValueChange={(value) => {
                        const selectedType = Object.entries(insightTypes).find(
                          ([key]) => key === value
                        );

                        const selectedTypeId = selectedType?.[1]?.id || null;

                        setNewInsight((prev) => ({
                          ...prev,
                          type: value,
                          typeId: selectedTypeId,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(insightTypes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <config.icon className="w-4 h-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    value={newInsight.content}
                    onChange={(e) =>
                      setNewInsight((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Enter your insight about this deal..."
                    className="min-h-20"
                    autoFocus
                  />

                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={handleAddInsight}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Insight
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingInsight(false);
                        setNewInsight({
                          content: "",
                          type: "my_insights",
                          typeId: "d12b7f8f-6c0d-4294-9e93-15e85c2ed035",
                        });
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {/* {console.log(insights, "get insights data 1")} */}
              {/* Insights List */}
              {insights?.map((insight, index) => {
                const typeConfig = insightTypes[insight?.type] || {
                  label: "My Insight",
                  color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                  icon: Lightbulb,
                };
                // console.log(insightTypes, "get insight types 905");
                const TypeIcon = typeConfig?.icon;

                return (
                  insight?.insights?.length > 0 && (
                    <div
                      key={insight.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", typeConfig?.color)}
                              >
                                {/* <TypeIcon className="w-3 h-3 mr-1" /> */}

                                {typeConfig?.label || ""}
                                <Info className="ml-1 w-3 h-3" />
                              </Badge>
                            </TooltipTrigger>

                            <TooltipContent
                              side="top"
                              align="center"
                              className="z-50 bg-white text-sm text-gray-800 max-w-xs p-3 rounded-md shadow-xl border border-gray-200"
                            >
                              <p className="leading-snug">
                                {typeConfig?.description ||
                                  "No description available."}
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          <Badge variant="secondary" className="text-xs">
                            Score: {insight?.average_score || 0}
                          </Badge>
                          {/* {getTrendIcon(insight.trend)} */}
                          {/* <span className="text-xs text-muted-foreground">
                          {insight.source} • {insight.timestamp}
                        </span> */}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleMoveInsight(insight.type_id, "up")
                            }
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleMoveInsight(insight.type_id, "down")
                            }
                            disabled={index === insights.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Insights content */}
                      <div className="ml-6">
                        <div
                          className={cn(
                            "space-y-2",
                            insight?.insights?.length > 3 &&
                              "max-h-60 overflow-y-auto pr-2"
                         className="border-2 border-orange-500 text-orange-600 hover:border-orange-600 hover:text-orange-700 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-200 h-6 px-2 text-xs font-semibold"
                        >
                          {insight?.insights?.map((x) => (
                            <div key={x.id} className="relative">
                              {editingInsightId === x.id ? (
                                // Edit Mode
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-md p-3 space-y-3">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-4">
                                      <span>
                                        <strong>Speaker:</strong>{" "}
                                        {x.speaker || "Unknown"}
                                      </span>
                                      <span>
                                        <strong>Score:</strong>{" "}
                                        {x.relevance_score || "N/A"}
                                      </span>
                                      <span>
                                        <strong>Source:</strong>{" "}
                                        {x?.source
                                          ? x?.source.charAt(0).toUpperCase() +
                                            x?.source.slice(1)
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                  <Textarea
                                    value={editingInsightContent}
                                    onChange={(e) =>
                                      setEditingInsightContent(e.target.value)
                                    }
                                    className="min-h-20 text-sm resize-none"
                                    autoFocus
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSaveInsightContent(
                                          x.id,
                                          editingInsightContent
                                        )
                                      }
                                      disabled={
                                        isSavingInsight ||
                                        !editingInsightContent.trim()
                                      }
                                      className="h-7 px-3 text-xs"
                                    >
                                      {isSavingInsight ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-3 h-3 mr-1" />
                                          Save
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelInsightEdit}
                                      disabled={isSavingInsight}
                                      className="h-7 px-3 text-xs"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="bg-muted/40 rounded-md p-3 text-sm relative group hover:bg-muted/60 transition-colors">
                                  <p className="pr-16 leading-relaxed">
                                    {x.content}
                                  </p>

                                  {/* Tooltip on hover */}
                                  {/* <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border rounded shadow-lg p-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max max-w-xs z-[9999] pointer-events-none">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">
                                        Speaker:
                                      </span>
                                      <span>{x.speaker || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">
                                        Relevance Score:
                                      </span>
                                      <span>{x.relevance_score || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">
                                        Source:
                                      </span>
                                      <span>{x.source || "Current"}</span>
                                    </div>
                                  </div> */}

                                  {/* Tooltip using Radix UI */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="absolute inset-0 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="center"
                                        className="z-[9999] bg-white border border-gray-200 rounded-md shadow-lg p-3 text-xs max-w-xs"
                                        sideOffset={5}
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-700">
                                              Speaker:
                                            </span>
                                            <span className="text-gray-600">
                                              {x.speaker || "Unknown"}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-700">
                                              Relevance Score:
                                            </span>
                                            <span className="text-gray-600">
                                              {x.relevance_score || "N/A"}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-700">
                                              Source:
                                            </span>
                                            <span className="text-gray-600">
                                              {x.source || "Current"}
                                            </span>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  {/* Edit and Delete buttons */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-background/80"
                                      onClick={() =>
                                        handleEditInsightContent(
                                          x.id,
                                          x.content
                                        )
                                      }
                                      title="Edit insight"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-destructive/20 text-destructive"
                                      onClick={() =>
                                        handleDeleteInsightContent(x.id)
                                      }
                                      title="Delete insight"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                );
              })}

              {totalInsightsCount === 0 && !isAddingInsight && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No insights available yet</p>
                  <p className="text-sm mb-4">
                    Add your first insight about this deal
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingInsight(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Insight
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Styles Detected with Behavioral Insights */}
          <Card data-tour="communication-style-section">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Stakeholder Behavioral & Communication Insights</span>
                <Badge variant="secondary">
                  {communicationStyles.length} stakeholders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cummulativeSpinner ? (
                <div className="space-y-6">
                  {/* Skeleton for stakeholder cards */}
                  {[1, 2].map((index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Personality Type Section Skeleton */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>

                        {/* Communication Modality Section Skeleton */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>

                        {/* Evidence Section Skeleton */}
                        <div>
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mt-1" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-5/6" />
                              <Skeleton className="h-3 w-4/5" />
                            </div>
                          </div>

                          <div>
                            <Skeleton className="h-4 w-28 mb-2" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-5/6" />
                              <Skeleton className="h-3 w-4/5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : communicationStyles.length > 0 ? (
                <div className="space-y-6">
                  {sortedCommunicationStyles?.map((stakeholder) => {
                    const styleConfig =
                      communicationStyleConfigs[stakeholder.style];
                    const PersonalityIcon = stakeholder.personality_type
                      ? personalityTypeIcons[stakeholder.personality_type.key]
                      : null;
                    const ModalityIcon = stakeholder.modality
                      ? communicationModalityIcons[stakeholder.modality.type]
                      : null;

                    const formattedStyles =
                      stakeholder?.style?.split(",").map((s) => s.trim()) || [];

                    const matchedStyles = formattedStyles.map((style) => {
                      const match = communicationStyleTypes?.find(
                        (s) => s.key?.toLowerCase() === style.toLowerCase()
                      );
                      return {
                        style,
                        description:
                          match?.description || "No description available.",
                      };
                    });

                    return (
                      <div
                        key={stakeholder.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {/* Salesperson Checkbox - Only show for non-primary stakeholders */}
                            {!stakeholder.is_primary && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`salesperson-${stakeholder.id}`}
                                  checked={salespersonIds.has(stakeholder.id)}
                                  onChange={(e) =>
                                    handleSalespersonToggle(
                                      stakeholder.id,
                                      e.target.checked
                                    )
                                  }
                                  disabled={isUpdatingSalesperson}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label
                                  htmlFor={`salesperson-${stakeholder.id}`}
                                  className="text-xs text-muted-foreground cursor-pointer"
                                >
                                  Salesperson
                                </label>
                              </div>
                            )}

                            <h3 className="font-semibold flex items-center space-x-2">
                              {editingNameId === stakeholder.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={editNameValue}
                                    onChange={(e) =>
                                      setEditNameValue(e.target.value)
                                    }
                                    className="h-6 text-sm px-2 w-40 font-semibold"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleNameSave(stakeholder.id);
                                      if (e.key === "Escape")
                                        handleNameCancel();
                                    }}
                                    autoFocus
                                    disabled={isUpdatingName}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      handleNameSave(stakeholder.id)
                                    }
                                    disabled={isUpdatingName}
                                  >
                                    {isUpdatingName ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={handleNameCancel}
                                    disabled={isUpdatingName}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 group">
                                  <span
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => handleNameEdit(stakeholder)}
                                  >
                                    {stakeholder.stakeholder}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleNameEdit(stakeholder)}
                                  >
                                    <User className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                              {PersonalityIcon && (
                                <PersonalityIcon className="w-4 h-4 text-primary" />
                              )}
                            </h3>
                            {/* <p className="text-sm text-muted-foreground">
                              {stakeholder.role}
                            </p> */}
                            {editingRoleId === stakeholder.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editRoleValue}
                                  onChange={(e) =>
                                    setEditRoleValue(e.target.value)
                                  }
                                  className="h-6 text-xs px-2 w-32"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleRoleSave(stakeholder.id);
                                    if (e.key === "Escape") handleRoleCancel();
                                  }}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRoleSave(stakeholder.id)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={handleRoleCancel}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-accent group"
                                onClick={() => handleRoleEdit(stakeholder)}
                              >
                                {stakeholder.role || "Unknown Role"}
                                <Edit className="w-3 h-3 ml-1" />
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Primary Decision Maker Badge */}
                            {stakeholder.is_primary && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                              >
                                Primary Decision Maker
                              </Badge>
                            )}

                            {/* Salesperson Badge */}
                            {salespersonIds.has(stakeholder.id) && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                              >
                                Salesperson
                              </Badge>
                            )}

                            {/* <Badge
                              variant="outline"
                              className={cn(
                                "text-xs bg-blue-100 text-blue-800 border-blue-200",
                                styleConfig?.color
                              )}
                            >
                              <Info className="mr-1 w-3 h-3" />
                              {stakeholder.style
                                ? stakeholder.style.charAt(0).toUpperCase() +
                                  stakeholder.style.slice(1)
                                : ""}
                            </Badge> */}
                            {/* <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs bg-blue-100 text-blue-800 border-blue-200",
                                    styleConfig?.color
                                  )}
                                >
                                  <Info className="mr-1 w-3 h-3" />
                                  {formattedStyle}
                                </Badge>
                              </TooltipTrigger>
                              {styleMatch && (
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {styleMatch?.description}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip> */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs bg-blue-100 text-blue-800 border-blue-200",
                                    styleConfig?.color
                                  )}
                                >
                                  {/* {formattedStyles.join(", ")} */}
                                  {stakeholder?.style}
                                  <Info className="ml-1 w-3 h-3" />
                                </Badge>
                              </TooltipTrigger>

                              <TooltipContent
                                side="top"
                                align="center"
                                className="z-50 bg-white text-sm text-gray-800 max-w-xs p-3 rounded-md shadow-xl border border-gray-200"
                              >
                                <div className="space-y-2">
                                  {matchedStyles.map(
                                    ({ style, description }) => (
                                      <div key={style}>
                                        {/* {matchedStyles?.length > 1 && ( */}
                                        <p className="font-semibold">{style}</p>
                                        {/* )} */}
                                        <p className="text-gray-700 leading-snug">
                                          {description}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>

                            <Badge
                              variant="outline"
                              className="text-xs bg-green-100 text-green-800 border-green-200"
                            >
                              {Math.round(stakeholder.confidence * 100)}%
                              confidence
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Personality Type Section */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                              <Brain className="w-4 h-4" />
                              <span>Personality Type : </span>
                              <p className="font-medium text-sm">
                                {stakeholder.personality_type ||
                                  "Data not available"}
                              </p>
                            </h4>
                            {/* {stakeholder.personality_type ? (
                              <div>
                                <p className="font-medium text-sm mb-2">
                                  {stakeholder.personality_type}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Personality Type: Data not available
                              </p>
                            )} */}
                          </div>

                          {/* Communication Modality Section */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                              {/* {ModalityIcon && ( */}
                              <Headphones className="w-4 h-4" />
                              {/* )} */}
                              <span>Preferred Communication Modality:</span>
                              <p className="font-medium text-sm">
                                {stakeholder.style
                                  ? stakeholder.style.charAt(0).toUpperCase() +
                                    stakeholder.style.slice(1)
                                  : ""}
                              </p>
                            </h4>
                            {/* {stakeholder.style ? (
                              <div>
                                <p className="font-medium text-sm mb-2">
                                  {stakeholder.style}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {stakeholder.guidance}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Communication Modality: Data not available
                              </p>
                            )} */}
                          </div>

                          {/* Evidence Section */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Evidence
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {stakeholder.evidence}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Preferences
                              </h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stakeholder.preferences.map((pref, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2"
                                  >
                                    <span className="text-primary mt-1">•</span>
                                    <span>{pref}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Communication Tips
                              </h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stakeholder.communication_tips.map(
                                  (tip, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start space-x-2"
                                    >
                                      <span className="text-primary mt-1">
                                        •
                                      </span>
                                      <span>{tip}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No communication styles detected yet</p>
                  <p className="text-sm">
                    Communication styles will be identified as you have more
                    calls with this deal
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consolidated "How To Engage" Summary */}
          {/* {howToEngageSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Consolidated "How To Engage" Summary</span>
                  <Badge variant="default">Strategic Guide</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(howToEngageSummary).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(howToEngageSummary).map(([category, tips]) => (
                      <Collapsible key={category} defaultOpen={true}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <h4 className="font-medium text-sm">{category}</h4>
                          <ChevronRight className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-3">
                          <ul className="space-y-2">
                            {tips.map((tip, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Comprehensive Engagement Strategy: Insufficient data for a tailored summary.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )} */}

          {/* Cumulative Intelligence Section */}
        </>
      )}
    </div>
  );
};

export default CallInsights;
export { CallInsights };
