import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Presentation,
  Target,
  Brain,
  Lightbulb,
  MessageSquare,
  Settings,
  Sparkles,
  Copy,
  Send,
  RefreshCw,
  Plus,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Eye,
  Star,
  Clock,
  BarChart3,
  Shield,
  Rocket,
  Building,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";

// Sales methodologies
const salesMethodologies = {
  sandler: {
    name: "Sandler Selling System",
    description: "Pain-focused methodology with upfront contracts",
    stages: [
      "Bonding & Rapport",
      "Up-Front Contract",
      "Pain",
      "Budget",
      "Decision",
      "Fulfillment",
      "Post-Sell",
    ],
  },
  spin: {
    name: "SPIN Selling",
    description:
      "Question-based approach focusing on situation, problem, implication, need-payoff",
    stages: [
      "Situation Questions",
      "Problem Questions",
      "Implication Questions",
      "Need-Payoff Questions",
    ],
  },
  meddic: {
    name: "MEDDIC",
    description: "Qualification methodology for complex B2B sales",
    stages: [
      "Metrics",
      "Economic Buyer",
      "Decision Criteria",
      "Decision Process",
      "Identify Pain",
      "Champion",
    ],
  },
  custom: {
    name: "Custom Playbook",
    description: "Your company-specific sales methodology",
    stages: ["Discovery", "Qualification", "Proposal", "Negotiation", "Close"],
  },
};

// Presentation objectives
const presentationObjectives = [
  { value: "educate", label: "Educate on Solution", icon: Brain },
  { value: "address_objections", label: "Address Objections", icon: Shield },
  { value: "propose_next_steps", label: "Propose Next Steps", icon: Rocket },
  { value: "close_deal", label: "Close Deal", icon: Target },
  { value: "build_urgency", label: "Build Urgency", icon: Clock },
  { value: "demonstrate_roi", label: "Demonstrate ROI", icon: TrendingUp },
];

// Mock company content library based on prospect
const getContentLibrary = (prospectId) => {
  const baseContent = [
    {
      id: "1",
      title: "ROI Calculator Template",
      type: "template",
      lastUsed: "2024-01-10",
    },
    {
      id: "2",
      title: "Customer Success Stories",
      type: "case_study",
      lastUsed: "2024-01-08",
    },
    {
      id: "3",
      title: "Technical Integration Guide",
      type: "technical",
      lastUsed: "2024-01-05",
    },
    {
      id: "4",
      title: "Competitive Comparison",
      type: "competitive",
      lastUsed: "2024-01-03",
    },
  ];

  // Add prospect-specific content
  const prospectSpecific = {
    acme_corp: [
      {
        id: "5",
        title: "Sales Team Scaling Playbook",
        type: "playbook",
        lastUsed: "2024-01-12",
      },
      {
        id: "6",
        title: "HubSpot Integration Demo",
        type: "demo",
        lastUsed: "2024-01-11",
      },
    ],
    techstart_inc: [
      {
        id: "7",
        title: "Startup Growth Framework",
        type: "framework",
        lastUsed: "2024-01-09",
      },
      {
        id: "8",
        title: "API Documentation",
        type: "technical",
        lastUsed: "2024-01-07",
      },
    ],
    global_solutions: [
      {
        id: "9",
        title: "Enterprise Security Overview",
        type: "security",
        lastUsed: "2024-01-06",
      },
      {
        id: "10",
        title: "Process Optimization Guide",
        type: "process",
        lastUsed: "2024-01-04",
      },
    ],
  };

  return [...baseContent, ...(prospectSpecific[prospectId] || [])];
};

// Quick refinement prompts
const quickPrompts = [
  "Make it more executive-focused",
  "Add more technical details",
  "Include specific ROI metrics",
  "Address competitive concerns",
  "Emphasize urgency and timeline",
  "Focus on implementation ease",
  "Add social proof and testimonials",
  "Strengthen the call-to-action",
];

export function DeckBuilder() {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [selectedMethodology, setSelectedMethodology] = useState("spin");
  const [selectedObjective, setSelectedObjective] = useState("educate");
  const [selectedContent, setSelectedContent] = useState([]);
  const [contentLibrary, setContentLibrary] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptBlocks, setPromptBlocks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editText, setEditText] = useState("");
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  useEffect(() => {
    const fetchProspects = async () => {
      if (!userId) {
        console.log("No user ID available, skipping prospect fetch");
        setIsLoadingProspects(false);
        return;
      }

      setIsLoadingProspects(true);
      try {
        const insights = await dbHelpers.getEmailProspectInsights(userId);

        const enrichedProspects = insights.map((insight) => ({
          id: insight.id,
          companyName: insight.company_details?.name || "Unknown Company",
          prospectName:
            (insight.prospect_details || []).map((p) => p.name).join(", ") ||
            "Unknown",
          title:
            (insight.prospect_details || []).map((p) => p.title).join(", ") ||
            "Unknown",
          prospect_details: insight.prospect_details || [],
          status: "new",
          dealValue: "TBD",
          probability: 50,
          nextAction: "Initial follow-up",
          created_at: insight.created_at,
          sales_insights: insight.sales_insights || [],
          communication_styles: insight.communication_styles || [],
          fullInsight: insight,
          call_summary: insight.call_summary,
          extracted_transcript: insight.extracted_transcript,
          email_template_id: insight.email_template_id || null,
          presentation_prompt_id: insight.presentation_prompt_id || null,
          action_items: insight.action_items || [],
        }));

        setProspects(enrichedProspects);
        if (enrichedProspects.length > 0) {
          setSelectedProspect(enrichedProspects[0]);
        }
      } catch (error) {
        console.error("Failed to load prospects:", error);
        toast.error("Could not fetch call insights");
      } finally {
        setIsLoadingProspects(false);
      }
    };

    fetchProspects();
  }, [userId]);

  useEffect(() => {
    if (selectedProspect !== null && selectedProspect.presentation_prompt_id) {
      const fetchPresentationPrompt = async () => {
        if (selectedProspect?.presentation_prompt_id) {
          const promptData = await dbHelpers.getPresentationPromptById(
            selectedProspect.presentation_prompt_id
          );
          console.log("Fetched prompt data:", promptData);
          console.log(promptData?.body, "prompt body");
          if (promptData?.body) {
            setGeneratedPrompt(promptData.body);

            const lines = promptData.body.split("\n");
            const blocks = [];
            let currentBlock = {
              id: 0,
              title: "",
              content: "",
              type: "overview",
            };

            for (let line of lines) {
              if (line.startsWith("### ")) {
                if (currentBlock.content.trim()) {
                  blocks.push({ ...currentBlock });
                }
                currentBlock = {
                  id: blocks.length,
                  title: line.replace("### ", "").trim(),
                  content: line,
                  type: "slide",
                };
              } else {
                currentBlock.content += `\n${line}`;
              }
            }

            if (currentBlock.content.trim()) {
              blocks.push({ ...currentBlock });
            }

            setPromptBlocks(blocks);
            setQualityScore(90);
          }
        }
      };

      fetchPresentationPrompt();
    }
  }, [selectedProspect]);

  useEffect(() => {
    if (location.state?.selectedCall && prospects.length > 0) {
      const call = location.state.selectedCall;
      const match = prospects.find((p) => p.companyName === call.companyName);
      if (match) setSelectedProspect(match);
    }
  }, [location.state, prospects]);

  // Update content library when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const library = getContentLibrary(selectedProspect.id);
      setContentLibrary(library);
      setSelectedContent([]); // Reset selected content
      setGeneratedPrompt(""); // Clear previous prompt
      setPromptBlocks([]);
      setChatMessages([]);
      setQualityScore(0);
      toast.success(
        `Loaded content library for ${selectedProspect.companyName}`
      );
    }
  }, [selectedProspect]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  // Generate initial prompt when setup is complete
  const handleGeneratePrompt = async () => {
    if (!selectedProspect?.extracted_transcript) {
      toast.error("Missing transcript for this prospect");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate prompt using API
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/generate-propmt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: selectedProspect.extracted_transcript,
            sales_methodology: selectedMethodology,
            sales_insights: selectedProspect.sales_insights || [],
            presentation_objective: selectedObjective,
            action_items: selectedProspect.action_items || [],
          }),
        }
      );

      const result = await response.json();
      const rawPrompt = result?.[0]?.output;

      if (!rawPrompt) throw new Error("Empty response from AI");

      setGeneratedPrompt(rawPrompt);

      // 2. Convert full prompt into modular blocks
      const lines = rawPrompt.split("\n");
      const blocks = [];
      let currentBlock = {
        id: 0,
        title: "Presentation Overview",
        content: "",
        type: "overview",
      };

      for (let line of lines) {
        if (line.startsWith("### ")) {
          if (currentBlock.content.trim()) {
            blocks.push({ ...currentBlock });
          }

          currentBlock = {
            id: blocks.length,
            title: line.replace("### ", "").trim(),
            content: line,
            type: "slide",
          };
        } else {
          currentBlock.content += `\n${line}`;
        }
      }

      if (currentBlock.content.trim()) {
        blocks.push({ ...currentBlock });
      }

      setPromptBlocks(blocks);
      setQualityScore(90);

      // 3. Save prompt to Supabase and get ID
      const savedPrompt = await dbHelpers.savePresentationPrompt({
        body: rawPrompt,
        prospectId: selectedProspect.id,
      });

      // 4. Update call_insights with presentation_prompt_id
      await dbHelpers.updateCallInsightsPresentationId({
        insightId: selectedProspect.id,
        presentationId: savedPrompt.id,
      });

      // 5. Update local state with saved prompt ID
      setSelectedProspect((prev) => ({
        ...prev,
        presentation_prompt_id: savedPrompt.id,
      }));

      toast.success(
        `Prompt generated and saved for ${selectedProspect.companyName}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate and save prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentToggle = (contentId) => {
    setSelectedContent((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleSendPrompt = async (prompt) => {
    if (!prompt.trim()) return;
    await handleRefinePromptViaAPI(prompt.trim());
  };

  const handleBlockEdit = (blockId) => {
    const block = promptBlocks.find((b) => b.id === blockId);
    setEditingBlock(blockId);
    setEditText(block.content);
  };

  const handleSaveBlock = async () => {
    const updatedBlocks = promptBlocks.map((block) =>
      block.id === editingBlock ? { ...block, content: editText } : block
    );

    setPromptBlocks(updatedBlocks);

    const updatedPrompt = updatedBlocks
      .map((block) => block.content)
      .join("\n\n");

    setGeneratedPrompt(updatedPrompt);
    setEditingBlock(null);
    setEditText("");

    // Update Supabase prompt body if presentation_prompt_id exists
    if (selectedProspect?.presentation_prompt_id) {
      try {
        await dbHelpers.updatePresentationPrompt({
          id: selectedProspect.presentation_prompt_id,
          block: updatedPrompt,
        });

        toast.success("Block and presentation prompt updated successfully");
      } catch (err) {
        console.error("Failed to update presentation prompt", err);
        toast.error("Failed to update prompt in Supabase");
      }
    } else {
      toast.success("Block updated locally");
    }
  };

  const handleMoveBlock = (blockId, direction) => {
    const currentIndex = promptBlocks.findIndex(
      (block) => block.id === blockId
    );
    if (
      (direction === "up" && currentIndex > 1) ||
      (direction === "down" && currentIndex < promptBlocks.length - 1)
    ) {
      const newBlocks = [...promptBlocks];
      let targetIndex;
      if (direction === "up") {
        targetIndex = currentIndex - 1;
      } else {
        targetIndex = currentIndex + 1;
      }

      [newBlocks[currentIndex], newBlocks[targetIndex]] = [
        newBlocks[targetIndex],
        newBlocks[currentIndex],
      ];
      setPromptBlocks(newBlocks);

      // Update full prompt
      const updatedPrompt = newBlocks
        .map((block) => block.content)
        .join("\n\n### ");
      setGeneratedPrompt(updatedPrompt);

      toast.success("Slide order updated");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Presentation prompt copied to clipboard");
  };

  const handleExportToGamma = () => {
    // Simulate export to Gamma
    toast.success(
      `Prompt for ${selectedProspect.companyName} exported to Gamma successfully!`
    );
  };

  const handleRefinePromptViaAPI = async (refinementPrompt) => {
    if (!generatedPrompt || !refinementPrompt) return;

    setIsRefining(true);
    setChatInput("");

    const userMessage = {
      role: "user",
      content: refinementPrompt,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/refine-presentation-prompt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_prompt_content: generatedPrompt,
            refinement_prompt: refinementPrompt,
            sales_methodology: selectedMethodology,
            sales_insights: selectedProspect.sales_insights || [],
            presentation_objective: selectedObjective,
            action_items: selectedProspect.action_items || [],
          }),
        }
      );

      const result = await response.json();
      const refined = result?.[0]?.refined_prompt_content;

      if (!refined) throw new Error("Empty refinement result");

      // Update prompt and blocks
      setGeneratedPrompt(refined);

      const lines = refined.split("\n");
      const blocks = [];
      let currentBlock = {
        id: 0,
        title: "Presentation Overview",
        content: "",
        type: "overview",
      };

      for (let line of lines) {
        if (line.startsWith("### ")) {
          if (currentBlock.content.trim()) {
            blocks.push({ ...currentBlock });
          }
          currentBlock = {
            id: blocks.length,
            title: line.replace("### ", "").trim(),
            content: line,
            type: "slide",
          };
        } else {
          currentBlock.content += `\n${line}`;
        }
      }

      if (currentBlock.content.trim()) {
        blocks.push({ ...currentBlock });
      }

      setPromptBlocks(blocks);
      setQualityScore((prev) => Math.min(100, prev + 2));

      // Save updated prompt
      if (selectedProspect?.presentation_prompt_id) {
        await dbHelpers.updatePresentationPrompt({
          id: selectedProspect.presentation_prompt_id,
          body: refined,
        });
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Refined presentation prompt for ${selectedProspect.companyName} based on: "${refinementPrompt}"`,
          timestamp: new Date(),
        },
      ]);

      toast.success("Prompt refined and saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to refine prompt");
    } finally {
      setIsRefining(false);
    }
  };

  // Show loading state while checking authentication
  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          AI-Powered Presentation Strategist
        </h1>
        <p className="text-muted-foreground">
          Transform prospect insights into persuasive, context-aware
          presentation prompts designed to accelerate your sales cycle.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Prospect Selector */}
        <div className="space-y-6">
          {isLoadingProspects ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading prospects...</p>
                </div>
              </CardContent>
            </Card>
          ) : prospects.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>No Prospects Available</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No prospects found</p>
                <p className="text-sm text-muted-foreground">
                  Process some call transcripts first to generate presentation prompts for prospects.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProspectSelector
              selectedProspect={selectedProspect}
              onProspectSelect={handleProspectSelect}
              compact={true}
              showStakeholders={true}
              prospectList={prospects}
            />
          )}

          {/* Strategic Compass */}
          {generatedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Strategic Compass</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Indicators */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Impact Preview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Personalization</span>
                      <Badge variant="default" className="text-xs">
                        High
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Call-to-Action Strength</span>
                      <Badge variant="default" className="text-xs">
                        Strong
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Prospect Relevance</span>
                      <Badge variant="default" className="text-xs">
                        Excellent
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Gamma Compatibility</span>
                      <Badge variant="default" className="text-xs">
                        Optimized
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quality Score */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Quality Score</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Quality</span>
                      <span className="text-sm font-medium">
                        {qualityScore}/100
                      </span>
                    </div>
                    <Progress value={qualityScore} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Excellent personalization for{" "}
                      {selectedProspect?.companyName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Presentation Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Presentation Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Visual Impact</p>
                    <p className="text-xs text-muted-foreground">
                      Use charts and infographics for data-heavy slides
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Audience Engagement</p>
                    <p className="text-xs text-muted-foreground">
                      Include interactive elements and questions
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Clear Objectives</p>
                    <p className="text-xs text-muted-foreground">
                      Each slide should advance toward your goal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProspect ? (
            <>
              {/* Setup Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Contextual Setup for {selectedProspect.companyName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Methodology & Objective */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Sales Methodology
                      </label>
                      <Select
                        value={selectedMethodology}
                        onValueChange={setSelectedMethodology}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(salesMethodologies).map(
                            ([key, method]) => (
                              <SelectItem key={key} value={key}>
                                <div>
                                  <div className="font-medium">{method.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {method.description}
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Presentation Objective
                      </label>
                      <Select
                        value={selectedObjective}
                        onValueChange={setSelectedObjective}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationObjectives.map((objective) => {
                            const Icon = objective.icon;
                            return (
                              <SelectItem
                                key={objective.value}
                                value={objective.value}
                              >
                                <div className="flex items-center space-x-2">
                                  <Icon className="w-4 h-4" />
                                  <span>{objective.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Content Library */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Content Library for {selectedProspect.companyName}
                    </label>
                    <div className="grid md:grid-cols-2 gap-2">
                      {contentLibrary.map((content) => (
                        <div
                          key={content.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                            selectedContent.includes(content.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent"
                          )}
                          onClick={() => handleContentToggle(content.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{content.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {content.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last used: {content.lastUsed}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={
                      isGenerating ||
                      !selectedProspect ||
                      !selectedMethodology ||
                      !selectedObjective ||
                      selectedProspect.presentation_prompt_id
                    }
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Generating Strategic Prompt for{" "}
                        {selectedProspect.companyName}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Presentation Prompt
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Prompt Section */}
              {(selectedProspect?.presentation_prompt_id || generatedPrompt) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>
                          Strategic Canvas for {selectedProspect.companyName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <Star className="w-3 h-3" />
                          <span>Quality: {qualityScore}/100</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPrompt}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button onClick={handleExportToGamma} size="sm">
                          <Send className="w-4 h-4 mr-1" />
                          Export to Gamma
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="blocks" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="blocks">Modular Blocks</TabsTrigger>
                        <TabsTrigger value="full">Full Prompt</TabsTrigger>
                      </TabsList>

                      <TabsContent value="blocks" className="mt-4">
                        <div className="space-y-4">
                          {promptBlocks.map((block, index) => (
                            <div
                              key={block.id}
                              className="border border-border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-sm">
                                  {block.title}
                                </h4>
                                <div className="flex items-center space-x-1">
                                  {index > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleMoveBlock(block.id, "up")
                                      }
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {index < promptBlocks.length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleMoveBlock(block.id, "down")
                                      }
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {editingBlock === block.id ? (
                                    <div className="flex space-x-1">
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
                                        onClick={() => setEditingBlock(null)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleBlockEdit(block.id)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {editingBlock === block.id ? (
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="min-h-32 font-mono text-sm"
                                />
                              ) : (
                                <div className="bg-muted rounded-lg p-3">
                                  <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                                    {block.content.substring(0, 200)}...
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="full" className="mt-4">
                        <div className="bg-muted rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed max-h-96 overflow-y-auto">
                            {generatedPrompt}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Chat Refinement Interface */}
              {generatedPrompt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>
                        Co-Pilot Refinement for {selectedProspect.companyName}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Prompts */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Quick Refinements
                      </h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {quickPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendPrompt(prompt)}
                            disabled={isRefining}
                            className="justify-start text-left h-auto py-2"
                          >
                            <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="text-xs">{prompt}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    {chatMessages.length > 0 && (
                      <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex",
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-xs px-3 py-2 rounded-lg text-sm",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex items-center space-x-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Refine the presentation for ${selectedProspect.companyName}... (e.g., 'Add more competitive analysis' or 'Make it more technical')`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendPrompt(chatInput);
                          }
                        }}
                        disabled={isRefining}
                      />
                      <Button
                        onClick={() => handleSendPrompt(chatInput)}
                        disabled={!chatInput.trim() || isRefining}
                      >
                        {isRefining ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Prospect Selected</h3>
                <p className="text-muted-foreground mb-4">
                  {prospects.length === 0 
                    ? "No prospects available. Process some call transcripts first to generate presentation prompts."
                    : "Select a prospect from the sidebar to generate personalized presentation prompts."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}