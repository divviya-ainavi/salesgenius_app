import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Mail,
  Send,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Filter,
  Building,
  User,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "@/hooks/usePageTimer";

export const EmailTemplates = () => {
  // Track time spent on Email Templates page
  usePageTimer('Email Templates');

  const [selectedProspect, setSelectedProspect] = useState(null);
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [pushStatus, setPushStatus] = useState("draft");
  const [prospects, setProspects] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Load prospects and email templates on component mount
  useEffect(() => {
    const loadProspects = async () => {
      if (!userId) {
        console.log("No user ID available, skipping prospect fetch");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const insights = await dbHelpers.getEmailProspectInsights(userId);
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
          fullInsight: insight,
          call_summary: insight.call_summary,
          follow_up_email: insight.follow_up_email,
          email_template_id: insight.email_template_id,
        }));

        setProspects(enrichedProspects);
        if (enrichedProspects.length > 0) {
          setSelectedProspect(enrichedProspects[0]);
          setEmailContent(enrichedProspects[0].follow_up_email || "");
          setEmailSubject(
            `Follow-up: ${enrichedProspects[0].companyName} Discussion`
          );
        }
      } catch (err) {
        console.error("Failed to load email insights:", err);
        toast.error("Could not fetch email insights");
      } finally {
        setIsLoading(false);
      }
    };

    loadProspects();
  }, [userId]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    setEmailContent(prospect.follow_up_email || "");
    setEmailSubject(`Follow-up: ${prospect.companyName} Discussion`);
    setPushStatus("draft");
  };

  const handleGenerateEmail = async () => {
    if (!selectedProspect) {
      toast.error("Please select a prospect first");
      return;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, you would call your AI service
      // For now, simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // If the prospect already has a follow-up email, use it
      if (selectedProspect.follow_up_email) {
        setEmailContent(selectedProspect.follow_up_email);
      } else {
        // Otherwise generate a generic template
        const newEmail = `Dear ${
          selectedProspect.prospect_details?.[0]?.name || "Prospect"
        },

Thank you for taking the time to speak with me about ${
          selectedProspect.companyName
        }'s needs. I appreciate your insights into the challenges you're facing with ${
          selectedProspect.sales_insights?.[0]?.content ||
          "your current processes"
        }.

Based on our conversation, I believe our solution can help address these challenges by:

1. Streamlining your sales operations
2. Improving visibility into your pipeline
3. Enhancing team collaboration

I'd like to schedule a follow-up call to discuss next steps. Would you be available next week?

Best regards,
[Your Name]`;

        setEmailContent(newEmail);
      }

      setEmailSubject(`Follow-up: ${selectedProspect.companyName} Discussion`);
      toast.success("Email template generated successfully");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("Failed to generate email template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!selectedProspect || !emailContent) {
      toast.error("Please select a prospect and generate an email first");
      return;
    }

    try {
      // Save email template to database
      let templateId = selectedProspect.email_template_id;

      if (!templateId) {
        // Create new template
        const template = await dbHelpers.createEmailTemplate(
          emailSubject,
          emailContent
        );
        templateId = template.id;

        // Link template to call insight
        await dbHelpers.linkEmailTemplateToCallInsight(
          selectedProspect.id,
          templateId
        );
      } else {
        // Update existing template
        await dbHelpers.updateEmailTemplate(templateId, {
          subject: emailSubject,
          body: emailContent,
        });
      }

      // Update local state
      setProspects((prev) =>
        prev.map((p) =>
          p.id === selectedProspect.id
            ? {
                ...p,
                follow_up_email: emailContent,
                email_template_id: templateId,
              }
            : p
        )
      );

      setIsEditing(false);
      toast.success("Email template saved successfully");
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("Failed to save email template");
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent);
    toast.success("Email copied to clipboard");
  };

  const handlePushToHubSpot = async () => {
    if (!selectedProspect || !emailContent) {
      toast.error("Please select a prospect and generate an email first");
      return;
    }

    setPushStatus("pending");

    try {
      // In a real implementation, you would call your CRM service
      // For now, simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPushStatus("success");
      toast.success(
        `Email for ${selectedProspect.companyName} pushed to HubSpot successfully`
      );
    } catch (error) {
      console.error("Error pushing to HubSpot:", error);
      setPushStatus("error");
      toast.error("Failed to push email to HubSpot");
    }
  };

  // Filter prospects based on search and status
  const filteredProspects = prospects.filter((prospect) => {
    const matchesSearch =
      prospect.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.prospectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && !prospect.email_template_id) ||
      (statusFilter === "saved" && prospect.email_template_id);

    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Follow-up Emails
          </h1>
          <p className="text-muted-foreground">
            Generate and manage personalized follow-up emails for your prospects
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="saved">Saved</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Prospect Selector */}
        <div className="space-y-6">
          {isLoading ? (
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
                  Process some call transcripts first to generate email templates
                  for prospects.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProspectSelector
              selectedProspect={selectedProspect}
              onProspectSelect={handleProspectSelect}
              compact={false}
              showStakeholders={true}
              prospectList={filteredProspects}
            />
          )}

          {/* Email Stats */}
          {selectedProspect && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center justify-center">
                      <Badge
                        variant={
                          pushStatus === "success"
                            ? "default"
                            : pushStatus === "pending"
                            ? "secondary"
                            : pushStatus === "error"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {pushStatus === "success" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {pushStatus === "pending" && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {pushStatus === "error" && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {pushStatus === "draft" ? "Draft" : pushStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Word Count
                    </p>
                    <p className="font-medium">
                      {emailContent.split(/\s+/).filter(Boolean).length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Template ID</span>
                    <span className="font-medium">
                      {selectedProspect.email_template_id
                        ? selectedProspect.email_template_id.substring(0, 8) +
                          "..."
                        : "Not saved"}
                    </span>
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
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.open(
                      `mailto:${selectedProspect.prospect_details?.[0]?.email || ""}?subject=${encodeURIComponent(
                        emailSubject
                      )}&body=${encodeURIComponent(emailContent)}`,
                      "_blank"
                    );
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open in Email Client
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    toast.info("Coming soon: Email template library");
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Email Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProspect ? (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg font-semibold">
                    Email for {selectedProspect.companyName}
                  </CardTitle>
                  <Badge
                    variant={
                      pushStatus === "success"
                        ? "default"
                        : pushStatus === "pending"
                        ? "secondary"
                        : pushStatus === "error"
                        ? "destructive"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {pushStatus === "success" && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {pushStatus === "pending" && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    {pushStatus === "error" && (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {pushStatus === "draft" ? "Draft" : pushStatus}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEmail}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateEmail}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1" />
                        )}
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={handlePushToHubSpot}
                        disabled={
                          pushStatus === "pending" || pushStatus === "success"
                        }
                      >
                        {pushStatus === "pending" ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-1" />
                        )}
                        Push to HubSpot
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Subject Line */}
                <div className="space-y-2">
                  <label
                    htmlFor="email-subject"
                    className="text-sm font-medium"
                  >
                    Subject Line
                  </label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      !isEditing && "bg-muted cursor-default focus:ring-0"
                    )}
                  />
                </div>

                {/* Email Content */}
                <div className="space-y-2">
                  <label
                    htmlFor="email-content"
                    className="text-sm font-medium"
                  >
                    Email Content
                  </label>
                  {isEditing ? (
                    <Textarea
                      id="email-content"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="min-h-[300px] font-mono"
                    />
                  ) : (
                    <div className="border border-border rounded-lg p-4 min-h-[300px] whitespace-pre-line bg-muted">
                      {emailContent || (
                        <div className="text-center text-muted-foreground py-8">
                          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="mb-2">No email content yet</p>
                          <p className="text-sm">
                            Click "Regenerate" to create an email based on call
                            insights
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Preview */}
                {!isEditing && emailContent && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">
                      Personalization Preview
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Prospect Name
                        </Badge>
                        <span className="text-sm">
                          {selectedProspect.prospect_details?.[0]?.name ||
                            "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          Company
                        </Badge>
                        <span className="text-sm">
                          {selectedProspect.companyName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          Pain Points
                        </Badge>
                        <span className="text-sm">
                          {selectedProspect.sales_insights?.[0]?.content ||
                            "Not identified"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No Prospect Selected
                </h3>
                <p className="text-muted-foreground mb-4">
                  {prospects.length === 0
                    ? "No prospects available. Process some call transcripts first to generate email templates."
                    : "Select a prospect from the sidebar to generate a personalized follow-up email."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;