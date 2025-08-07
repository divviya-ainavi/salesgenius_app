import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Building,
  User,
  Calendar,
  DollarSign,
  Phone,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Sparkles,
  MessageSquare,
  CheckSquare,
  Presentation,
  Mail,
  ExternalLink,
  Copy,
  Edit,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import { useSelector } from "react-redux";

// Mock prospects data
const mockProspects = [
  {
    id: "renegade_revops",
    companyName: "Renegade RevOps",
    peoplesName: "Haja J Deen, Tom Mallens",
    status: "new",
    calls: 1,
    dealValue: "TBD",
    lastEngagement: "6/8/2025",
    opportunity: "SalesGenius",
    people: [
      { name: "Haja J Deen", title: "CEO" },
      { name: "Tom Mallens", title: "CTO" },
    ],
  },
  {
    id: "buynomics",
    companyName: "Buynomics",
    peoplesName: "Tom Van de Beek, Viktor Nikolov, Haja J Deen",
    status: "new",
    calls: 1,
    dealValue: "TBD",
    lastEngagement: "6/8/2025",
    opportunity: "SalesGenius",
    people: [
      { name: "Tom Van de Beek", title: "VP Sales" },
      { name: "Viktor Nikolov", title: "Director" },
      { name: "Haja J Deen", title: "Advisor" },
    ],
  },
  {
    id: "marketing_centre",
    companyName: "The Marketing Centre",
    peoplesName: "Haja J Deen, David, Ian, Abhishek Choudhury, Jed, Ian Webb, David Fenton, Gerard Leigh",
    status: "new",
    calls: 4,
    dealValue: "TBD",
    lastEngagement: "6/8/2025",
    opportunity: "SalesGenius",
    people: [
      { name: "Haja J Deen", title: "Consultant" },
      { name: "David", title: "Manager" },
      { name: "Ian", title: "Director" },
      { name: "Abhishek Choudhury", title: "Lead" },
    ],
  },
  {
    id: "acme_corp",
    companyName: "Acme Corp Demo",
    peoplesName: "Tom, Emily White, Mark Johnson, Sarah Chen",
    status: "new",
    calls: 2,
    dealValue: "TBD",
    lastEngagement: "6/8/2025",
    opportunity: "Enterprise Solution",
    people: [
      { name: "Tom", title: "CEO" },
      { name: "Emily White", title: "VP Sales" },
      { name: "Mark Johnson", title: "CTO" },
      { name: "Sarah Chen", title: "Director" },
    ],
  },
  {
    id: "tech_innovations",
    companyName: "Tech Innovations Ltd",
    peoplesName: "Alex Smith, Maria Garcia, John Doe",
    status: "warm",
    calls: 3,
    dealValue: "$50K",
    lastEngagement: "6/7/2025",
    opportunity: "Digital Transformation",
    people: [
      { name: "Alex Smith", title: "CEO" },
      { name: "Maria Garcia", title: "CTO" },
      { name: "John Doe", title: "VP Engineering" },
    ],
  },
  {
    id: "global_solutions",
    companyName: "Global Solutions Inc",
    peoplesName: "Jennifer Lee, Robert Brown, Lisa Wang",
    status: "hot",
    calls: 5,
    dealValue: "$120K",
    lastEngagement: "6/6/2025",
    opportunity: "Platform Integration",
    people: [
      { name: "Jennifer Lee", title: "President" },
      { name: "Robert Brown", title: "VP Technology" },
      { name: "Lisa Wang", title: "Director of Operations" },
    ],
  },
];

export const CallInsights = () => {
  usePageTimer("Call Insights");

  const [selectedProspect, setSelectedProspect] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [prospects, setProspects] = useState([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);
  const [activeTab, setActiveTab] = useState("insights");
  
  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const CARDS_PER_VIEW = 4;

  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  const userId = CURRENT_USER.id;

  // Load prospects
  useEffect(() => {
    const fetchProspects = async () => {
      if (!userId) {
        setIsLoadingProspects(false);
        return;
      }

      setIsLoadingProspects(true);
      try {
        const insights = await dbHelpers.getProspectData(userId);
        
        const enrichedProspects = await Promise.all(
          (insights || [])
            .filter((x) => x.communication_style_ids != null)
            .map(async (insight) => {
              const people = await dbHelpers.getPeopleByProspectId(
                insight.id,
                user?.id
              );

              return {
                id: insight.id,
                companyName: insight.company?.name || "Unknown Company",
                peoplesName:
                  (insight.prospect_details || [])
                    .map((p) => p.name)
                    .join(", ") || "Unknown",
                title:
                  (insight.prospect_details || [])
                    .map((p) => p.title)
                    .join(", ") || "Unknown",
                prospect_details: insight.prospect_details || [],
                people,
                status: "new",
                dealValue: "TBD",
                probability: 50,
                nextAction: "Initial follow-up",
                created_at: insight.created_at,
                sales_insights: insight.sales_insights || [],
                call_summary: insight.call_summary,
                action_items: insight.action_items || [],
                name: insight?.name,
                calls: insight.calls || 1,
                lastEngagement: new Date(insight.created_at).toLocaleDateString(),
                opportunity: insight.name || "Sales Opportunity",
              };
            })
        );

        // Use mock data if no real prospects found
        const finalProspects = enrichedProspects.length > 0 ? enrichedProspects : mockProspects;
        setProspects(finalProspects);
        
        if (finalProspects.length > 0) {
          setSelectedProspect(finalProspects[0]);
        }
      } catch (err) {
        console.error("Failed to load prospects:", err);
        // Use mock data as fallback
        setProspects(mockProspects);
        setSelectedProspect(mockProspects[0]);
      } finally {
        setIsLoadingProspects(false);
      }
    };

    fetchProspects();
  }, [userId]);

  // Filter prospects based on search
  const filteredProspects = prospects.filter(
    (prospect) =>
      prospect.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.peoplesName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset carousel index when filtered prospects change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredProspects.length, searchTerm]);

  // Smooth scroll to current index
  useEffect(() => {
    if (carouselRef.current && filteredProspects.length > CARDS_PER_VIEW) {
      const cardWidth = carouselRef.current.scrollWidth / filteredProspects.length;
      const scrollPosition = currentIndex * cardWidth;
      
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, filteredProspects.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredProspects.length <= CARDS_PER_VIEW) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredProspects.length]);

  const handleNext = () => {
    const maxIndex = Math.max(0, filteredProspects.length - CARDS_PER_VIEW);
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cold":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate carousel metrics
  const maxIndex = Math.max(0, filteredProspects.length - CARDS_PER_VIEW);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const totalPages = Math.ceil(filteredProspects.length / CARDS_PER_VIEW);
  const currentPage = Math.floor(currentIndex / CARDS_PER_VIEW) + 1;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Call Insights</h1>
          <p className="text-muted-foreground">
            AI-generated insights and analysis from your sales calls
          </p>
        </div>
      </div>

      {/* Prospect Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Prospect Selection</span>
            {filteredProspects.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredProspects.length} prospects
              </Badge>
            )}
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

          {/* Prospects Carousel */}
          {isLoadingProspects ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading prospects...</p>
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No prospects found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search terms" : "Process some call transcripts to see prospects here"}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Carousel Container */}
              <div className="relative overflow-hidden">
                <div
                  ref={carouselRef}
                  className={cn(
                    "flex transition-transform duration-300 ease-in-out",
                    filteredProspects.length <= CARDS_PER_VIEW ? "gap-4" : "gap-4"
                  )}
                  style={{
                    transform: filteredProspects.length > CARDS_PER_VIEW 
                      ? `translateX(-${currentIndex * (100 / CARDS_PER_VIEW)}%)` 
                      : 'none'
                  }}
                >
                  {filteredProspects.map((prospect) => (
                    <div
                      key={prospect.id}
                      className={cn(
                        "flex-shrink-0 transition-all duration-200",
                        filteredProspects.length <= CARDS_PER_VIEW 
                          ? "flex-1 min-w-0" 
                          : "w-1/4"
                      )}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:shadow-md h-full",
                          selectedProspect?.id === prospect.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleProspectSelect(prospect)}
                      >
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">
                                {prospect.companyName}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {prospect.peoplesName}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs ml-2 flex-shrink-0", getStatusColor(prospect.status))}
                            >
                              {prospect.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-xs text-muted-foreground flex-1">
                            <div className="flex justify-between">
                              <span>Calls:</span>
                              <span className="font-medium">{prospect.calls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deal Value:</span>
                              <span className="font-medium">{prospect.dealValue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last Engagement:</span>
                              <span className="font-medium">{prospect.lastEngagement}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Opportunity:</span>
                              <span className="font-medium truncate">{prospect.opportunity}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows - Only show when more than 4 cards */}
              {filteredProspects.length > CARDS_PER_VIEW && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-10",
                      "bg-background/95 backdrop-blur-sm shadow-lg border-border",
                      "hover:bg-accent hover:border-primary/50 transition-all duration-200",
                      !canGoPrev && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    aria-label="Previous prospects"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-10",
                      "bg-background/95 backdrop-blur-sm shadow-lg border-border",
                      "hover:bg-accent hover:border-primary/50 transition-all duration-200",
                      !canGoNext && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleNext}
                    disabled={!canGoNext}
                    aria-label="Next prospects"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Carousel Indicators - Only show when more than 4 cards */}
              {filteredProspects.length > CARDS_PER_VIEW && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <span className="text-xs text-muted-foreground mr-2">
                    {currentIndex + 1}-{Math.min(currentIndex + CARDS_PER_VIEW, filteredProspects.length)} of {filteredProspects.length}
                  </span>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-200",
                          Math.floor(currentIndex / CARDS_PER_VIEW) === i
                            ? "bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                        onClick={() => setCurrentIndex(i * CARDS_PER_VIEW)}
                        aria-label={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {selectedProspect ? (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Selected Prospect Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Prospect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{selectedProspect.companyName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProspect.peoplesName}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusColor(selectedProspect.status))}
                      >
                        {selectedProspect.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calls:</span>
                      <span className="font-medium">{selectedProspect.calls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deal Value:</span>
                      <span className="font-medium">{selectedProspect.dealValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Engagement:</span>
                      <span className="font-medium">{selectedProspect.lastEngagement}</span>
                    </div>
                  </div>

                  {/* Key Stakeholders */}
                  {selectedProspect.people && selectedProspect.people.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="text-sm font-medium mb-2">Key Stakeholders</h4>
                      <div className="space-y-1">
                        {selectedProspect.people.slice(0, 4).map((person, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate">{person.name}</span>
                            <span className="text-muted-foreground ml-2">{person.title}</span>
                          </div>
                        ))}
                        {selectedProspect.people.length > 4 && (
                          <p className="text-xs text-muted-foreground">
                            +{selectedProspect.people.length - 4} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Insights Tabs */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="insights" className="flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Insights</span>
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Summary</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center space-x-1">
                  <CheckSquare className="w-4 h-4" />
                  <span>Actions</span>
                </TabsTrigger>
                <TabsTrigger value="follow-up" className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>Follow-up</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Key Insights for {selectedProspect.companyName}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Strong interest in automation and efficiency solutions</li>
                          <li>• Budget approval process involves multiple stakeholders</li>
                          <li>• Previous experience with similar tools was positive</li>
                          <li>• Timeline for implementation is Q2 2025</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Call Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Productive call with {selectedProspect.companyName} team. Discussed current challenges 
                        with their sales process and how our solution can address their specific needs. 
                        Key stakeholders are aligned on the value proposition and next steps have been identified.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Action Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Send product demo video by Friday</span>
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                          High
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Schedule technical deep-dive with team</span>
                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                          Medium
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="follow-up" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up Email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Subject: Follow-up on our conversation</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>Hi {selectedProspect.people?.[0]?.name || 'there'},</p>
                          <p>
                            Thank you for taking the time to discuss your sales process challenges with us today. 
                            I'm excited about the opportunity to help {selectedProspect.companyName} achieve 
                            your growth objectives.
                          </p>
                          <p>Best regards,<br />Your Sales Team</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Prospect Selected</h3>
            <p className="text-muted-foreground">
              Select a prospect from above to view their insights and analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CallInsights;