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
  Headphones,
  Info,
  ChevronLeft,
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
  const { cummulativeSpinner } = useSelector((state) => state.prospect);
  const [cummulativeSummary, setCummulativeSummary] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const { communicationStyleTypes } = useSelector((state) => state.org);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const CARDS_PER_VIEW = 4;
  const maxIndex = Math.max(0, filteredProspects.length - CARDS_PER_VIEW);

  // Reset carousel when prospects change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredProspects.length]);

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  console.log(communicationStyles, "communication styles data");
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
        // console.log(insights, "get insights data");

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
            communication_style_ids: defaultInsight?.communication_style_ids,
          };

          // console.log(
          //   prospect,
          //   "selected prospect",
          //   defaultInsight,
          //   "get default insight"
          // );
          setCummulativeSummary(defaultInsight?.call_summary);
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
  //   setC