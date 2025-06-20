import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Mail,
  Send,
  Copy,
  RefreshCw,
  Edit,
  Save,
  X,
  Sparkles,
  MessageSquare,
  Target,
  TrendingUp,
  User,
  Building,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import crmService from "@/services/crmService";

// Quick refinement prompts
const quickPrompts = [
  "Make it more professional",
  "Add urgency",
  "Include specific next steps",
  "Make it more personal",
  "Add social proof",
  "Shorten the email",
  "Add technical details",
  "Focus on ROI benefits",
];

export const EmailTemplates = () => {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [pushStatus, setPushStatus] = useState("draft");
  const [hubspotConnectionStatus, setHubspotConnectionStatus] = useState(null);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  useEffect(() => {
    checkHubSpotConnection();
  }, []);

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
    if (selectedProspect?.email_template_id) {
      const fetchEmailTemplate = async () => {
        try {
          const template = await dbHelpers.getEmailTemplateById(
            selectedProspect.email_template_id
          );
          if (template) {
            setEmailSubject(template.subject || "");
            setGeneratedEmail(template.body || "");
          }
        } catch (error) {
          console.error("Error fetching email template:", error);
        }
      };

      fetchEmailTemplate();
    } else {
      // Clear email when switching prospects without templates
      setGeneratedEmail("");
      setEmailSubject("");
      setChatMessages([]);
      setPushStatus("draft");
    }
  }, [selectedProspect]);

  const checkHubSpotConnection = async () => {
    try {
      const status = await crmService.getConnectionStatus("hubspot");
      setHubspotConnectionStatus(status);
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotConnectionStatus({ connected: false, error: error.message });
    }
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleGenerateEmail = async () => {
    if (!selectedProspect?.extracted_transcript) {
      toast.error("Missing transcript for this prospect");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/generate-follow-up-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: selectedProspect.extracted_transcript,
            sales_insights: selectedProspect.sales_insights || [],
            communication_styles: selectedProspect.communication_styles || [],
            action_items: selectedProspect.action_items || [],
          }),
        }
      );

      const result = await response.json();
      const emailData = result?.[0]?.output;

      if (!emailData) throw new Error("Empty response from AI");

      setEmailSubject(emailData.subject || "Follow-up from our conversation");
      setGeneratedEmail(emailData.body || emailData.email_content || "");

      // Save to database
      const savedTemplate = await dbHelpers.saveEmailTemplate({
        subject: emailData.subject || "Follow-up from our conversation",
        body: emailData.body || emailData.email_content || "",
      });

      // Update call_insights with email_template_id
      await dbHelpers.updateCallInsightsEmailId(
        selectedProspect.id,
        savedTemplate.id
      );

      // Update local state
      setSelectedProspect((prev) => ({
        ...prev,
        email_template_id: savedTemplate.id,
      }));

      toast.success(
        `Email generated and saved for ${selectedProspect.companyName}`
      );
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProspect?.email_template_id) {
      toast.error("No email template to update");
      return;
    }

    try {
      await dbHelpers.updateEmailTemplate(selectedProspect.email_template_id, {
        subject: editedSubject,
        body: editedContent,
      });

      setEmailSubject(editedSubject);
      setGeneratedEmail(editedContent);
      setIsEditing(false);
      toast.success("Email updated successfully");
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email");
    }
  };

  const handleStartEdit = () => {
    setEditedSubject(emailSubject);
    setEditedContent(generatedEmail);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSubject("");
    setEditedContent("");
  };

  const handleCopyEmail = () => {
    const fullEmail = `Subject: ${emailSubject}\n\n${generatedEmail}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success("Email copied to clipboard");
  };

  const handleSendPrompt = async (prompt) => {
    if (!prompt.trim() || !generatedEmail) return;

    setIsRefining(true);
    setChatInput("");

    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/refine-follow-up-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_email_content: generatedEmail,
            current_subject: emailSubject,
            refinement_prompt: prompt,
            sales_insights: selectedProspect.sales_insights || [],
            communication_styles: selectedProspect.communication_styles || [],
            action_items: selectedProspect.action_items || [],
          }),
        }
      );

      const result = await response.json();
      const refinedEmail = result?.[0]?.refined_email;

      if (!refinedEmail) throw new Error("Empty refinement result");

      setEmailSubject(
        refinedEmail.subject || refinedEmail.refined_subject || emailSubject
      );
      setGeneratedEmail(
        refinedEmail.body ||
          refinedEmail.refined_body ||
          refinedEmail.email_content ||
          ""
      );

      // Update database
      if (selectedProspect?.email_template_id) {
        await dbHelpers.updateEmailTemplate(selectedProspect.email_template_id, {
          subject:
            refinedEmail.subject || refinedEmail.refined_subject || emailSubject,
          body:
            refinedEmail.body ||
            refinedEmail.refined_body ||
            refinedEmail.email_content ||
            "",
        });
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Refined email for ${selectedProspect.companyName} based on: "${prompt}"`,
          timestamp: new Date(),
        },
      ]);

      toast.success("Email refined and saved!");
    } catch (error) {
      console.error("Error refining email:", error);
      toast.error("Failed to refine email");
    } finally {
      setIsRefining(false);
    }
  };

  const handlePushToHubSpot = async () => {
    if (!hubspotConnectionStatus?.connected) {
      toast.error("HubSpot is not connected");
      return;
    }

    if (!generatedEmail || !emailSubject) {
      toast.error("No email content to push");
      return;
    }

    setPushStatus("pending");

    try {
      // Mock HubSpot push - in real implementation, this would use the CRM service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPushStatus("success");
      toast.success("Email pushed to HubSpot successfully!");
    } catch (error) {
      console.error("Error pushing to HubSpot:", error);
      setPushStatus("error");
      toast.error("Failed to push email to HubSpot");
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
          AI-Powered Email Templates
        </h1>
        <p className="text-muted-foreground">
          Generate personalized follow-up emails based on call insights and
          prospect communication styles.
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
                  Process some call transcripts first to generate email templates for prospects.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProspectSelector
              selectedProspect={selectedProspect}
              onProspectSelect={handleProspectSelect}
              compact={false}
              showStakeholders={true}
              prospectList={prospects}
            />
          )}

          {/* Email Stats */}
          {selectedProspect && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">92%</div>
                    <div className="text-muted-foreground">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">68%</div>
                    <div className="text-muted-foreground">Response Rate</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Personalization Score</span>
                    <Badge variant="default">High</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Communication Style</span>
                    <Badge variant="outline">
                      {selectedProspect.communication_styles?.[0]?.style ||
                        "Professional"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Urgency Level</span>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {selectedProspect && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyEmail}
                  disabled={!generatedEmail}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handlePushToHubSpot}
                  disabled={
                    !generatedEmail ||
                    !hubspotConnectionStatus?.connected ||
                    pushStatus === "pending"
                  }
                >
                  {pushStatus === "pending" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  {pushStatus === "pending" ? "Pushing..." : "Push to HubSpot"}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Send
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProspect ? (
            <>
              {/* Email Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Email for {selectedProspect.companyName}</span>
                      {pushStatus === "success" && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Pushed to HubSpot
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!generatedEmail && (
                        <Button
                          onClick={handleGenerateEmail}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              Generate Email
                            </>
                          )}
                        </Button>
                      )}
                      {generatedEmail && !isEditing && (
                        <Button variant="outline" onClick={handleStartEdit}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button onClick={handleSaveEdit}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedEmail ? (
                    <div className="space-y-4">
                      {/* Subject Line */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Subject Line
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            placeholder="Email subject..."
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">{emailSubject}</p>
                          </div>
                        )}
                      </div>

                      {/* Email Body */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Email Content
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-64"
                            placeholder="Email content..."
                          />
                        ) : (
                          <div className="p-4 bg-muted rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                              {generatedEmail}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Mail className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">
                        Generate Personalized Email
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Create a tailored follow-up email based on your call
                        insights and {selectedProspect.companyName}'s
                        communication style.
                      </p>
                      <Button onClick={handleGenerateEmail} disabled={isGenerating}>
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating Email...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chat Refinement Interface */}
              {generatedEmail && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Refine Email</span>
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
                        placeholder={`Refine the email for ${selectedProspect.companyName}... (e.g., 'Make it more urgent' or 'Add technical details')`}
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
                    ? "No prospects available. Process some call transcripts first to generate email templates."
                    : "Select a prospect from the sidebar to generate personalized email templates."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};