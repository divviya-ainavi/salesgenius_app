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
  TrendingUp,
  FileText,
  Mail,
  Presentation,
  CheckSquare,
  Sparkles,
  Filter,
  SortAsc,
  Eye,
  ExternalLink,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import { useSelector } from "react-redux";

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
                name: insight?.name,
                company: insight.company,
                company_id: insight.company_id,
                people,
                calls: insight.calls || 1,
                created_at: insight.created_at,
                communication_style_ids: insight.communication_style_ids,
                call_summary: insight.call_summary,
              };
            })
        );

        setProspects(enrichedProspects);
        if (enrichedProspects.length > 0) {
          setSelectedProspect(enrichedProspects[0]);
        }
      } catch (err) {
        console.error("Failed to load prospects:", err);
        toast.error("Could not fetch prospects");
      } finally {
        setIsLoadingProspects(false);
      }
    };

    fetchProspects();
  }, [userId]);

  // Filter prospects based on search
  const filteredProspects = prospects.filter((prospect) => {
    const companyName = prospect.company?.name || "";
    const prospectNames = prospect.people?.map((p) => p.name).join(" ") || "";
    const searchLower = searchTerm.toLowerCase();
    
    return (
      companyName.toLowerCase().includes(searchLower) ||
      prospectNames.toLowerCase().includes(searchLower)
    );
  });

  // Reset carousel when prospects change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredProspects.length, searchTerm]);

  // Carousel navigation functions
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - CARDS_PER_VIEW));
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, filteredProspects.length - CARDS_PER_VIEW);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + CARDS_PER_VIEW));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.closest('.prospect-carousel')) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          handlePrevious();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          handleNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth scroll to current position
  useEffect(() => {
    if (carouselRef.current && filteredProspects.length > CARDS_PER_VIEW) {
      const cardWidth = 300 + 16; // card width + gap
      const scrollPosition = currentIndex * cardWidth;
      
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, filteredProspects.length]);

  const handleProspectSelect = (prospectData) => {
    setSelectedProspect(prospectData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "new":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate carousel metrics
  const totalPages = Math.ceil(filteredProspects.length / CARDS_PER_VIEW);
  const currentPage = Math.floor(currentIndex / CARDS_PER_VIEW) + 1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + CARDS_PER_VIEW < filteredProspects.length;

  // Dot navigation
  const handleDotClick = (pageIndex) => {
    setCurrentIndex(pageIndex * CARDS_PER_VIEW);
  };

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
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <SortAsc className="w-4 h-4 mr-1" />
            Sort
          </Button>
        </div>
      </div>

      {/* Prospect Selection Section */}
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

          {/* Loading State */}
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
            /* Prospect Carousel */
            <div className="relative prospect-carousel" tabIndex={0}>
              {/* Navigation Arrows - Only show if more than 4 cards */}
              {filteredProspects.length > CARDS_PER_VIEW && (
                <>
                  {/* Left Arrow */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg backdrop-blur-sm bg-white/90 hover:bg-white border-gray-200",
                      !canGoPrevious && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    aria-label="Previous prospects"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Right Arrow */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg backdrop-blur-sm bg-white/90 hover:bg-white border-gray-200",
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

              {/* Prospect Cards Container */}
              <div className={cn(
                filteredProspects.length <= CARDS_PER_VIEW
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "mx-8" // Add margin for arrows
              )}>
                {filteredProspects.length <= CARDS_PER_VIEW ? (
                  /* Regular Grid Layout for ≤4 cards */
                  filteredProspects.map((prospect) => {
                    const companyName = prospect.company?.name || "Unknown Company";
                    const prospectNames = prospect.people?.map((p) => p.name).filter(Boolean).join(", ") || "Unknown";
                    const titles = prospect.people?.map((p) => p.title).filter(Boolean).join(", ") || "Unknown";
                    const totalCalls = prospect?.calls;
                    const dealValue = "TBD";
                    const lastEngagement = new Date(prospect.created_at).toLocaleDateString();
                    const status = "new";

                    return (
                      <div
                        key={prospect.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                          selectedProspect?.id === prospect.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleProspectSelect({
                          id: prospect.id,
                          name: prospect?.name,
                          companyName,
                          company_id: prospect?.company_id,
                          prospectNames,
                          titles,
                          totalCalls,
                          lastCallDate: prospect.created_at,
                          lastEngagement,
                          status,
                          dealValue,
                          probability: 50,
                          nextAction: "Initial follow-up",
                          dataSources: {
                            fireflies: 1,
                            hubspot: 0,
                            presentations: 0,
                            emails: 0,
                          },
                          fullInsight: prospect,
                          calls: prospect?.calls || 1,
                          people: prospect.people,
                          call_summary: prospect?.call_summary,
                          communication_style_ids: prospect?.communication_style_ids,
                        })}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">{companyName}</h3>
                            <p className="text-xs text-muted-foreground">{prospectNames}</p>
                          </div>
                          <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
                            {status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Calls:</span>
                            <span className="font-medium">{totalCalls}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deal Value:</span>
                            <span className="font-medium">{dealValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Engagement:</span>
                            <span className="font-medium">{lastEngagement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Opportunity:</span>
                            <span className="font-medium">{prospect?.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Carousel Layout for >4 cards */
                  <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-hidden"
                    style={{
                      transform: `translateX(-${currentIndex * (300 + 16)}px)`,
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    {filteredProspects.map((prospect) => {
                      const companyName = prospect.company?.name || "Unknown Company";
                      const prospectNames = prospect.people?.map((p) => p.name).filter(Boolean).join(", ") || "Unknown";
                      const titles = prospect.people?.map((p) => p.title).filter(Boolean).join(", ") || "Unknown";
                      const totalCalls = prospect?.calls;
                      const dealValue = "TBD";
                      const lastEngagement = new Date(prospect.created_at).toLocaleDateString();
                      const status = "new";

                      return (
                        <div
                          key={prospect.id}
                          className={cn(
                            "min-w-[300px] max-w-[300px] flex-shrink-0 border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                            selectedProspect?.id === prospect.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => handleProspectSelect({
                            id: prospect.id,
                            name: prospect?.name,
                            companyName,
                            company_id: prospect?.company_id,
                            prospectNames,
                            titles,
                            totalCalls,
                            lastCallDate: prospect.created_at,
                            lastEngagement,
                            status,
                            dealValue,
                            probability: 50,
                            nextAction: "Initial follow-up",
                            dataSources: {
                              fireflies: 1,
                              hubspot: 0,
                              presentations: 0,
                              emails: 0,
                            },
                            fullInsight: prospect,
                            calls: prospect?.calls || 1,
                            people: prospect.people,
                            call_summary: prospect?.call_summary,
                            communication_style_ids: prospect?.communication_style_ids,
                          })}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-sm">{companyName}</h3>
                              <p className="text-xs text-muted-foreground">{prospectNames}</p>
                            </div>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
                              {status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Calls:</span>
                              <span className="font-medium">{totalCalls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Deal Value:</span>
                              <span className="font-medium">{dealValue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Engagement:</span>
                              <span className="font-medium">{lastEngagement}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Opportunity:</span>
                              <span className="font-medium">{prospect?.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Carousel Controls - Only show if more than 4 cards */}
              {filteredProspects.length > CARDS_PER_VIEW && (
                <div className="flex items-center justify-center mt-4 space-x-4">
                  {/* Progress Counter */}
                  <div className="text-sm text-muted-foreground">
                    {currentIndex + 1}-{Math.min(currentIndex + CARDS_PER_VIEW, filteredProspects.length)} of {filteredProspects.length}
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          currentPage === i + 1
                            ? "bg-primary"
                            : "bg-gray-300 hover:bg-gray-400"
                        )}
                        onClick={() => handleDotClick(i)}
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

      {/* Selected Prospect Details */}
      {selectedProspect && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Insights for {selectedProspect.companyName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="insights">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="summary">
                      <FileText className="w-4 h-4 mr-1" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="presentation">
                      <Presentation className="w-4 h-4 mr-1" />
                      Deck
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="insights" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
                      <p className="text-muted-foreground">
                        Detailed insights and analysis for {selectedProspect.companyName} will appear here.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Call Summary</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">
                          {selectedProspect.call_summary || "No call summary available for this prospect."}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Follow-up Email</h3>
                      <p className="text-muted-foreground">
                        AI-generated follow-up email content for {selectedProspect.companyName} will appear here.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="presentation" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Presentation Prompt</h3>
                      <p className="text-muted-foreground">
                        AI-generated presentation prompts for {selectedProspect.companyName} will appear here.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prospect Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prospect Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Company:</span>
                    <span className="text-sm font-medium">{selectedProspect.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contacts:</span>
                    <span className="text-sm font-medium">{selectedProspect.prospectNames}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Calls:</span>
                    <span className="text-sm font-medium">{selectedProspect.totalCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deal Value:</span>
                    <span className="text-sm font-medium">{selectedProspect.dealValue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Engagement:</span>
                    <span className="text-sm font-medium">{selectedProspect.lastEngagement}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in HubSpot
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallInsights;