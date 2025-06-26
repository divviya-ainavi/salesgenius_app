import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Eye,
  Ear,
  Hand,
  Brain,
  Heart,
  Zap,
  Send,
  Copy,
  RefreshCw,
  Plus,
  MessageSquare,
  User,
  Target,
  Sparkles,
  ArrowRight,
  Edit,
  Save,
  X,
  Mail,
  Crown,
  Star,
  Info,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import api from "../../lib/api";

// Mock personality analysis data based on selected prospect
const getPersonalityAnalysis = (prospectId) => {
  const analysisData = {
    acme_corp: {
      primary_contact: {
        name: "Sarah Johnson",
        role: "VP of Sales",
        communication_style: "visual",
        personality_type: "ENTJ",
        confidence: 0.85,
        key_traits: ["Direct", "Results-oriented", "Strategic thinker"],
        communication_preferences: [
          "Prefers visual data and charts",
          "Values efficiency and quick decisions",
          "Responds well to ROI-focused messaging",
        ],
      },
      attendees: [
        {
          name: "Mike Chen",
          role: "Sales Operations Manager",
          communication_style: "kinesthetic",
          personality_type: "ISTJ",
          confidence: 0.78,
          key_traits: ["Detail-oriented", "Process-focused", "Analytical"],
          communication_preferences: [
            "Prefers hands-on demonstrations",
            "Values detailed implementation plans",
            "Needs concrete examples and case studies",
          ],
        },
        {
          name: "Lisa Rodriguez",
          role: "Director of Marketing",
          communication_style: "auditory",
          personality_type: "ENFP",
          confidence: 0.72,
          key_traits: ["Creative", "Collaborative", "Enthusiastic"],
          communication_preferences: [
            "Enjoys verbal discussions and calls",
            "Values team collaboration features",
            "Responds to emotional and inspirational messaging",
          ],
        },
      ],
    },
    techstart_inc: {
      primary_contact: {
        name: "John Smith",
        role: "CEO",
        communication_style: "visual",
        personality_type: "INTJ",
        confidence: 0.88,
        key_traits: ["Analytical", "Strategic", "Independent"],
        communication_preferences: [
          "Prefers data-driven presentations",
          "Values long-term strategic thinking",
          "Responds to innovation and efficiency",
        ],
      },
      attendees: [
        {
          name: "Emma Wilson",
          role: "CTO",
          communication_style: "kinesthetic",
          personality_type: "ISTP",
          confidence: 0.82,
          key_traits: ["Technical", "Practical", "Problem-solver"],
          communication_preferences: [
            "Prefers technical demonstrations",
            "Values hands-on testing",
            "Needs detailed technical specifications",
          ],
        },
      ],
    },
    global_solutions: {
      primary_contact: {
        name: "Emma Wilson",
        role: "Director of Operations",
        communication_style: "auditory",
        personality_type: "ESFJ",
        confidence: 0.79,
        key_traits: ["Collaborative", "Process-oriented", "People-focused"],
        communication_preferences: [
          "Prefers verbal communication",
          "Values team consensus",
          "Responds to relationship-building",
        ],
      },
      attendees: [
        {
          name: "David Brown",
          role: "IT Manager",
          communication_style: "kinesthetic",
          personality_type: "ISTJ",
          confidence: 0.85,
          key_traits: ["Methodical", "Reliable", "Detail-focused"],
          communication_preferences: [
            "Prefers step-by-step processes",
            "Values practical implementation",
            "Needs comprehensive documentation",
          ],
        },
      ],
    },
  };

  return (
    analysisData[prospectId] || {
      primary_contact: {
        name: "Unknown Contact",
        role: "Unknown Role",
        communication_style: "visual",
        personality_type: "UNKNOWN",
        confidence: 0.5,
        key_traits: ["To be determined"],
        communication_preferences: ["Analysis pending"],
      },
      attendees: [],
    }
  );
};

const communicationStyles = {
  visual: {
    icon: Eye,
    label: "Visual",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Prefers charts, graphs, and visual demonstrations",
  },
  auditory: {
    icon: Ear,
    label: "Auditory",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Learns through listening and verbal communication",
  },
  kinesthetic: {
    icon: Hand,
    label: "Kinesthetic",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Prefers hands-on experiences and practical examples",
  },
};

const personalityTypes = {
  ENTJ: {
    label: "The Commander",
    traits: ["Natural leader", "Strategic", "Decisive"],
  },
  ISTJ: {
    label: "The Logistician",
    traits: ["Practical", "Fact-minded", "Reliable"],
  },
  ENFP: {
    label: "The Campaigner",
    traits: ["Enthusiastic", "Creative", "Sociable"],
  },
  INTJ: {
    label: "The Architect",
    traits: ["Imaginative", "Strategic", "Independent"],
  },
  ISTP: {
    label: "The Virtuoso",
    traits: ["Practical", "Experimental", "Adaptable"],
  },
  ESFJ: { label: "The Consul", traits: ["Caring", "Social", "Popular"] },
  UNKNOWN: { label: "Analysis Pending", traits: ["To be determined"] },
};

const quickPrompts = [
  "Make it more concise and direct",
  "Add more technical details",
  "Include specific ROI metrics",
  "Make it more personal and warm",
  "Add urgency and next steps",
  "Focus on competitive advantages",
  "Include social proof and testimonials",
  "Emphasize integration capabilities",
];

// Mock prospects data
const mockProspects = [
  {
    id: "acme_corp",
    companyName: "Acme Corp",
    prospectName: "Sarah Johnson",
    title: "VP of Sales",
    status: "hot",
    dealValue: "$120K",
    probability: 85,
    nextAction: "Pilot program approval",
    stakeholders: [
      { name: "Sarah Johnson", role: "VP Sales", style: "Visual" },
      { name: "Mike Chen", role: "Sales Ops", style: "Kinesthetic" },
      { name: "Lisa Rodriguez", role: "Marketing Dir", style: "Auditory" },
    ],
  },
  {
    id: "techstart_inc",
    companyName: "TechStart Inc",
    prospectName: "John Smith",
    title: "CEO",
    status: "warm",
    dealValue: "$45K",
    probability: 65,
    nextAction: "Technical demo",
    stakeholders: [
      { name: "John Smith", role: "CEO", style: "Visual" },
      { name: "Emma Wilson", role: "CTO", style: "Kinesthetic" },
    ],
  },
  {
    id: "global_solutions",
    companyName: "Global Solutions Ltd",
    prospectName: "Emma Wilson",
    title: "Director of Operations",
    status: "warm",
    dealValue: "$85K",
    probability: 70,
    nextAction: "Proposal review",
    stakeholders: [
      { name: "Emma Wilson", role: "Director Operations", style: "Auditory" },
      { name: "David Brown", role: "IT Manager", style: "Kinesthetic" },
    ],
  },
];

export const EmailTemplates = () => {
  const location = useLocation();
  const [selectedProspect, setSelectedProspect] = useState(mockProspects[0]);
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [pushStatus, setPushStatus] = useState("draft");
  const [activeTab, setActiveTab] = useState("insights");
  const [recipientSidebarOpen, setRecipientSidebarOpen] = useState(false);

  // Collapsible states - all collapsed by default
  const [primaryTraitsOpen, setPrimaryTraitsOpen] = useState(false);
  const [primaryPrefsOpen, setPrimaryPrefsOpen] = useState(false);
  const [attendeeTraitsOpen, setAttendeeTraitsOpen] = useState({});
  const [attendeePrefsOpen, setAttendeePrefsOpen] = useState({});
  const [prospects, setProspects] = useState([]);
  const [emailTemplate, setEmailTemplate] = useState(null);

  console.log(CURRENT_USER.id, "Current User ID in EmailTemplates");

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        const insights = await dbHelpers.getEmailProspectInsights(
          CURRENT_USER.id
        );
        console.log("Fetched email insights:", insights);
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
          action_items: insight.action_items || [],
        }));

        setProspects(enrichedProspects);

        if (enrichedProspects.length > 0) {
          console.log("Enriched prospects:", enrichedProspects);
          setSelectedProspect(enrichedProspects[0]);
        }
      } catch (err) {
        console.error("Failed to load email insights:", err);
        toast.error("Could not fetch email insights");
      }
    };

    fetchProspects();
  }, []);

  console.log("Prospects loaded:", prospects, selectedProspect);

  useEffect(() => {
    if (selectedProspect.email_template_id) {
      setIsGenerating(true);
      dbHelpers
        .getEmailTemplateById(selectedProspect.email_template_id)
        .then((template) => {
          console.log(template, "template email");
          setEmailTemplate(template);
          setEmailSubject(template.subject || "");
          setGeneratedEmail(template.body || "");
        })
        .catch((error) => {
          console.log(error, "email template error");
        })
        .finally(() => setIsGenerating(false));
    }
  }, [selectedProspect.email_template_id]);

  console.log(
    generatedEmail,
    "generated email",
    emailTemplate,
    selectedProspect.email_template_id
  );

  // Check for selected call from navigation
  useEffect(() => {
    if (location.state?.selectedCall) {
      const call = location.state.selectedCall;
      // Find matching prospect or create new one
      const prospect = mockProspects.find(
        (p) => p.companyName === call.companyName
      ) || {
        id: call.companyName.toLowerCase().replace(/\s+/g, "_"),
        companyName: call.companyName,
        prospectName: call.prospectName,
        title: "Unknown",
        status: "new",
        dealValue: "TBD",
        probability: 50,
        nextAction: "Initial follow-up",
        stakeholders: [],
      };
      setSelectedProspect(prospect);
    }
  }, [location.state]);

  // Load personality analysis when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const primary = selectedProspect.communication_styles?.[0] || {};
      const others = selectedProspect.communication_styles?.slice(1) || [];
      console.log(primary, others, "Primary and others styles");
      setPersonalityAnalysis({
        primary_contact: {
          name: primary.stakeholder || "Unknown",
          role: primary.role || "Unknown",
          communication_style: primary.style?.toLowerCase() || "visual",
          personality_type: primary.personality_type || "UNKNOWN",
          confidence: primary.confidence || 0.5,
          key_traits: primary.key_traits || ["To be determined"],
          communication_preferences: primary.preferences || ["Pending"],
        },
        attendees: others.map((p) => ({
          name: p.stakeholder,
          role: p.role,
          communication_style: p.style?.toLowerCase(),
          personality_type: p.personality_type || "UNKNOWN",
          confidence: p.confidence || 0.5,
          key_traits: p.key_traits || ["To be determined"],
          communication_preferences: p.preferences || ["Pending"],
        })),
      });

      const defaultRecipients = ["primary_contact"];
      if (others.length > 0) defaultRecipients.push("attendee_0");
      setSelectedRecipients([]);
      setGeneratedEmail("");
      setEmailSubject("");
      setChatMessages([]);
      setPushStatus("draft");
    }
  }, [selectedProspect]);

  // Clear email when recipients change
  useEffect(() => {
    if (generatedEmail && selectedRecipients.length > 0) {
      // Only clear if we have an existing email and selections have changed
      // This prevents clearing on initial load
      setGeneratedEmail("");
      setEmailSubject("");
      setChatMessages([]);
      setPushStatus("draft");
    }
  }, [selectedRecipients]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleToggleRecipient = (recipientId) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipientId)) {
        return prev.filter((id) => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  const getSelectedRecipientsData = () => {
    if (!personalityAnalysis) return [];

    const recipients = [];

    if (selectedRecipients.includes("primary_contact")) {
      recipients.push({
        id: "primary_contact",
        ...personalityAnalysis.primary_contact,
        isPrimary: true,
      });
    }

    selectedRecipients.forEach((recipientId) => {
      if (recipientId.startsWith("attendee_")) {
        const index = parseInt(recipientId.split("_")[1]);
        if (personalityAnalysis.attendees[index]) {
          recipients.push({
            id: recipientId,
            ...personalityAnalysis.attendees[index],
            isPrimary: false,
          });
        }
      }
    });

    return recipients;
  };

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/generate-followup-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: selectedProspect.extracted_transcript,
            sales_insights: selectedProspect.sales_insights,
            action_items: selectedProspect.action_items,
            prospects: selectedRecipients?.join(", "),
          }),
        }
      );

      const { output } = (await response.json())[0];

      const subject = output.subject || output.Subject || "Follow-Up";
      const body = output.body || output.Body || JSON.stringify(output);

      const newEmail = await dbHelpers.createEmailTemplate(subject, body);
      await dbHelpers.linkEmailTemplateToCallInsight(
        selectedProspect.id,
        newEmail.id
      );

      // Set local state
      setEmailTemplate(newEmail);
      setGeneratedEmail(newEmail.body);
      setEmailSubject(newEmail.subject);
    } catch (error) {
      console.error("Email generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendPrompt = async (prompt) => {
    if (!prompt.trim() || !generatedEmail || !emailTemplate?.id) return;

    setIsRefining(true);
    setChatInput("");

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/refine-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_email_content: generatedEmail,
            email_subject: emailSubject,
            refinement_prompt: prompt,
            sales_insights: selectedProspect.sales_insights,
            action_items: selectedProspect.action_items,
          }),
        }
      );

      const {
        refined_email_content,
        refined_email_subject,
        ai_response_message,
      } = (await response.json())[0];
      const refinedSubject = refined_email_subject || emailSubject;
      const refinedBody = refined_email_content || generatedEmail;
      console.log(refinedSubject, refinedBody, emailTemplate?.id, "Refined");
      // Update in Supabase
      const updated = await dbHelpers.updateEmailTemplate(emailTemplate.id, {
        subject: refinedSubject,
        body: refinedBody,
      });

      // Reflect in UI
      setGeneratedEmail(updated.body);
      setEmailSubject(updated.subject);
      setEmailTemplate(updated);

      // Add assistant message
      const aiMessage = {
        role: "assistant",
        content: `Refined email using prompt: "${prompt}". Changes have been saved.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      toast.success("Email refined and updated successfully!");
    } catch (error) {
      console.error("Error refining email:", error);
      toast.error("Failed to refine and update the email");
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success("Email body copied to clipboard");
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailSubject);
    toast.success("Subject line copied to clipboard");
  };

  const handlePushToHubSpot = async () => {
    setPushStatus("pending");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPushStatus("success");
      toast.success(
        `Email template for ${selectedProspect.companyName} saved to HubSpot!`
      );
    } catch (error) {
      setPushStatus("error");
      toast.error("Failed to push to HubSpot");
    }
  };

  // Calculate total insights count (all insights are automatically included)
  const selectedCount = personalityAnalysis
    ? 1 + personalityAnalysis.attendees.length
    : 0;

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Personalized Emails with AI Insights
          </h1>
          <p className="text-muted-foreground">
            Generate personalized follow-up emails based on prospect personality
            analysis and communication preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Prospect Selector */}

          <div className="space-y-6">
            {prospects.length > 0 && (
              <ProspectSelector
                selectedProspect={selectedProspect}
                onProspectSelect={handleProspectSelect}
                compact={false}
                showStakeholders={true}
                prospectList={prospects} // filtered from call_insights
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="insights">
                  Prospect Profile & Insights
                </TabsTrigger>
                <TabsTrigger value="generator">Email Generator</TabsTrigger>
              </TabsList>
              {console.log("Selected Prospect:", selectedProspect)}
              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-6">
                {personalityAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5" />
                          <span>
                            Personalization Insights for{" "}
                            {selectedProspect.companyName}
                          </span>
                          <Badge variant="secondary">AI Analyzed</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Decision Maker */}
                      <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <div>
                              <h4 className="font-semibold text-amber-900">
                                {personalityAnalysis.primary_contact.name}
                              </h4>
                              <p className="text-sm text-amber-700">
                                {personalityAnalysis.primary_contact.role}
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-1 bg-amber-100 text-amber-800 border-amber-300 text-xs"
                              >
                                Primary Decision Maker
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(
                              personalityAnalysis.primary_contact.confidence *
                                100
                            )}
                            % confidence
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Communication Style */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">
                              Communication Style
                            </h5>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const style =
                                  communicationStyles[
                                    personalityAnalysis.primary_contact.style
                                  ];
                                // const Icon = style.icon;
                                return (
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      // className={cn("text-xs", style.color)}
                                    >
                                      {/* <Icon className="w-3 h-3 mr-1" /> */}
                                      {
                                        personalityAnalysis.primary_contact
                                          .style
                                      }
                                    </Badge>
                                    {console.log(style, "check Style")}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{style?.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Personality Type */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">
                              Personality Type
                            </h5>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                              >
                                <Brain className="w-3 h-3 mr-1" />
                                {
                                  personalityAnalysis.primary_contact
                                    .personality_type
                                }
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>
                                    <p className="font-medium">
                                      {
                                        personalityTypes[
                                          personalityAnalysis.primary_contact
                                            .personality_type
                                        ]?.label
                                      }
                                    </p>
                                    <p className="text-xs mt-1">
                                      {personalityTypes[
                                        personalityAnalysis.primary_contact
                                          .personality_type
                                      ]?.traits.join(", ")}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        {/* Key Traits - Collapsible */}
                        <Collapsible
                          open={primaryTraitsOpen}
                          onOpenChange={setPrimaryTraitsOpen}
                        >
                          <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                            {primaryTraitsOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>Key Traits</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {personalityAnalysis.primary_contact.key_traits.map(
                                (trait, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {trait}
                                  </Badge>
                                )
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Communication Preferences - Collapsible */}
                        <Collapsible
                          open={primaryPrefsOpen}
                          onOpenChange={setPrimaryPrefsOpen}
                        >
                          <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                            {primaryPrefsOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>Communication Preferences</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {personalityAnalysis.primary_contact.communication_preferences.map(
                                (pref, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2"
                                  >
                                    <span className="text-primary mt-1">•</span>
                                    <span>{pref}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                      {console.log(selectedProspect, "selected prospect")}
                      {/* Key Stakeholders */}
                      {selectedProspect?.communication_styles?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center space-x-2">
                            <Star className="w-4 h-4 text-blue-600" />
                            <span>Key Stakeholders</span>
                          </h4>
                          {selectedProspect?.communication_styles?.map(
                            (attendee, index) => (
                              <div
                                key={index}
                                className="border border-border rounded-lg p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <h5 className="font-medium">
                                        {attendee.stakeholder}
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {attendee.role}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(attendee.confidence * 100)}%
                                    confidence
                                  </Badge>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  {/* Communication Style */}
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">
                                      Communication Style
                                    </h6>
                                    <div className="flex items-center space-x-2">
                                      {(() => {
                                        const style = communicationStyles[0];
                                        // const Icon = style.icon;
                                        return (
                                          <div className="flex items-center space-x-2">
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-xs",
                                                style?.color
                                              )}
                                            >
                                              {/* <Icon className="w-3 h-3 mr-1" /> */}
                                              {attendee?.style}
                                            </Badge>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>{style?.description}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Personality Type */}
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">
                                      Personality Type
                                    </h6>
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                                      >
                                        <Brain className="w-3 h-3 mr-1" />
                                        {attendee.personality_type}
                                      </Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div>
                                            <p className="font-medium">
                                              {
                                                personalityTypes[
                                                  attendee.personality_type
                                                ]?.label
                                              }
                                            </p>
                                            <p className="text-xs mt-1">
                                              {personalityTypes[
                                                attendee.personality_type
                                              ]?.traits.join(", ")}
                                            </p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>

                                {/* Key Traits - Collapsible */}
                                <Collapsible
                                  open={attendeeTraitsOpen[index]}
                                  onOpenChange={(open) =>
                                    setAttendeeTraitsOpen((prev) => ({
                                      ...prev,
                                      [index]: open,
                                    }))
                                  }
                                >
                                  <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                                    {attendeeTraitsOpen[index] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <span>Key Traits</span>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="flex flex-wrap gap-1">
                                      {attendee.communication_tips.map(
                                        (trait, traitIndex) => (
                                          <Badge
                                            key={traitIndex}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {trait}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>

                                {/* Communication Preferences - Collapsible */}
                                <Collapsible
                                  open={attendeePrefsOpen[index]}
                                  onOpenChange={(open) =>
                                    setAttendeePrefsOpen((prev) => ({
                                      ...prev,
                                      [index]: open,
                                    }))
                                  }
                                >
                                  <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                                    {attendeePrefsOpen[index] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <span>Communication Preferences</span>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {attendee.preferences.map(
                                        (pref, prefIndex) => (
                                          <li
                                            key={prefIndex}
                                            className="flex items-start space-x-2"
                                          >
                                            <span className="text-primary mt-1">
                                              •
                                            </span>
                                            <span>{pref}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Insights Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-blue-900">
                            Insights Summary
                          </h4>
                        </div>
                        <p className="text-sm text-blue-700">
                          {selectedProspect?.call_summary}
                        </p>
                        <div className="mt-3 flex items-center space-x-4">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {selectedProspect?.sales_insights?.length} insights
                            included
                          </Badge>
                          <span className="text-xs text-blue-600">
                            Ready for email generation
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Email Generator Tab */}
              <TabsContent value="generator" className="mt-6">
                <div className="space-y-6">
                  {/* Recipients Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span>Email Recipients</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {personalityAnalysis && (
                        <div className="space-y-2">
                          {/* Primary Contact */}
                          {/* <div className="flex items-center space-x-3 p-3 rounded-lg border">
                            <Checkbox
                              checked={selectedRecipients.includes(
                                "primary_contact"
                              )}
                              onCheckedChange={() =>
                                handleToggleRecipient("primary_contact")
                              }
                            />
                            <Crown className="w-4 h-4 text-amber-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {personalityAnalysis.primary_contact.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {personalityAnalysis.primary_contact.role}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                            >
                              Primary
                            </Badge>
                          </div> */}

                          {/* Attendees */}
                          {selectedProspect?.prospect_details?.map(
                            (attendee, index) => {
                              const isChecked = selectedRecipients.includes(
                                attendee.name
                              );

                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-center space-x-3 p-3 rounded-lg border",
                                    index === 0
                                      ? "border-amber-300 bg-amber-50"
                                      : ""
                                  )}
                                >
                                  {console.log(
                                    generatedEmail,
                                    "Generated Email"
                                  )}
                                  {!generatedEmail && (
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        handleToggleRecipient(attendee.name)
                                      }
                                    />
                                  )}

                                  {index === 0 ? (
                                    <Crown className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <Users className="w-4 h-4 text-blue-600" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {attendee.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {attendee.role}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      index === 0
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : "text-blue-700 border-blue-300"
                                    )}
                                  >
                                    {index === 0 ? "Primary" : "Stakeholder"}
                                  </Badge>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}

                      {/* Generate Email Button */}
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleGenerateEmail}
                          disabled={
                            isGenerating || selectedRecipients.length === 0
                          }
                          size="lg"
                          className="w-full max-w-md"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating Personalized Email...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Personalized Email (
                              {selectedRecipients.length} recipients)
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Email Display */}
                  {generatedEmail ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-5 h-5" />
                            <span>
                              Generated Email for {selectedProspect.companyName}
                            </span>
                            <Badge variant="secondary">AI Generated</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {pushStatus === "success" && (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Saved to HubSpot
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePushToHubSpot}
                              disabled={pushStatus === "pending"}
                            >
                              {pushStatus === "pending" ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : pushStatus === "success" ? (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Save to HubSpot
                                </>
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Subject Line */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">
                              Subject Line
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopySubject}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="font-medium"
                          />
                        </div>

                        {/* Email Body */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">
                              Email Body
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopyEmail}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <Textarea
                            value={generatedEmail}
                            onChange={(e) => setGeneratedEmail(e.target.value)}
                            rows={16}
                            className="font-mono text-sm"
                          />
                        </div>

                        {/* Recipients Summary */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-medium mb-2">
                            Email Recipients ({selectedRecipients.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedRecipientsData().map(
                              (recipient, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {recipient.isPrimary && (
                                    <Crown className="w-3 h-3 mr-1" />
                                  )}
                                  {recipient.name} - {recipient.role}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No Email Generated Yet
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Select recipients above and click "Generate
                          Personalized Email" to create an AI-powered email
                          using all available insights.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Refinement Chat */}
                  {generatedEmail && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5" />
                          <span>Refine with AI</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Quick Prompts */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Quick Refinements
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendPrompt(prompt)}
                                disabled={isRefining}
                              >
                                {prompt}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Messages */}
                        {chatMessages.length > 0 && (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {chatMessages.map((message, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "p-3 rounded-lg text-sm",
                                  message.role === "user"
                                    ? "bg-primary text-primary-foreground ml-8"
                                    : "bg-muted mr-8"
                                )}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chat Input */}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Ask AI to refine the email (e.g., 'Make it more technical' or 'Add urgency')"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendPrompt(chatInput);
                              }
                            }}
                            disabled={isRefining}
                          />
                          <Button
                            onClick={() => handleSendPrompt(chatInput)}
                            disabled={isRefining || !chatInput.trim()}
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
