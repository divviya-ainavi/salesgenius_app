import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Building,
  User,
  Target,
  Lightbulb,
  FileText,
  CheckSquare,
  AlertTriangle,
  Plus,
  TrendingUp,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from 'dompurify';
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSelector } from "react-redux";
import { config } from "@/lib/config";

interface ResearchFormData {
  companyName: string;
  companyWebsite: string;
  prospectLinkedIn: string[]; // make it an array
}

interface ResearchResult {
  companyName: string;
  companyOverview: string;
  sector: string;
  size: string;
  geographicScope: string;
  natureOfBusiness: string;
  keyPositioning: string;
  growthOpportunities: string[];
  marketTrends: string[];
  summaryNote: string;
  sources: string[];
  recommendations: any;
}

const Research = () => {
  usePageTimer("Research");

  const [currentView, setCurrentView] = useState<"form" | "results">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ResearchFormData>({
    companyName: "",
    companyWebsite: "",
    prospectLinkedIn: [""], // initialize with one empty field
  });

  const [researchResult, setResearchResult] = useState<ResearchResult | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("analysis");
  const [prospectInCRM, setProspectInCRM] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  // Form validation
  const isFormValid =
    formData.companyName.trim() !== "" && formData.companyWebsite.trim() !== "";

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Extract prospect name from LinkedIn URL
  const extractProspectNameFromLinkedInUrl = (linkedInUrl: string): string => {
    try {
      // Extract the username part from LinkedIn URL
      const urlPattern = /linkedin\.com\/in\/([^\/\?]+)/i;
      const match = linkedInUrl.match(urlPattern);

      if (match && match[1]) {
        const username = match[1];
        // Convert hyphenated username to proper name format
        // e.g., "john-doe-smith" becomes "John Doe Smith"
        const formattedName = username
          .split("-")
          .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .join(" ");

        return formattedName;
      }

      // Fallback if pattern doesn't match
      return "This Prospect";
    } catch (error) {
      // Fallback for any parsing errors
      return "This Prospect";
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ResearchFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Mock research data generation
  const generateMockResearch = (data: ResearchFormData): ResearchResult => {
    const companyAnalysis = `**Company Overview**

${data.companyName} is a technology company that has established itself as a significant player in its market segment. Based on our analysis of their digital presence and public information, the company demonstrates strong market positioning with a focus on innovation and customer-centric solutions.¹

**Financial Snapshot**

The company shows indicators of healthy growth with expanding market presence and strategic investments in technology infrastructure. Recent funding rounds and partnership announcements suggest positive momentum in their business trajectory.²

**Competitive Landscape**

${data.companyName} operates in a competitive environment where differentiation through technology and customer experience is crucial. They appear to be positioning themselves as a premium solution provider with emphasis on quality and reliability.³

**Business Challenges**

Like many companies in their sector, ${data.companyName} likely faces challenges around scaling operations, maintaining competitive advantage, and adapting to rapidly changing market conditions. Digital transformation and customer acquisition appear to be key focus areas.⁴

**Key Leadership Profiles**

The leadership team demonstrates experience in scaling technology companies with backgrounds spanning product development, sales, and strategic partnerships. Their approach suggests a data-driven culture with emphasis on measurable outcomes.⁵`;

    // Extract prospect name and create personalized analysis
    const prospectName = data.prospectLinkedIn
      ? extractProspectNameFromLinkedInUrl(data.prospectLinkedIn)
      : "";

    const prospectAnalysis = data.prospectLinkedIn
      ? `

---

**${prospectName} - Deep Dive Analysis**

Based on the LinkedIn profile analysis, ${prospectName} appears to be a decision-maker with significant influence over technology purchasing decisions. Their background suggests they value innovative solutions that can demonstrate clear ROI.⁶

**Professional Background**

${prospectName} has a track record of implementing strategic initiatives and driving organizational change. Their experience indicates they understand the importance of technology in achieving business objectives.⁷

**Key Drivers & Motivations**

This individual likely prioritizes solutions that can scale with their organization and provide measurable business impact. ${prospectName} appears to value partnerships with vendors who can provide strategic guidance beyond just product delivery.⁸

**Communication Style & Personality**

Based on their professional presence, ${prospectName} prefers direct, data-driven conversations with clear value propositions. They likely appreciate consultative approaches that demonstrate deep understanding of their business challenges.⁹`
      : "";

    const sources = [
      `${data.companyWebsite} - Company website and corporate information`,
      "Industry reports and market analysis from leading research firms",
      "Competitive intelligence from public filings and press releases",
      "Technology sector analysis and growth projections",
      "Leadership team profiles from professional networks",
      ...(data.prospectLinkedIn
        ? [
            `${data.prospectLinkedIn} - LinkedIn professional profile`,
            "Professional background and career progression analysis",
            "Industry connections and engagement patterns",
            "Communication style analysis from public posts and interactions",
          ]
        : []),
    ];

    const recommendations = `**Primary Meeting Goal**

Position your solution as a strategic enabler that can help ${data.companyName} achieve their growth objectives while addressing their specific operational challenges. Focus on demonstrating measurable ROI and scalability.

**Key Talking Points**

• Emphasize how your solution addresses the specific challenges identified in their market segment
• Highlight case studies from similar companies that have achieved significant results
• Discuss your company's track record of successful implementations and ongoing support
• Present a clear value proposition that aligns with their business priorities

**High-Impact Questions to Ask**

• "What are your top three business priorities for the next 12 months?"
• "How are you currently measuring success in [relevant area]?"
• "What challenges have you faced with previous technology implementations?"
• "What would need to happen for this to be considered a successful partnership?"

**Anticipated Objections**

• **Budget concerns**: Be prepared to discuss flexible pricing models and ROI timelines
• **Implementation complexity**: Highlight your proven implementation methodology and support resources
• **Integration challenges**: Demonstrate your platform's compatibility and integration capabilities
• **Vendor reliability**: Provide references and case studies that showcase long-term partnerships

**Meeting Preparation Checklist**

• Prepare 2-3 relevant case studies with quantifiable results
• Research their recent company announcements or press releases
• Identify potential integration points with their existing technology stack
• Prepare questions that demonstrate understanding of their industry challenges`;

    return {
      companyAnalysis: companyAnalysis + prospectAnalysis,
      sources,
      recommendations,
    };
  };

  // Handle form submission
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!isFormValid) return;

  //   setIsLoading(true);

  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 2000));

  //   const result = generateMockResearch(formData);
  //   setResearchResult(result);
  //   setCurrentView('results');
  //   setIsLoading(false);

  //   toast.success(`Research completed for ${formData.companyName}`);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.companyResearch}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // body: JSON.stringify({
          //   companyName: formData.companyName,
          //   companyUrl: formData.companyWebsite,
          //   prospectUrl: formData.prospectLinkedIn,
          // }),
          body: JSON.stringify({
            companyName: formData.companyName,
            companyUrl: formData.companyWebsite,
            prospectUrl: formData.prospectLinkedIn.filter(
              (url) => url.trim() !== ""
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const result = data[0]?.output;

      // if (!result || !result.companyAnalysis) {
      //   throw new Error("Invalid response format");
      // }

      const output = result.output || result;

      setResearchResult({
        companyName: output.companyName || formData.companyName,
        companyOverview: output.companyOverview || "",
        sector: output.sector || "",
        size: output.size || "",
        geographicScope: output.geographicScope || "",
        natureOfBusiness: output.natureOfBusiness || "",
        keyPositioning: output.keyPositioning || "",
        growthOpportunities: output.growthOpportunities || [],
        marketTrends: output.marketTrends || [],
        summaryNote: output.summaryNote || "",
        sources: output.sources || [],
        recommendations: output.recommendations || {},
      });

      await dbHelpers.saveResearchCompany({
        user_id: user?.id,
        company_name: formData.companyName,
        company_url: formData.companyWebsite,
        prospect_urls: formData.prospectLinkedIn.filter(
          (url) => url.trim() !== ""
        ),
        company_analysis: output.companyOverview,
        prospect_analysis: "",
        sources: output.sources || [],
        recommendations: JSON.stringify(output.recommendations || {}),
        summary_note: output.summaryNote || "",
        market_trends: output.marketTrends || [],
        growth_opportunities: output.growthOpportunities || [],
        key_positioning: output.keyPositioning || "",
        nature_of_business: output.natureOfBusiness || "",
        geographic_scope: output.geographicScope || "",
        size: output.size || "",
        sector: output.sector || "",
      });

      setCurrentView("results");
      toast.success(`Research completed for ${formData.companyName}`);
    } catch (error) {
      console.error("Research API Error:", error);
      toast.error(error.message || "Failed to fetch research. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new research
  const handleNewResearch = () => {
    setCurrentView("form");
    setFormData({
      companyName: "",
      companyWebsite: "",
      prospectLinkedIn: [""],
    });
    setResearchResult(null);
    setActiveTab("analysis");
    setProspectInCRM(false);
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!researchResult) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(researchResult, null, 2)
      );
      toast.success("Analysis copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Handle push to HubSpot
  const handlePushToHubSpot = () => {
    toast.success("Research pushed to HubSpot successfully");
    setProspectInCRM(true);
  };

  const handleProspectLinkedInChange = (index: number, value: string) => {
    const updatedProspects = [...formData.prospectLinkedIn];
    updatedProspects[index] = value;
    setFormData((prev) => ({
      ...prev,
      prospectLinkedIn: updatedProspects,
    }));
  };

  const addProspectField = () => {
    setFormData((prev) => ({
      ...prev,
      prospectLinkedIn: [...prev.prospectLinkedIn, ""],
    }));
  };

  const removeProspectField = (index: number) => {
    const updated = [...formData.prospectLinkedIn];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      prospectLinkedIn: updated,
    }));
  };

  // Render form view
  if (currentView === "form") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Research</h1>
          <p className="text-muted-foreground">
            Get comprehensive analysis and insights for your sales outreach
          </p>
        </div>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Company & Prospect Research</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium">
                    Company Name *
                  </label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Company Website */}
                <div className="space-y-2">
                  <label
                    htmlFor="companyWebsite"
                    className="text-sm font-medium"
                  >
                    Company Website URL *
                  </label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    placeholder="e.g., https://www.salesgenius.ai"
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      handleInputChange("companyWebsite", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Prospect LinkedIn */}
                {/* <div className="space-y-2">
                  <label
                    htmlFor="prospectLinkedIn"
                    className="text-sm font-medium"
                  >
                    Prospect LinkedIn URL
                  </label>
                  <Input
                    id="prospectLinkedIn"
                    type="url"
                    placeholder="e.g., https://www.linkedin.com/in/username"
                    value={formData.prospectLinkedIn}
                    onChange={(e) =>
                      handleInputChange("prospectLinkedIn", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add for personalized prospect analysis
                  </p>
                </div> */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "grey" }}
                  >
                    Prospect LinkedIn URLs
                  </label>

                  {formData.prospectLinkedIn.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="url"
                        disabled
                        placeholder="https://www.linkedin.com/in/username"
                        value={url}
                        onChange={(e) =>
                          handleProspectLinkedInChange(index, e.target.value)
                        }
                      />
                      {formData.prospectLinkedIn.length > 1 && (
                        <Button
                          disabled
                          type="button"
                          variant="ghost"
                          onClick={() => removeProspectField(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    disabled
                    type="button"
                    variant="outline"
                    onClick={addProspectField}
                  >
                    + Add Another Prospect
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Optional: Add for personalized prospect analysis
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Research
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render results view
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Fixed Top Bar */}
      <div className="bg-background border-b border-border p-6">
        <div className="flex items-center justify-between">
          {/* Left: Page Title */}
          <h1 className="text-2xl font-bold text-foreground">Research</h1>

          {/* Middle: Tab Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 max-w-md mx-8"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="analysis"
                className="flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span>Company Analysis</span>
              </TabsTrigger>
              <TabsTrigger
                value="source"
                className="flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Source</span>
              </TabsTrigger>
              <TabsTrigger
                value="recommendation"
                className="flex items-center space-x-1"
              >
                <Target className="w-4 h-4" />
                <span>Recommendations</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right: Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Prospect in CRM:</span>
              <Switch
                checked={prospectInCRM}
                onCheckedChange={setProspectInCRM}
              />
              <span className="text-sm text-muted-foreground">
                {prospectInCRM ? "On" : "Off"}
              </span>
            </div>
            <Button variant="outline" onClick={handleNewResearch}>
              <Plus className="w-4 h-4 mr-1" />
              New Research
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === "analysis" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>{researchResult?.companyName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Company Overview */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Company Overview
                      </h3>                      <p className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(researchResult?.companyOverview || '') }} />
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Sector</h4>
                          <Badge variant="outline" className="text-xs">
                            {researchResult?.sector}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Company Size
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.size}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Geographic Scope
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.geographicScope}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Nature of Business
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.natureOfBusiness}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Key Positioning
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.keyPositioning}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Growth Opportunities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Growth Opportunities
                      </h3>
                      <ul className="space-y-2">
                        {researchResult?.growthOpportunities?.map(
                          (opportunity, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >                              
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground leading-relaxed">
                                {opportunity}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* Market Trends */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Market Trends
                      </h3>
                      <ul className="space-y-2">
                        {researchResult?.marketTrends?.map((trend, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {trend}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Summary Note */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Summary Note
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(researchResult?.summaryNote || '') }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interaction Bar */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                {!prospectInCRM && (
                  <Button onClick={handlePushToHubSpot} disabled={true}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Push to HubSpot
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === "source" && (
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {researchResult?.sources &&
                researchResult.sources.length > 0 ? (
                  <ol className="space-y-2 list-decimal list-inside">
                    {researchResult.sources.map((source, index) => (
                      <li key={index} className="text-sm leading-relaxed">
                        {source}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sources available for this research</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "recommendation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Sales Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Primary Meeting Goal */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Primary Meeting Goal
                    </h3>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">
                        {DOMPurify.sanitize(researchResult?.recommendations?.primaryMeetingGoal || '')}
                      </p>
                    </div>
                  </div>

                  {/* Key Talking Points */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Key Talking Points
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.keyTalkingPoints?.map(
                        (point, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {point}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* High-Impact Sales Questions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      High-Impact Sales Questions
                    </h3>
                    <div className="space-y-2">
                      {researchResult?.recommendations?.highImpactSalesQuestions?.map(
                        (question, index) => (
                          <Collapsible key={index}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-3 h-auto text-left"
                                onClick={() => toggleQuestion(index)}
                              >
                                <span className="text-sm font-medium">
                                  Q{index + 1}: {DOMPurify.sanitize(question.substring(0, 60))}...
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 transition-transform",
                                    expandedQuestions.includes(index) &&
                                      "rotate-180"
                                  )}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question) }}>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {question}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      )}
                    </div>
                  </div>

                  {/* Anticipated Objections */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Anticipated Objections
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.anticipatedObjections?.map(
                        (objection, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {objection}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Meeting Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Meeting Preparation Checklist
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.meetingChecklist?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >                            
                            <div className="w-4 h-4 border border-muted-foreground rounded mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {item}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Research;
export { Research };
