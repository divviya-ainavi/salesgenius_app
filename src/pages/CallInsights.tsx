import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  User,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  CheckSquare,
  Mail,
  Presentation,
  Loader2,
  Edit,
  Save,
  X,
  Users,
  Sparkles,
  FileText,
  Target,
  Lightbulb,
  BarChart3,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import { useSelector } from "react-redux";

interface Deal {
  id: string;
  companyName: string;
  peoplesName: string;
  title: string;
  status: string;
  dealValue: string;
  probability: number;
  nextAction: string;
  lastCallDate?: string;
  created_at: string;
  people: any[];
  sales_insights: any[];
  call_summary: string;
  action_items: any[];
  name: string;
}

interface CommunicationStyle {
  id: string;
  stakeholder: string;
  role: string;
  style: string;
  confidence: number;
  evidence: string;
  preferences: string[];
  communication_tips: string[];
  personality_type: string;
}

export const CallInsights = () => {
  usePageTimer("Call Insights");

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [activeTab, setActiveTab] = useState("insights");
  const [communicationStyles, setCommunicationStyles] = useState<CommunicationStyle[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  
  // Edit states for communication styles
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const { user } = useSelector((state) => state.auth);

  // Filter deals based on search term
  const filteredDeals = deals.filter(
    (deal) =>
      deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.peoplesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load deals on component mount
  useEffect(() => {
    const fetchDeals = async () => {
      if (!user?.id) {
        setIsLoadingDeals(false);
        return;
      }

      setIsLoadingDeals(true);
      try {
        const insights = await dbHelpers.getProspectData(user.id);

        const enrichedDeals = await Promise.all(
          (insights || [])
            .filter((x) => x.communication_style_ids != null)
            .map(async (insight) => {
              const people = await dbHelpers.getPeopleByProspectId(
                insight.id,
                user.id
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
              };
            })
        );

        setDeals(enrichedDeals);
        if (enrichedDeals.length > 0) {
          setSelectedDeal(enrichedDeals[0]);
        }
      } catch (err) {
        console.error("Failed to load call insights:", err);
        toast.error("Could not fetch call insights");
      } finally {
        setIsLoadingDeals(false);
      }
    };

    fetchDeals();
  }, [user?.id]);

  // Load communication styles when deal changes
  useEffect(() => {
    const loadCommunicationStyles = async () => {
      if (!selectedDeal?.id) {
        setCommunicationStyles([]);
        return;
      }

      setIsLoadingStyles(true);
      try {
        const styles = await dbHelpers.getCommunicationStylesByProspectId(selectedDeal.id);
        setCommunicationStyles(styles || []);
      } catch (error) {
        console.error("Failed to load communication styles:", error);
        toast.error("Could not load communication styles");
      } finally {
        setIsLoadingStyles(false);
      }
    };

    loadCommunicationStyles();
  }, [selectedDeal?.id]);

  const handleDealSelect = (deal: Deal) => {
    setSelectedDeal(deal);
    // Reset edit states when switching deals
    setEditingRoleId(null);
    setEditingNameId(null);
    setEditRoleValue("");
    setEditNameValue("");
  };

  // Role editing functions
  const handleStartEditRole = (style: CommunicationStyle) => {
    setEditingRoleId(style.id);
    setEditRoleValue(style.role);
    // Cancel name editing if active
    setEditingNameId(null);
    setEditNameValue("");
  };

  const handleSaveRole = async () => {
    if (!editingRoleId || !editRoleValue.trim()) {
      toast.error("Please enter a valid role");
      return;
    }

    setIsUpdatingRole(true);
    try {
      await dbHelpers.updateCommunicationStyleRole(editingRoleId, editRoleValue.trim());
      
      // Update local state
      setCommunicationStyles(prev => 
        prev.map(style => 
          style.id === editingRoleId 
            ? { ...style, role: editRoleValue.trim() }
            : style
        )
      );

      setEditingRoleId(null);
      setEditRoleValue("");
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleCancelEditRole = () => {
    setEditingRoleId(null);
    setEditRoleValue("");
  };

  // Name editing functions
  const handleStartEditName = (style: CommunicationStyle) => {
    setEditingNameId(style.id);
    setEditNameValue(style.stakeholder);
    // Cancel role editing if active
    setEditingRoleId(null);
    setEditRoleValue("");
  };

  const handleSaveName = async () => {
    if (!editingNameId || !editNameValue.trim()) {
      toast.error("Please enter a valid name");
      return;
    }

    setIsUpdatingName(true);
    try {
      await dbHelpers.updateCommunicationStyleName(editingNameId, editNameValue.trim());
      
      // Update local state
      setCommunicationStyles(prev => 
        prev.map(style => 
          style.id === editingNameId 
            ? { ...style, stakeholder: editNameValue.trim() }
            : style
        )
      );

      setEditingNameId(null);
      setEditNameValue("");
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditNameValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Call Insights & Deal Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights from your sales conversations with detailed deal analysis
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Deal Selector */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Deals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Deals List */}
              {isLoadingDeals ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading deals...</p>
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">
                    {searchTerm ? "No Deals Found" : "No Deals Processed"}
                  </p>
                  <p className="text-sm">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Deals appear here after processing call transcripts"}
                  </p>
                  {!searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => (window.location.href = "/calls")}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Go to Sales Calls
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                        selectedDeal?.id === deal.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleDealSelect(deal)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {deal.companyName}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStatusColor(deal.status))}
                        >
                          {deal.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        {deal.peoplesName} • {deal.title}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{deal.dealValue}</span>
                        <span>
                          {new Date(deal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDeal ? (
            <>
              {/* Deal Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building className="w-6 h-6 text-primary" />
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedDeal.companyName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedDeal.peoplesName} • {selectedDeal.title}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-sm", getStatusColor(selectedDeal.status))}
                    >
                      {selectedDeal.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Deal Value</p>
                        <p className="font-medium">{selectedDeal.dealValue}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Probability</p>
                        <p className="font-medium">{selectedDeal.probability}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Last Call</p>
                        <p className="font-medium">
                          {selectedDeal.lastCallDate || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Stakeholders</p>
                        <p className="font-medium">{selectedDeal.people?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Content */}
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
                  <TabsTrigger value="communication">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Communication
                  </TabsTrigger>
                  <TabsTrigger value="actions">
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDeal.sales_insights?.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDeal.sales_insights.map((insight, index) => (
                            <div
                              key={index}
                              className="border border-border rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{insight.type || "General Insight"}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {insight.relevance_score || 85}% relevance
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {insight.content || insight.insight}
                              </p>
                              {insight.source && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Source: {insight.source}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No insights available for this deal</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDeal.call_summary ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {selectedDeal.call_summary}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No call summary available for this deal</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communication" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Styles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingStyles ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                          <p className="text-muted-foreground">Loading communication styles...</p>
                        </div>
                      ) : communicationStyles.length > 0 ? (
                        <div className="space-y-4">
                          {communicationStyles.map((style) => (
                            <div
                              key={style.id}
                              className="border border-border rounded-lg p-4 space-y-3"
                            >
                              {/* Name and Role Section */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  {/* Name Editing */}
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    {editingNameId === style.id ? (
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Input
                                          value={editNameValue}
                                          onChange={(e) => setEditNameValue(e.target.value)}
                                          className="flex-1"
                                          placeholder="Enter name"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveName();
                                            if (e.key === 'Escape') handleCancelEditName();
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleSaveName}
                                          disabled={isUpdatingName}
                                        >
                                          {isUpdatingName ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Save className="w-4 h-4" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelEditName}
                                          disabled={isUpdatingName}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2 flex-1">
                                        <span className="font-medium">
                                          {style.stakeholder}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleStartEditName(style)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Role Editing */}
                                  <div className="flex items-center space-x-2">
                                    <Target className="w-4 h-4 text-muted-foreground" />
                                    {editingRoleId === style.id ? (
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Input
                                          value={editRoleValue}
                                          onChange={(e) => setEditRoleValue(e.target.value)}
                                          className="flex-1"
                                          placeholder="Enter role"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRole();
                                            if (e.key === 'Escape') handleCancelEditRole();
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleSaveRole}
                                          disabled={isUpdatingRole}
                                        >
                                          {isUpdatingRole ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Save className="w-4 h-4" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelEditRole}
                                          disabled={isUpdatingRole}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2 flex-1 group">
                                        <span className="text-sm text-muted-foreground">
                                          {style.role}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleStartEditRole(style)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    getConfidenceColor(style.confidence)
                                  )}
                                >
                                  {style.confidence}% confidence
                                </Badge>
                              </div>

                              {/* Communication Style Details */}
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-sm font-medium mb-1">Communication Style</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {style.style}
                                  </p>
                                </div>

                                {style.personality_type && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Personality Type</h5>
                                    <Badge variant="outline" className="text-xs">
                                      {style.personality_type}
                                    </Badge>
                                  </div>
                                )}

                                {style.evidence && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Evidence</h5>
                                    <p className="text-xs text-muted-foreground">
                                      {style.evidence}
                                    </p>
                                  </div>
                                )}

                                {style.preferences && style.preferences.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Preferences</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {style.preferences.map((pref, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {pref}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {style.communication_tips && style.communication_tips.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Communication Tips</h5>
                                    <ul className="space-y-1">
                                      {style.communication_tips.map((tip, index) => (
                                        <li key={index} className="text-xs text-muted-foreground flex items-start space-x-1">
                                          <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No communication styles available for this deal</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDeal.action_items?.length > 0 ? (
                        <div className="space-y-3">
                          {selectedDeal.action_items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 p-3 border border-border rounded-lg"
                            >
                              <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">
                                  {item.task || item.commitment_text}
                                </p>
                                {item.owner && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Owner: {item.owner}
                                  </p>
                                )}
                                {item.deadline && (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {new Date(item.deadline).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No action items available for this deal</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Select a Deal</h3>
                <p className="text-muted-foreground mb-4">
                  {deals.length === 0
                    ? "No deals available. Process some call transcripts first to generate insights for deals."
                    : "Select a deal from the sidebar to view their insights and analysis."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};