import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  Loader2,
  Building,
  User,
  Target,
  Lightbulb,
  FileText,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";

interface ResearchFormData {
  companyName: string;
  companyWebsite: string;
  prospectLinkedIn: string;
}

interface ResearchResult {
  companyAnalysis: string;
  prospectAnalysis?: string;
  sources: string[];
  recommendations: string;
}

const Research = () => {
  usePageTimer("Research");

  const [currentView, setCurrentView] = useState<"form" | "results">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ResearchFormData>({
    companyName: "",
    companyWebsite: "",
    prospectLinkedIn: "",
  });
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("analysis");
  const [prospectInCRM, setProspectInCRM] = useState(false);

  // Form validation
  const isFormValid =
    formData.companyName.trim() !== "" && formData.companyWebsite.trim() !== "";

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
        "https://salesgenius.ainavi.co.uk/n8n/webhook/company-research",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            companyUrl: formData.companyWebsite,
            prospectUrl: formData.prospectLinkedIn,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const result = data[0]?.output;

      if (!result || !result.companyAnalysis) {
        throw new Error("Invalid response format");
      }

      setResearchResult({
        companyAnalysis:
          result.companyAnalysis +
          (result.prospectAnalysis
            ? `\n\n---\n\n${result.prospectAnalysis}`
            : ""),
        sources: result.sources || [],
        recommendations: result.recommendations || "",
      });
      await dbHelpers.saveResearchCompany({
        user_id: CURRENT_USER.id,
        company_name: formData.companyName,
        company_url: formData.companyWebsite,
        prospect_url: formData.prospectLinkedIn,
        company_analysis: result.companyAnalysis,
        prospect_analysis: result.prospectAnalysis || "",
        sources: result.sources || [],
        recommendations: result.recommendations || "",
      });

      setCurrentView("results");
      toast.success(`Research completed for ${formData.companyName}`);
    } catch (error) {
      console.error("Research API Error:", error);
      toast.error(`Failed to fetch research: ${error.message}`);
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
      prospectLinkedIn: "",
    });
    setResearchResult(null);
    setActiveTab("analysis");
    setProspectInCRM(false);
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!researchResult) return;

    try {
      await navigator.clipboard.writeText(researchResult.companyAnalysis);
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
                <div className="space-y-2">
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
                <span>Analysis</span>
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
                <span>Recommendation</span>
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
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="whitespace-pre-line leading-relaxed"
                      // dangerouslySetInnerHTML={{
                      //   __html:
                      //     researchResult?.companyAnalysis
                      //       .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      //       .replace(/¹/g, "<sup>1</sup>")
                      //       .replace(/²/g, "<sup>2</sup>")
                      //       .replace(/³/g, "<sup>3</sup>")
                      //       .replace(/⁴/g, "<sup>4</sup>")
                      //       .replace(/⁵/g, "<sup>5</sup>")
                      //       .replace(/⁶/g, "<sup>6</sup>")
                      //       .replace(/⁷/g, "<sup>7</sup>")
                      //       .replace(/⁸/g, "<sup>8</sup>")
                      //       .replace(/⁹/g, "<sup>9</sup>") || "",
                      // }}
                      dangerouslySetInnerHTML={{
                        __html:
                          researchResult?.companyAnalysis
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(
                              /^([A-Za-z\s&]+):/gm,
                              "<strong>$1:</strong>"
                            ) || "",
                      }}
                    />
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
                  <Button onClick={handlePushToHubSpot}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Push to HubSpot
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === "source" && (
            <Card>
              <CardContent className="p-6">
                <ol className="space-y-2 list-decimal list-inside">
                  {researchResult?.sources.map((source, index) => (
                    <li key={index} className="text-sm leading-relaxed">
                      {source}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {activeTab === "recommendation" && (
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-line leading-relaxed"
                    // dangerouslySetInnerHTML={{
                    //   __html:
                    //     researchResult?.recommendations.replace(
                    //       /\*\*(.*?)\*\*/g,
                    //       "<strong>$1</strong>"
                    //     ) || "",
                    // }}
                    dangerouslySetInnerHTML={{
                      __html:
                        researchResult?.recommendations
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(
                            /^([A-Za-z\s&]+):/gm,
                            "<strong>$1:</strong>"
                          ) || "",
                    }}
                  />
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
