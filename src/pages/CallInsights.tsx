import React, { useState, useEffect } from "react";
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
  ChevronDown,
  Search,
  Filter,
  Ear,
  Hand,
  Brain,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import { useSelector } from "react-redux";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

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
  const { storedProspectId } = useSelector((state) => state.prospect);

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
  console.log(insightTypes, "insight types");
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
        // console.log(insights, "get insights data");

        // Sort insights by created_at descending
        insights = insights.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        const enrichedInsights = await Promise.all(
          insights.map(async (insight) => {
            const people = await dbHelpers.getPeopleByProspectId(insight.id);
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
        // console.log(defaultInsight, "check default insights");
        if (!defaultInsight && insights?.length > 0) {
          defaultInsight = insights[0]; // most recent
        }

        if (defaultInsight) {
          const companyName =
            defaultInsight?.company?.name || "Unknown Company";

          const people = await dbHelpers.getPeopleByProspectId(
            defaultInsight.id
          );
          console.log(defaultInsight, "check default insight");
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
            dealValue: "TBD",
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
          };

          // console.log(
          //   prospect,
          //   "selected prospect",
          //   defaultInsight,
          //   "get default insight"
          // );
          setSelectedProspect(prospect);
          loadProspectInsights(defaultInsight);
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
    const data = await dbHelpers.getCommunicationStylesData(styleIds);

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
    const groupedInsights = await dbHelpers.getSalesInsightsByProspectId(
      insightData.id
    );
    setInsights(groupedInsights); // You may need to map this to your display structure

    const styles = await fetchCommunicationStyles(
      insightData.communication_style_ids
    );
    setCommunicationStyles(styles);

    const peopleList = await dbHelpers.getPeopleByProspectId(insightData.id);
    setPeople(peopleList);
  };
  // console.log(people, "get people list");

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    loadProspectInsights(prospect.fullInsight);
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
        selectedProspect.id
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

  const handleEditInsight = (insightId) => {
    const insight = insights.find((i) => i.id === insightId);
    setEditingId(insightId);
    setEditContent(insight.content);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedList = insights?.map((insight) =>
        insight.id === editingId
          ? { ...insight, content: editContent }
          : insight
      );

      const payload = {
        sales_insights: updatedList,
      };

      const updated = await dbHelpers.updateCallInsight(
        selectedProspect.id,
        payload
      );
      setInsights(updated.sales_insights);

      setEditingId(null);
      setEditContent("");
      updateAllInsightsEntry(updated);
      toast.success("Insight updated");
    } catch (error) {
      toast.error("Failed to update insight");
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

  const handleDeleteInsight = async (insightId) => {
    try {
      const filtered = insights.filter((i) => i.id !== insightId);

      const payload = {
        sales_insights: filtered,
      };

      const updated = await dbHelpers.updateCallInsight(
        selectedProspect.id,
        payload
      );
      setInsights(updated.sales_insights);
      updateAllInsightsEntry(updated);
      toast.success("Insight removed");
    } catch (error) {
      toast.error("Failed to delete insight");
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
        content.trim()
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
      const updated = await dbHelpers.deleteSalesInsightContent(insightId, {
        is_active: false,
      });

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

  // console.log(allInsights, "check all insights");
  const filteredProspects = allInsights?.filter(
    (prospect) =>
      prospect?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
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

      {/* Prospect Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Prospect Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search prospects by company or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Prospect List */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
              {filteredProspects.map((prospect) => {
                // console.log(prospect, "get prospect details");
                const companyName = prospect.company?.name || "Unknown Company";
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
                      "min-w-[300px] max-w-[300px] snap-start shrink-0 border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                      selectedProspect?.id === prospect.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() =>
                      handleProspectSelect({
                        id: prospect.id,
                        name,
                        companyName,
                        company_id: prospect?.company_id,
                        prospectNames,
                        titles,
                        totalCalls,
                        lastCallDate: prospect.created_at,
                        lastEngagement,
                        status,
                        dealValue,
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
                        people: prospect.people, // ✅ add this
                        call_summary: prospect?.call_summary,
                      })
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{companyName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {prospectNames}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusColor(status))}
                      >
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calls:</span>
                        <span className="font-medium">{totalCalls}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Deal Value:
                        </span>
                        <span className="font-medium">{dealValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Last Enagement:
                        </span>
                        <span className="font-medium">{lastEngagement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Opportunity:
                        </span>
                        <span className="font-medium">{prospect?.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

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

          {/* Sales Insights Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Sales Insights</span>
                  <Badge variant="secondary">{insights?.length} insights</Badge>
                </div>
                <Button
                  onClick={() => setIsAddingInsight(true)}
                  disabled={isAddingInsight}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Insight
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Insight */}
              {console.log(newInsight, "newInsight type")}
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
                    placeholder="Enter your insight about this prospect..."
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
                      className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", typeConfig?.color)}
                              >
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeConfig?.label || ""}
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
                          )}
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
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded shadow-lg p-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max max-w-xs z-10 pointer-events-none">
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
                                    {/* Arrow pointer */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background border-b border-r rotate-45"></div>
                                  </div>

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

              {insights?.length === 0 && !isAddingInsight && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No insights available yet</p>
                  <p className="text-sm mb-4">
                    Add your first insight about this prospect
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Prospect Behavioral & Communication Insights</span>
                <Badge variant="secondary">
                  {communicationStyles.length} stakeholders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {communicationStyles.length > 0 ? (
                <div className="space-y-6">
                  {communicationStyles.map((stakeholder) => {
                    const styleConfig =
                      communicationStyleConfigs[stakeholder.style];
                    const PersonalityIcon = stakeholder.personality_type
                      ? personalityTypeIcons[stakeholder.personality_type.key]
                      : null;
                    const ModalityIcon = stakeholder.modality
                      ? communicationModalityIcons[stakeholder.modality.type]
                      : null;

                    return (
                      <div
                        key={stakeholder.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold flex items-center space-x-2">
                              <span>{stakeholder.stakeholder}</span>
                              {PersonalityIcon && (
                                <PersonalityIcon className="w-4 h-4 text-primary" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {stakeholder.role}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={cn("text-xs", styleConfig?.color)}
                            >
                              {stakeholder.style}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
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
                              <span>Personality Type</span>
                            </h4>
                            {stakeholder.personality_type ? (
                              <div>
                                <p className="font-medium text-sm mb-2">
                                  {stakeholder.personality_type}
                                </p>
                                {/* <ul className="text-sm text-muted-foreground space-y-1">
                                  {stakeholder.personality_type.traits.map(
                                    (trait, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start space-x-2"
                                      >
                                        <span className="text-primary mt-1">
                                          •
                                        </span>
                                        <span>{trait}</span>
                                      </li>
                                    )
                                  )}
                                </ul> */}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Personality Type: Data not available
                              </p>
                            )}
                          </div>

                          {/* Communication Modality Section */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                              {ModalityIcon && (
                                <ModalityIcon className="w-4 h-4" />
                              )}
                              <span>Preferred Communication Modality</span>
                            </h4>
                            {stakeholder.style ? (
                              <div>
                                <p className="font-medium text-sm mb-2">
                                  {stakeholder.style}
                                </p>
                                {/* <p className="text-sm text-muted-foreground">
                                  {stakeholder.guidance}
                                </p> */}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Communication Modality: Data not available
                              </p>
                            )}
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
                    calls with this prospect
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Cumulative Intelligence</span>
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
                    {selectedProspect?.calls || 0}
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
                  <span className="text-sm">HubSpot Data:</span>
                  <Badge
                    variant={
                      selectedProspect.dataSources.hubspot > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedProspect.dataSources.hubspot}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText
                    className={cn(
                      "w-4 h-4",
                      researchCompanyCount > 0
                        ? "text-purple-600"
                        : "text-gray-400"
                    )}
                  />
                  <span className="text-sm">Research:</span>
                  <Badge
                    variant={researchCompanyCount > 0 ? "default" : "secondary"}
                  >
                    {researchCompanyCount}
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
                  <span className="text-sm">Internal datas:</span>
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

              <p className="text-sm text-muted-foreground">
                {selectedProspect?.call_summary || ""}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CallInsights;
export { CallInsights };
