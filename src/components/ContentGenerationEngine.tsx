import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Users,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  ArrowLeft,
  Copy,
  Send,
  Loader2,
  Shield,
  Target,
  CheckCircle,
  ChevronUp,
  Edit,
  Save,
  X,
  ExternalLink,
  Star,
  Zap,
  User,
  Building,
  DollarSign,
  Calendar,
  MessageSquare,
  FileText,
  Presentation,
  Mail,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "@/hooks/userPageTimer";

interface ContentGenerationEngineProps {
  defaultArtefactType: "email" | "presentation";
  prospectId?: string;
}

interface Prospect {
  id: string;
  companyName: string;
  contact: string;
  dealValue: number;
  crmStage: string;
  nextAction: string;
  prospect_details?: any[];
  company_details?: any;
}

interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: "primary" | "stakeholder";
  confidenceScore: number;
  confidenceJustification: string;
  communicationStyle: string;
  personalityType: string;
  keyTraits: string[];
  communicationPreferences: string[];
  prospectId: string;
}

interface PresentationBlock {
  id: string;
  blockType: string;
  title: string;
  estimatedTime: number;
  content: string[];
  strategicRationale: string;
}

interface GeneratedArtefact {
  title: string;
  strategicGoal?: string;
  subject?: string;
  body?: string;
  fullPrompt?: string;
  overview?: string;
  blocks?: PresentationBlock[];
}

interface SalesPlay {
  id: string;
  title: string;
  description: string;
  recommendedFor: string[];
}

interface SecondaryObjective {
  id: string;
  label: string;
  compatibleWith: string[];
  incompatibleWith: string[];
}

interface QuickRefinement {
  id: string;
  label: string;
}

const ContentGenerationEngine: React.FC<ContentGenerationEngineProps> = ({
  defaultArtefactType = "email",
  prospectId,
}) => {
  usePageTimer(
    defaultArtefactType === "email"
      ? "Email Templates"
      : "Presentation Prompt Builder"
  );

  // Core state
  const [currentView, setCurrentView] = useState<"setup" | "canvas">("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(
    null
  );
  const [artefactType, setArtefactType] = useState<"email" | "presentation">(
    defaultArtefactType
  );
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedPlay, setSelectedPlay] = useState<string>("");
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [generatedArtefact, setGeneratedArtefact] =
    useState<GeneratedArtefact | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [quickRefinements, setQuickRefinements] = useState<QuickRefinement[]>(
    []
  );
  const [presentationView, setPresentationView] = useState<
    "modular" | "prompt"
  >("modular");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [recommendedPlay, setRecommendedPlay] = useState<string>("");
  const [recommendedObjectives, setRecommendedObjectives] = useState<string[]>(
    []
  );
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [presentationPromptId, setPresentationPromptId] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [commStylesData, setCommStylesData] = useState([]);

  // Mock data for sales plays and objectives
  const salesPlays: SalesPlay[] = [
    {
      id: "door-opener",
      title: "The Door Opener Play",
      description: "Introduce your solution and secure a follow-up meeting",
      recommendedFor: ["Discovery", "Initial Contact"],
    },
    {
      id: "objection-handling",
      title: "The Objection Handling Play",
      description: "Acknowledge and resolve prospect concerns",
      recommendedFor: ["Negotiation", "Proposal Sent"],
    },
    {
      id: "champion-enablement",
      title: "The Champion Enablement Play",
      description: "Equip your internal advocate with persuasive materials",
      recommendedFor: ["Proposal Sent", "Discovery"],
    },
    {
      id: "deal-closing",
      title: "The Deal Closing Play",
      description: "Create urgency and provide a clear path to signature",
      recommendedFor: ["Negotiation", "Proposal Sent"],
    },
  ];

  const secondaryObjectives: SecondaryObjective[] = [
    {
      id: "next-steps",
      label: "Propose next steps",
      compatibleWith: [
        "door-opener",
        "objection-handling",
        "champion-enablement",
      ],
      incompatibleWith: ["deal-closing"],
    },
    {
      id: "customer-story",
      label: "Share a customer story",
      compatibleWith: ["door-opener", "champion-enablement"],
      incompatibleWith: ["deal-closing"],
    },
    {
      id: "demonstrate-roi",
      label: "Demonstrate ROI",
      compatibleWith: [
        "objection-handling",
        "deal-closing",
        "champion-enablement",
      ],
      incompatibleWith: [],
    },
    {
      id: "address-objection",
      label: "Address a minor objection",
      compatibleWith: ["objection-handling"],
      incompatibleWith: ["door-opener", "deal-closing"],
    },
    {
      id: "build-urgency",
      label: "Build urgency",
      compatibleWith: ["deal-closing", "objection-handling"],
      incompatibleWith: ["door-opener"],
    },
    {
      id: "finalize-purchase",
      label: "Finalize purchase details",
      compatibleWith: ["deal-closing"],
      incompatibleWith: ["door-opener", "champion-enablement"],
    },
  ];

  // Load prospects from database
  useEffect(() => {
    const fetchProspects = async () => {
      if (!CURRENT_USER.id) {
        console.log("No user ID available, skipping prospect fetch");
        setIsLoadingProspects(false);
        return;
      }

      setIsLoadingProspects(true);
      try {
        const insights = await dbHelpers.getProspectData(CURRENT_USER.id);
        console.log("Fetched email insights:", insights);

        const enrichedProspects = insights.map((insight) => ({
          id: insight.id,
          companyName: insight.company?.name || "Unknown Company",
          contact:
            (insight.prospect_details || []).map((p) => p.name).join(", ") ||
            "Unknown",
          dealValue: 100000, // Default value
          crmStage: "Proposal Sent", // Default value
          nextAction: "Follow-up",
          communication_style_ids: insight.communication_style_ids || [],
          sales_play: insight?.sales_play,
          secondary_objectives: insight?.secondary_objectives,
        }));

        setProspects(enrichedProspects);

        if (enrichedProspects.length > 0) {
          const initialProspect = enrichedProspects[0];
          setSelectedProspect(initialProspect);
          const styles = await dbHelpers.getCommunicationStylesData(
            initialProspect.communication_style_ids
          );
          setCommStylesData(styles);

          const mappedStakeholders: Stakeholder[] = styles.map(
            (style, index) => ({
              id: style.id,
              name: style.stakeholder || "Unknown",
              title: style.role || "Unknown Title",
              role: style.is_primary ? "primary" : "stakeholder",
              confidenceScore: Math.round(style.confidence * 100),
              confidenceJustification:
                style.evidence || "Inferred from past interactions",
              communicationStyle: style.style || "Direct",
              personalityType: style.personality_type || "Analytical",
              keyTraits: style.preferences || [],
              communicationPreferences: style.communication_tips || [],
              prospectId: initialProspect.id,
            })
          );

          setStakeholders(mappedStakeholders);

          // Set initial recipient if email type
          if (artefactType === "email" && mappedStakeholders.length > 0) {
            setSelectedRecipients([mappedStakeholders[0].id]);
          }

          // Set recommended play and objectives
          const recommendedPlayId = getRecommendedPlay(
            initialProspect.crmStage
          );
          const recommendedObjectiveIds =
            getRecommendedObjectives(recommendedPlayId);

          setRecommendedPlay(recommendedPlayId);
          setRecommendedObjectives(recommendedObjectiveIds);
          setSelectedPlay(recommendedPlayId);
        }
      } catch (err) {
        console.error("Failed to load email insights:", err);
        toast.error("Could not fetch prospect data");
      } finally {
        setIsLoadingProspects(false);
        setIsAnalyzing(false);
      }
    };

    fetchProspects();
  }, []);

  // Recommendation logic
  const getRecommendedPlay = (crmStage: string): string => {
    const recommendedPlay = salesPlays.find((play) =>
      play.recommendedFor.includes(crmStage)
    );
    return recommendedPlay?.id || "door-opener";
  };

  const getRecommendedObjectives = (playId: string): string[] => {
    return secondaryObjectives
      .filter((obj) => obj.compatibleWith.includes(playId))
      .slice(0, 2)
      .map((obj) => obj.id);
  };

  const getAvailableObjectives = (playId: string): SecondaryObjective[] => {
    if (!playId) return secondaryObjectives;
    return secondaryObjectives.filter(
      (obj) =>
        obj.compatibleWith.includes(playId) || obj.compatibleWith.length === 0
    );
  };

  // Helper functions
  const isObjectiveDisabled = (objectiveId: string): boolean => {
    if (!selectedPlay) return false;
    const objective = secondaryObjectives.find((obj) => obj.id === objectiveId);
    return objective
      ? objective.incompatibleWith.includes(selectedPlay)
      : false;
  };

  const isObjectiveRecommended = (objectiveId: string): boolean => {
    return recommendedObjectives.includes(objectiveId);
  };

  const isGenerateButtonDisabled = () => {
    if (!selectedProspect) return true;
    if (artefactType === "email" && selectedRecipients.length === 0)
      return true;
    return false;
  };

  // Update objectives when play changes
  useEffect(() => {
    if (selectedPlay) {
      const newRecommendedObjectives = getRecommendedObjectives(selectedPlay);
      setRecommendedObjectives(newRecommendedObjectives);

      const availableObjectives = getAvailableObjectives(selectedPlay);
      const availableObjectiveIds = availableObjectives.map((obj) => obj.id);
      setSelectedObjectives((prev) =>
        prev.filter((objId) => availableObjectiveIds.includes(objId))
      );
    }
  }, [selectedPlay]);

  // Event handlers
  const handleProspectSelect = async (prospectId: string) => {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) return;

    setSelectedProspect(prospect);
    setSelectedPlay("");
    setSelectedObjectives([]);
    setGeneratedArtefact(null);
    setSelectedRecipients([]);
    setIsAnalyzing(true);

    // 🔁 Fetch communication styles
    const styles = await dbHelpers.getCommunicationStylesData(
      prospect.communication_style_ids
    );
    setCommStylesData(styles);

    const mappedStakeholders: Stakeholder[] = styles.map((style, index) => ({
      id: style.id,
      name: style.stakeholder || "Unknown",
      title: style.role || "Unknown Title",
      role: style.is_primary ? "primary" : "stakeholder",
      confidenceScore: Math.round(style.confidence * 100),
      confidenceJustification:
        style.evidence || "Inferred from past interactions",
      communicationStyle: style.style || "Direct",
      personalityType: style.personality_type || "Analytical",
      keyTraits: style.preferences || [],
      communicationPreferences: style.communication_tips || [],
      prospectId: prospect.id,
    }));

    setStakeholders(mappedStakeholders);

    // Default recipient (for emails)
    if (artefactType === "email" && mappedStakeholders.length > 0) {
      setSelectedRecipients([mappedStakeholders[0].id]);
    }

    // Recommendation logic
    setTimeout(() => {
      const recommendedPlayId = getRecommendedPlay(
        prospect.crmStage || "Discovery"
      );
      const recommendedObjectiveIds =
        getRecommendedObjectives(recommendedPlayId);

      setRecommendedPlay(recommendedPlayId);
      setRecommendedObjectives(recommendedObjectiveIds);
      setSelectedPlay(recommendedPlayId);
      setIsAnalyzing(false);
    }, 1500);
  };
  console.log(selectedProspect, "check selected prospect");
  const handleGenerate = async () => {
    if (!selectedProspect || isGenerateButtonDisabled()) return;

    setIsLoading(true);
    const getCallSummary = await dbHelpers.getCallSummaryByProspectId(
      selectedProspect?.id
    );
    const getTaskAndContent =
      await dbHelpers.getTasksAndSalesInsightsByProspectId(
        selectedProspect?.id
      );

    // Simulate API call to generate content
    setTimeout(async () => {
      if (artefactType === "presentation") {
        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/generate-propmt-v2",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              Cumulative_summary: getCallSummary,
              salesInsights: getTaskAndContent.contents || [],
              actionItems: getTaskAndContent?.tasks || [],
              salesPlay: selectedPlay,
              secondaryObjectives: selectedObjectives,
            }),
          }
        );
        const json = await response.json(); // Convert response to JSON
        const output = json?.[0]?.output;
        console.log(response, "follow up email");

        const postData = {
          blocks: output?.blocks,
          sales_play: selectedPlay,
          overview: output.overview,
          secondary_objectives: selectedObjectives,
          prospect_id: selectedProspect?.id,
          is_refined: false,
          refinement_text: "",
        };
        const storeData = await dbHelpers.upsertDeckPrompt(null, postData);
        setPresentationPromptId(storeData?.id);
        setGeneratedArtefact({
          title: `Strategic Presentation for ${selectedProspect.companyName}`,
          overview: output?.overview,
          fullPrompt: `# Strategic Presentation for ${
            selectedProspect.companyName
          }

## Overview
${output.overview}

${output?.blocks
  ?.map(
    (prompt) =>
      `### ${prompt.title}\n${prompt.content.map((x) => `- ${x}`).join("\n")}`
  )
  .join("\n\n")}
`,
          blocks: output?.blocks,
        });
        setQualityScore(output?.qualityScore);
      } else {
        // Email generation
        const recipient = stakeholders.filter((s) =>
          selectedRecipients.includes(s.id)
        );
        console.log(selectedRecipients, "selected recipients", recipient);
        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/generate-followup-email-v2",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              Cumulative_summary: getCallSummary,
              prospects: recipient?.map((x) => x.name),
              salesInsights: getTaskAndContent.contents || [],
              actionItems: getTaskAndContent?.tasks || [],
              salesPlay: selectedPlay,
              secondaryObjectives: selectedObjectives,
              communication_styles: commStylesData,
            }),
          }
        );
        const json = await response.json(); // Convert response to JSON
        const output = json?.[0]?.output;
        console.log(response, "follow up email");

        const postData = {
          subject: output?.subject || output?.Subject,
          body: output?.body || output?.Body,
          sales_play: selectedPlay,
          secondary_objectives: selectedObjectives,
          prospect_id: selectedProspect?.id,
          is_refined: false,
          refinement_text: "",
        };
        const newTemplate = await dbHelpers.upsertEmailTemplate(null, postData);
        setEmailTemplateId(newTemplate?.id);
        setGeneratedArtefact({
          title: `Follow-up Email for ${selectedProspect.companyName}`,
          strategicGoal: output?.strategicGoal,
          subject: output?.subject || output?.Subject,
          body: output?.body || output?.Body,
        });
        setQualityScore(output?.qualityScore);
      }

      setQuickRefinements([
        { id: "concise", label: "Make it more concise" },
        { id: "urgency", label: "Add more urgency" },
        { id: "technical", label: "Add more technical details" },
        { id: "roi", label: "Emphasize ROI more" },
        { id: "objections", label: "Address potential objections" },
        { id: "social-proof", label: "Add more social proof" },
        { id: "next-steps", label: "Clarify next steps" },
        { id: "personalize", label: "Make it more personalized" },
      ]);

      setIsLoading(false);
      setCurrentView("canvas");
      toast.success("Content generated successfully!");
    }, 2500);
  };

  const handleRefine = async (
    refinementPrompt: string,
    blockId: string | null = null
  ) => {
    if (!generatedArtefact) return;

    setIsRefining(true);
    setRefinementInput("");

    // Simulate API call for refinement
    setTimeout(async () => {
      if (artefactType === "presentation" && blockId) {
        // Refine specific block

        setGeneratedArtefact((prev) => {
          if (!prev || !prev.blocks) return prev;

          const updatedBlocks = prev.blocks.map((block) => {
            if (block.id === blockId) {
              return {
                ...block,
                content: [
                  ...block.content,
                  `[REFINED] ${refinementPrompt}: Additional content based on refinement...`,
                ],
              };
            }
            return block;
          });

          return {
            ...prev,
            blocks: updatedBlocks,
          };
        });
      } else if (artefactType === "presentation") {
        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/refine-presentation-prompt",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              current_prompt_content: {
                overview: generatedArtefact?.overview,
                blocks: generatedArtefact?.blocks,
              },
              refinement_prompt: refinementPrompt,
            }),
          }
        );
        const json = await response.json(); // Convert response to JSON
        const output = json?.[0]?.output;
        const postData = {
          blocks: output?.blocks,
          sales_play: selectedPlay,
          overview: output.overview,
          secondary_objectives: selectedObjectives,
          prospect_id: selectedProspect?.id,
          is_refined: true,
          refinement_text: refinementPrompt,
        };
        const storeData = await dbHelpers.upsertDeckPrompt(
          presentationPromptId,
          postData
        );
        // Refine entire presentation
        setGeneratedArtefact((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            fullPrompt: `${prev.fullPrompt}\n\n[REFINED] ${refinementPrompt}: Additional content based on refinement...`,
          };
        });
      } else {
        // Refine email

        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/refine-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              current_email_content: generatedArtefact?.body,
              email_subject: generatedArtefact?.subject,
              refinement_prompt: refinementPrompt,
            }),
          }
        );
        const json = await response.json();
        // console.log(json, "check json data");
        const output = json?.[0];
        // console.log(output, "follow up email");
        const postData = {
          subject: output?.refined_email_subject,
          body: output?.refined_email_content,
          sales_play: selectedPlay,
          secondary_objectives: selectedObjectives,
          prospect_id: selectedProspect?.id,
          is_refined: true,
          refinement_text: refinementPrompt,
        };
        const newTemplate = await dbHelpers.upsertEmailTemplate(
          emailTemplateId,
          postData
        );

        setGeneratedArtefact((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            subject: output?.refined_email_subject,
            body: output?.refined_email_content,
          };
        });
      }

      //   setQualityScore((prev) => Math.min(100, prev + 3));
      setIsRefining(false);
      toast.success(`Refinement applied: ${refinementPrompt}`);
    }, 1500);
  };
  console.log(selectedProspect, "selected prospect");
  const handleCopy = () => {
    if (!generatedArtefact) return;

    let textToCopy = "";

    if (artefactType === "email") {
      textToCopy = `Subject: ${generatedArtefact.subject}\n\n${generatedArtefact.body}`;
    } else {
      textToCopy = generatedArtefact.fullPrompt || "";
    }

    navigator.clipboard.writeText(textToCopy);
    toast.success("Content copied to clipboard");
  };

  const handleExport = () => {
    if (!generatedArtefact) return;

    if (artefactType === "email") {
      toast.success("Email exported to Outlook");
    } else {
      toast.success("Presentation exported to Gamma");
    }
  };

  const handleEditBlock = (blockId: string) => {
    if (!generatedArtefact || !generatedArtefact.blocks) return;

    const block = generatedArtefact.blocks.find((b) => b.id === blockId);
    if (!block) return;

    setEditingBlockId(blockId);
    setEditingContent(block.content.join("\n\n"));
  };

  const handleSaveBlock = async () => {
    if (!editingBlockId || !generatedArtefact || !generatedArtefact.blocks)
      return;

    const contentLines = editingContent
      .split("\n\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // Step 1: Prepare updated blocks
    const updatedBlocks = generatedArtefact.blocks.map((block) => {
      if (block.id === editingBlockId) {
        return {
          ...block,
          content: contentLines,
        };
      }
      return block;
    });

    // Step 2: Generate fullPrompt string
    const fullPrompt = `# Strategic Presentation for ${
      selectedProspect?.companyName
    }

## Overview
${generatedArtefact.overview}

${updatedBlocks
  .map(
    (prompt) =>
      `### ${prompt.title}\n${prompt.content.map((x) => `- ${x}`).join("\n")}`
  )
  .join("\n\n")}
`;

    // Step 3: Update local state
    setGeneratedArtefact((prev) => ({
      ...prev,
      blocks: updatedBlocks,
      fullPrompt,
    }));

    // Step 4: Prepare data for backend
    const postData = {
      blocks: updatedBlocks,
    };

    try {
      await dbHelpers?.upsertDeckPrompt(presentationPromptId, postData);
      toast.success("Block updated successfully");
    } catch (error) {
      console.error("Error saving block:", error);
      toast.error("Failed to save block.");
    }

    // Step 5: Reset editing state
    setEditingBlockId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditingContent("");
  };

  const handleBackToSetup = () => {
    setCurrentView("setup");
  };

  const handleArtefactTypeChange = (type: "email" | "presentation") => {
    setArtefactType(type);
    setGeneratedArtefact(null);

    // Reset recipients if switching to email
    if (type === "email" && stakeholders.length > 0) {
      setSelectedRecipients([stakeholders[0].id]);
    }
  };

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipientId)) {
        return prev.filter((id) => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  // Derived data
  const primaryStakeholder = stakeholders.find((s) => s.role === "primary");
  const secondaryStakeholders = stakeholders.filter(
    (s) => s.role !== "primary"
  );
  const availableObjectives = selectedPlay
    ? getAvailableObjectives(selectedPlay)
    : secondaryObjectives;

  const getPlayById = (playId: string) =>
    salesPlays.find((play) => play.id === playId);
  const selectedPlayData = getPlayById(selectedPlay);

  const getObjectiveById = (objectiveId: string) =>
    secondaryObjectives.find((obj) => obj.id === objectiveId);
  const selectedObjectivesData = selectedObjectives
    .map(getObjectiveById)
    .filter(Boolean);

  // Render the appropriate view
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {artefactType === "email"
            ? "AI-Powered Email"
            : "Strategic Presentation Canvas"}
        </h1>
        <p className="text-muted-foreground">
          {artefactType === "email"
            ? "Create personalized, strategic emails that resonate with your prospects and drive engagement."
            : "Generate compelling presentation frameworks tailored to your prospect's needs and communication style."}
        </p>
      </div>

      {currentView === "setup" ? (
        // SETUP VIEW
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Column 1: Prospect Context & Intelligence (40% width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prospect Switcher */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Prospect Context</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProspects ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedProspect?.id}
                    onValueChange={handleProspectSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a prospect" />
                    </SelectTrigger>
                    <SelectContent>
                      {prospects.map((prospect) => (
                        <SelectItem key={prospect.id} value={prospect.id}>
                          {prospect.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Deal Information */}
            {selectedProspect && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Deal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAnalyzing ? (
                    <>
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-5/6" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Deal Value:
                        </span>
                        <span className="font-medium">
                          <DollarSign className="inline-block w-4 h-4 mr-1" />
                          {selectedProspect.dealValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          CRM Stage:
                        </span>
                        <Badge variant="outline">
                          {selectedProspect.crmStage}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Next Action:
                        </span>
                        <span className="text-sm">
                          {selectedProspect.nextAction}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Personalization Insights & Key Stakeholders */}
            {selectedProspect && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Personalization Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAnalyzing ? (
                    <>
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </>
                  ) : (
                    <>
                      {/* Primary Decision Maker Card */}
                      {primaryStakeholder && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Crown className="w-4 h-4 text-primary" />
                                <CardTitle className="text-base">
                                  {primaryStakeholder.name}
                                </CardTitle>
                              </div>
                              <Badge>Primary Decision Maker</Badge>
                            </div>
                            <CardDescription>
                              {primaryStakeholder.title}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Confidence:
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 border-green-200"
                                  >
                                    {primaryStakeholder.confidenceScore}%
                                    <Info className="ml-1 w-3 h-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {primaryStakeholder.confidenceJustification}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground">
                                  Communication Style:
                                </span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm font-medium flex items-center">
                                      {primaryStakeholder.communicationStyle}
                                      <Info className="ml-1 w-3 h-3 text-muted-foreground" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      Based on language patterns and interaction
                                      style from previous communications.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Personality Type:
                                </span>
                                <span className="text-sm font-medium">
                                  {primaryStakeholder.personalityType}
                                </span>
                              </div>
                            </div>

                            <Collapsible className="border-t border-primary/10 pt-2">
                              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                                Key Traits
                                <ChevronDown className="w-4 h-4" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <div className="flex flex-wrap gap-1">
                                  {primaryStakeholder.keyTraits.map(
                                    (trait, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {trait}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            <Collapsible className="border-t border-primary/10 pt-2">
                              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                                Communication Preferences
                                <ChevronDown className="w-4 h-4" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <ul className="text-sm space-y-1 list-disc pl-4">
                                  {primaryStakeholder.communicationPreferences.map(
                                    (pref, i) => (
                                      <li key={i}>{pref}</li>
                                    )
                                  )}
                                </ul>
                              </CollapsibleContent>
                            </Collapsible>
                          </CardContent>
                        </Card>
                      )}

                      {/* Secondary Stakeholders */}
                      {secondaryStakeholders.map((stakeholder) => (
                        <Card key={stakeholder.id} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <CardTitle className="text-base">
                                  {stakeholder.name}
                                </CardTitle>
                              </div>
                              <Badge variant="outline">Stakeholder</Badge>
                            </div>
                            <CardDescription>
                              {stakeholder.title}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Confidence:
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-800 border-blue-200"
                                  >
                                    {stakeholder.confidenceScore}%
                                    <Info className="ml-1 w-3 h-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {stakeholder.confidenceJustification}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground">
                                  Communication Style:
                                </span>
                                <span className="text-sm font-medium">
                                  {stakeholder.communicationStyle}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Personality Type:
                                </span>
                                <span className="text-sm font-medium">
                                  {stakeholder.personalityType}
                                </span>
                              </div>
                            </div>

                            <Collapsible className="border-t border-border pt-2">
                              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                                Key Traits
                                <ChevronDown className="w-4 h-4" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <div className="flex flex-wrap gap-1">
                                  {stakeholder.keyTraits.map((trait, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {trait}
                                    </Badge>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Column 2: Strategic Setup (60% width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Asset Format Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Asset Format</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={artefactType}
                  onValueChange={(value) =>
                    handleArtefactTypeChange(value as "email" | "presentation")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="email"
                      className="flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="presentation"
                      className="flex items-center space-x-2"
                    >
                      <Presentation className="w-4 h-4" />
                      <span>Presentation</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Email Recipients Selector (Conditional) */}
            {artefactType === "email" && selectedProspect && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Email Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <>
                      <Skeleton className="h-8 w-full mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </>
                  ) : (
                    <div className="space-y-3">
                      {stakeholders.length === 0 ? (
                        <div className="text-center py-3 text-muted-foreground">
                          No stakeholders available for this prospect
                        </div>
                      ) : (
                        stakeholders.map((stakeholder) => (
                          <div
                            key={stakeholder.id}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`recipient-${stakeholder.id}`}
                              checked={selectedRecipients.includes(
                                stakeholder.id
                              )}
                              onCheckedChange={() =>
                                handleRecipientToggle(stakeholder.id)
                              }
                            />
                            <Label
                              htmlFor={`recipient-${stakeholder.id}`}
                              className="flex-1 flex items-center justify-between"
                            >
                              <span>{stakeholder.name}</span>
                              <Badge
                                variant={
                                  stakeholder.role === "primary"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {stakeholder.role === "primary"
                                  ? "Primary"
                                  : "Stakeholder"}
                              </Badge>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sales Play Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sales Play</CardTitle>
                <CardDescription>
                  Select the strategic approach that best fits your current
                  situation with this prospect
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <>
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <div className="space-y-3">
                    {salesPlays.map((play) => (
                      <div
                        key={play.id}
                        className={cn(
                          "flex items-start space-x-3 p-4 rounded-md border cursor-pointer transition-colors",
                          selectedPlay === play.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                        )}
                        onClick={() => setSelectedPlay(play.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{play.title}</h4>
                            {play.id === recommendedPlay && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Recommended
                                    <Info className="ml-1 w-3 h-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Recommended based on the current CRM stage (
                                    {selectedProspect.crmStage}) and previous
                                    interactions with{" "}
                                    {selectedProspect.companyName}.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {play.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secondary Objectives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Secondary Objectives</CardTitle>
                <CardDescription>
                  Select additional objectives to enhance your primary sales
                  play
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableObjectives.map((objective) => {
                      const isDisabled = isObjectiveDisabled(objective.id);
                      const isRecommended = isObjectiveRecommended(
                        objective.id
                      );

                      return (
                        <div
                          key={objective.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-md border",
                            isDisabled
                              ? "opacity-50 cursor-not-allowed border-border"
                              : "cursor-pointer border-border hover:border-primary/50"
                          )}
                        >
                          <Checkbox
                            id={`objective-${objective.id}`}
                            checked={selectedObjectives.includes(objective.id)}
                            onCheckedChange={() => {
                              if (!isDisabled) {
                                setSelectedObjectives((prev) =>
                                  prev.includes(objective.id)
                                    ? prev.filter((id) => id !== objective.id)
                                    : [...prev, objective.id]
                                );
                              }
                            }}
                            disabled={isDisabled}
                          />
                          <Label
                            htmlFor={`objective-${objective.id}`}
                            className={cn(
                              "flex-1 flex items-center justify-between cursor-pointer",
                              isDisabled && "cursor-not-allowed"
                            )}
                          >
                            <span>{objective.label}</span>
                            {isRecommended && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-800 border-blue-200"
                                  >
                                    Recommended
                                    <Info className="ml-1 w-3 h-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    This objective works well with the{" "}
                                    {selectedPlayData?.title} play.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerateButtonDisabled() || isLoading || isAnalyzing}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate{" "}
                  {artefactType === "email"
                    ? `Email for ${selectedRecipients.length} Recipient${
                        selectedRecipients.length !== 1 ? "s" : ""
                      }`
                    : "Presentation Framework"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // CANVAS VIEW
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Canvas (75% width) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBackToSetup}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Setup
              </Button>

              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>

                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  <Star className="w-3 h-3 mr-1" />
                  Quality: {qualityScore}/100
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xl">
                  {generatedArtefact?.title ||
                    `${
                      artefactType === "email" ? "Email" : "Presentation"
                    } for ${selectedProspect?.companyName}`}
                </CardTitle>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>

                  <Button size="sm" onClick={handleExport}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Export to {artefactType === "email" ? "Outlook" : "Gamma"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {artefactType === "email" ? (
                  <div className="space-y-4">
                    {generatedArtefact?.strategicGoal && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <Target className="w-4 h-4 text-blue-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">
                              Strategic Goal
                            </h4>
                            <p className="text-sm text-blue-700">
                              {generatedArtefact.strategicGoal}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="email-subject"
                          className="text-sm font-medium"
                        >
                          Subject
                        </Label>
                        <Input
                          id="email-subject"
                          value={generatedArtefact?.subject || ""}
                          onChange={(e) =>
                            setGeneratedArtefact((prev) =>
                              prev ? { ...prev, subject: e.target.value } : prev
                            )
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="email-body"
                          className="text-sm font-medium"
                        >
                          Body
                        </Label>
                        <Textarea
                          id="email-body"
                          value={generatedArtefact?.body || ""}
                          onChange={(e) =>
                            setGeneratedArtefact((prev) =>
                              prev ? { ...prev, body: e.target.value } : prev
                            )
                          }
                          className="mt-1 min-h-[300px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Tabs
                    value={presentationView}
                    onValueChange={(v) =>
                      setPresentationView(v as "modular" | "prompt")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="modular"
                        className="flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Modular Blocks</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="prompt"
                        className="flex items-center space-x-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Full Prompt</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="modular" className="mt-4 space-y-4">
                      {generatedArtefact?.blocks?.map((block, index) => (
                        <Card
                          key={block.id}
                          className={cn(
                            "border",
                            editingBlockId === block.id
                              ? "border-primary"
                              : "border-border"
                          )}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <div>
                              <CardTitle className="text-base flex items-center space-x-2">
                                <span>
                                  {index + 1}. {block.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {block.blockType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {block.estimatedTime} min
                                </Badge>
                              </CardTitle>
                            </div>

                            <div className="flex items-center space-x-1">
                              {editingBlockId === block.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveBlock}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditBlock(block.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent>
                            {editingBlockId === block.id ? (
                              <Textarea
                                value={editingContent}
                                onChange={(e) =>
                                  setEditingContent(e.target.value)
                                }
                                className="min-h-[200px] font-mono text-sm"
                              />
                            ) : (
                              <div className="space-y-4">
                                <ul className="space-y-2 list-disc pl-5">
                                  {block.content.map((item, i) => (
                                    <li key={i} className="text-sm">
                                      {item}
                                    </li>
                                  ))}
                                </ul>

                                <div className="bg-muted p-3 rounded-md mt-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">
                                      Strategic Rationale
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {block.strategicRationale}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="prompt" className="mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
                            {generatedArtefact?.fullPrompt ||
                              "No content generated yet."}
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sticky Sidebar (25% width) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Refinements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  {quickRefinements.map((refinement) => (
                    <Button
                      key={refinement.id}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      disabled={isRefining}
                      onClick={() => handleRefine(refinement.label)}
                    >
                      <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-xs">{refinement.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerationEngine;
