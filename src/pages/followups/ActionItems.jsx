import React, { useState, useEffect } from "react";
import { CommitmentsCard } from "@/components/followups/CommitmentsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Calendar,
  Clock,
  User,
  CheckSquare,
  Target,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import crmService from "@/services/crmService";

// Mock data for action items based on selected prospect
const getActionItemsForProspect = (prospectId) => {
  const actionItemsData = {
    acme_corp: [
      {
        id: "1",
        commitment_text: "Send product demo video by Friday",
        is_selected: true,
        is_pushed: false,
        owner: "Sarah Johnson",
        deadline: "2024-01-19",
        priority: "high",
        source: "Call 4 - Pilot Discussion",
      },
      {
        id: "2",
        commitment_text:
          "Schedule technical deep-dive with Mike's team next week",
        is_selected: true,
        is_pushed: true,
        owner: "Mike Chen",
        deadline: "2024-01-22",
        priority: "high",
        source: "Call 3 - Technical Requirements",
      },
      {
        id: "3",
        commitment_text:
          "Prepare custom pricing proposal for Q2 implementation",
        is_selected: false,
        is_pushed: false,
        owner: "Sales Team",
        deadline: "2024-01-25",
        priority: "medium",
        source: "Call 4 - Budget Discussion",
      },
      {
        id: "4",
        commitment_text: "Provide HubSpot integration documentation",
        is_selected: true,
        is_pushed: false,
        owner: "Technical Team",
        deadline: "2024-01-20",
        priority: "high",
        source: "Call 2 - Integration Requirements",
      },
    ],
    techstart_inc: [
      {
        id: "5",
        commitment_text: "Review integration requirements with CTO",
        is_selected: true,
        is_pushed: true,
        owner: "Emma Wilson",
        deadline: "2024-01-18",
        priority: "high",
        source: "Call 2 - Technical Review",
      },
      {
        id: "6",
        commitment_text:
          "Connect with their development team for API discussion",
        is_selected: true,
        is_pushed: false,
        owner: "John Smith",
        deadline: "2024-01-21",
        priority: "medium",
        source: "Call 1 - Initial Discovery",
      },
      {
        id: "7",
        commitment_text: "Prepare startup-specific pricing model",
        is_selected: true,
        is_pushed: false,
        owner: "Sales Team",
        deadline: "2024-01-23",
        priority: "medium",
        source: "Call 2 - Budget Constraints",
      },
    ],
    global_solutions: [
      {
        id: "8",
        commitment_text: "Schedule process optimization workshop",
        is_selected: true,
        is_pushed: false,
        owner: "Emma Wilson",
        deadline: "2024-01-24",
        priority: "high",
        source: "Call 3 - Process Review",
      },
      {
        id: "9",
        commitment_text: "Provide enterprise security documentation",
        is_selected: true,
        is_pushed: true,
        owner: "David Brown",
        deadline: "2024-01-20",
        priority: "high",
        source: "Call 2 - Security Requirements",
      },
      {
        id: "10",
        commitment_text: "Create implementation timeline for Q2",
        is_selected: false,
        is_pushed: false,
        owner: "Project Team",
        deadline: "2024-01-26",
        priority: "low",
        source: "Call 1 - Timeline Discussion",
      },
    ],
  };

  return actionItemsData[prospectId] || [];
};

export const ActionItems = () => {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [pushStatus, setPushStatus] = useState("draft");
  const [prospects, setProspects] = useState([]);
  const [hubspotConnectionStatus, setHubspotConnectionStatus] = useState(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [pushResults, setPushResults] = useState({});
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Check HubSpot connection status on component mount
  useEffect(() => {
    checkHubSpotConnection();
  }, []);

  // Load action items when prospect changes
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
          action_items: insight.action_items || [],
        }));

        setProspects(enrichedProspects);
        if (enrichedProspects.length > 0) {
          setSelectedProspect(enrichedProspects[0]);
        }
      } catch (err) {
        console.error("Failed to load email insights:", err);
        toast.error("Could not fetch email insights");
      } finally {
        setIsLoadingProspects(false);
      }
    };

    fetchProspects();
  }, [userId]);

  useEffect(() => {
    if (selectedProspect?.action_items?.length) {
      console.log("if called", selectedProspect.action_items);
      const prospectCommitments = selectedProspect.action_items.map(
        (item, index) => ({
          id: `${selectedProspect.id}-${index}`,
          commitment_text: item.task || item.commitment_text || "Untitled Task",
          is_selected: true,
          is_pushed: false || item.is_pushed,
          owner: item.owner || "Unassigned",
          deadline: item.deadline || null,
          priority: item.priority || "medium",
          hubspot_task_id: item.hubspot_task_id || null,
          // source: selectedProspect.call_summary || "Call Summary",
        })
      );

      setCommitments(prospectCommitments);
      setPushStatus("draft");
      toast.success(
        `Loaded ${prospectCommitments.length} action items for ${selectedProspect.companyName}`
      );
    } else {
      setCommitments([]);
    }
  }, [selectedProspect]);

  const checkHubSpotConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const status = await crmService.getConnectionStatus("hubspot");
      setHubspotConnectionStatus(status);
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotConnectionStatus({ connected: false, error: error.message });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleUpdateCommitments = (updatedCommitments) => {
    setCommitments(updatedCommitments);
    // In real app, save to database
    toast.success(`Commitments updated for ${selectedProspect.companyName}`);
  };

  const handlePushCommitments = async (selectedCommitments) => {
    if (!hubspotConnectionStatus?.connected) {
      toast.error(
        "HubSpot is not connected. Please connect your HubSpot account first."
      );
      return;
    }

    if (selectedCommitments.length === 0) {
      toast.error("No action items selected for pushing to HubSpot");
      return;
    }

    setPushStatus("pending");
    const results = {};

    try {
      // Get or create HubSpot contact for this prospect
      const contactId = await getOrCreateHubSpotContact();

      if (!contactId) {
        throw new Error("Unable to find or create HubSpot contact");
      }

      // Push each commitment as a task to HubSpot
      for (const commitment of selectedCommitments) {
        try {
          const taskData = {
            subject: commitment.commitment_text,
            body: `Action item from sales call with ${selectedProspect.companyName}`,
            taskType: "TODO",
            status: "NOT_STARTED",
            priority: mapPriorityToHubSpot(commitment.priority),
            ownerId: null, // Will be assigned to the current user
            associations: {
              contacts: [contactId],
            },
          };

          // Add deadline if available
          if (commitment.deadline) {
            taskData.dueDate = new Date(commitment.deadline).toISOString();
          }

          const response = await crmService.hubspot.pushCommitments(
            [commitment],
            contactId
          );

          if (response.success) {
            results[commitment.id] = {
              success: true,
              hubspot_id: response.hubspot_ids?.[0] || response.hubspot_id,
            };

            // Log the successful push
            await dbHelpers.logPushAction(
              userId,
              "commitment",
              commitment.id,
              "success",
              null,
              response.hubspot_ids?.[0] || response.hubspot_id
            );
          } else {
            throw new Error(response.error || "Unknown error");
          }
        } catch (error) {
          console.error(`Error pushing commitment ${commitment.id}:`, error);
          results[commitment.id] = {
            success: false,
            error: error.message,
          };

          // Log the failed push
          await dbHelpers.logPushAction(
            userId,
            "commitment",
            commitment.id,
            "failed",
            error.message
          );
        }
      }

      // Update local state based on results
      const updatedCommitments = commitments.map((item) => {
        const result = results[item.id];
        if (result?.success) {
          return {
            ...item,
            is_pushed: true,
            hubspot_task_id: result.hubspot_id,
          };
        }
        return item;
      });

      setCommitments(updatedCommitments);
      setPushResults(results);

      // Show summary toast
      const successCount = Object.values(results).filter(
        (r) => r.success
      ).length;
      const failureCount = Object.values(results).filter(
        (r) => !r.success
      ).length;

      if (successCount > 0 && failureCount === 0) {
        setPushStatus("success");
        toast.success(
          `Successfully pushed ${successCount} action items to HubSpot as tasks`
        );
      } else if (successCount > 0 && failureCount > 0) {
        setPushStatus("partial");
        toast.warning(
          `Pushed ${successCount} action items successfully, ${failureCount} failed`
        );
      } else {
        setPushStatus("error");
        toast.error("Failed to push action items to HubSpot");
      }
    } catch (error) {
      console.error("Error pushing commitments to HubSpot:", error);
      setPushStatus("error");
      toast.error(`Failed to push commitments to HubSpot: ${error.message}`);
    }
  };

  const getOrCreateHubSpotContact = async () => {
    try {
      // In a real implementation, you would:
      // 1. Search for existing contact by email or company name
      // 2. Create a new contact if not found
      // 3. Return the contact ID

      // For now, we'll simulate this with a mock contact ID
      // In production, this would integrate with your HubSpot contact management
      return "mock-contact-id-12345";
    } catch (error) {
      console.error("Error getting/creating HubSpot contact:", error);
      throw error;
    }
  };

  const mapPriorityToHubSpot = (priority) => {
    const priorityMap = {
      high: "HIGH",
      medium: "MEDIUM",
      low: "LOW",
    };
    return priorityMap[priority] || "MEDIUM";
  };

  const totalCommitments = commitments.length;
  const selectedCount = commitments.filter((c) => c.is_selected).length;
  const pushedCount = commitments.filter((c) => c.is_pushed).length;
  const highPriorityCount = commitments.filter(
    (c) => c.priority === "high"
  ).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConnectionStatusBadge = () => {
    if (isCheckingConnection) {
      return (
        <Badge variant="outline" className="flex items-center space-x-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Checking...</span>
        </Badge>
      );
    }

    if (hubspotConnectionStatus?.connected) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          HubSpot Connected
        </Badge>
      );
    }

    return (
      <Badge
        variant="destructive"
        className="bg-red-100 text-red-800 border-red-200"
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        HubSpot Disconnected
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Action Items & Commitments
          </h1>
          <p className="text-muted-foreground">
            Manage and track commitments made during sales calls. Push selected
            items to HubSpot as tasks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {getConnectionStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={checkHubSpotConnection}
            disabled={isCheckingConnection}
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 mr-1",
                isCheckingConnection && "animate-spin"
              )}
            />
            Refresh Connection
          </Button>
        </div>
      </div>

      {/* HubSpot Connection Warning */}
      {hubspotConnectionStatus && !hubspotConnectionStatus.connected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900">
                  HubSpot Connection Required
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  To push action items to HubSpot, you need to connect your
                  HubSpot account first.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Connect HubSpot
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalCommitments}</p>
            <p className="text-xs text-muted-foreground">
              for {selectedProspect?.companyName || "No prospect selected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                High Priority
              </span>
            </div>
            <p className="text-2xl font-bold mt-1">{highPriorityCount}</p>
            <p className="text-xs text-muted-foreground">urgent actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Selected</span>
            </div>
            <p className="text-2xl font-bold mt-1">{selectedCount}</p>
            <p className="text-xs text-muted-foreground">ready to push</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Pushed to HubSpot
              </span>
            </div>
            <p className="text-2xl font-bold mt-1">{pushedCount}</p>
            <p className="text-xs text-muted-foreground">
              {totalCommitments > 0
                ? Math.round((pushedCount / totalCommitments) * 100)
                : 0}
              % completion
            </p>
          </CardContent>
        </Card>
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
                  Process some call transcripts first to generate action items
                  for prospects.
                </p>
              </CardContent>
            </Card>
          ) : (
            prospects?.length > 0 && (
              <ProspectSelector
                selectedProspect={selectedProspect}
                onProspectSelect={handleProspectSelect}
                compact={false}
                showStakeholders={true}
                prospectList={prospects}
              />
            )
          )}

          {/* Action Items Summary */}
          {selectedProspect && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Items Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Next Action:
                    </span>
                    <Badge variant="default" className="text-xs">
                      {selectedProspect.nextAction}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Deal Value:
                    </span>
                    <span className="text-sm font-medium">
                      {selectedProspect.dealValue}
                    </span>
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="pt-3 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">
                    Priority Breakdown
                  </h4>
                  <div className="space-y-2">
                    {["high", "medium", "low"].map((priority) => {
                      const count = commitments.filter(
                        (c) => c.priority === priority
                      ).length;
                      return (
                        <div
                          key={priority}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getPriorityColor(priority)
                              )}
                            >
                              {priority}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HubSpot Push Status */}
                {Object.keys(pushResults).length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">Push Results</h4>
                    <div className="space-y-1">
                      {Object.entries(pushResults).map(([id, result]) => {
                        const commitment = commitments.find((c) => c.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="truncate max-w-[120px]">
                              {commitment?.commitment_text?.substring(0, 20)}...
                            </span>
                            {result.success ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pushed
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  disabled={!hubspotConnectionStatus?.connected}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Tasks in HubSpot
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Set Reminder
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Assign to Team Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Commitments Card with prospect context */}
          {selectedProspect ? (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg font-semibold">
                    Action Items for {selectedProspect.companyName}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCount} selected
                  </Badge>
                  {pushStatus === "success" && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pushed to HubSpot
                    </Badge>
                  )}
                  {pushStatus === "partial" && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Partially Pushed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() =>
                      handlePushCommitments(
                        commitments.filter((item) => item.is_selected)
                      )
                    }
                    disabled={
                      pushStatus === "pending" ||
                      selectedCount === 0 ||
                      !hubspotConnectionStatus?.connected
                    }
                    size="sm"
                  >
                    {pushStatus === "pending" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Pushing to HubSpot...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Push {selectedCount} to HubSpot
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Enhanced Items List */}
                {commitments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-3 p-4 border border-border rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_selected}
                      onChange={() => {
                        const updatedCommitments = commitments.map((c) =>
                          c.id === item.id
                            ? { ...c, is_selected: !c.is_selected }
                            : c
                        );
                        handleUpdateCommitments(updatedCommitments);
                      }}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            !item.is_selected &&
                              "text-muted-foreground line-through"
                          )}
                        >
                          {item.commitment_text}
                        </p>
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPriorityColor(item.priority)
                            )}
                          >
                            {item.priority}
                          </Badge>
                          {item.is_pushed && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800 border-green-200"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              In HubSpot
                            </Badge>
                          )}
                          {pushResults[item.id] &&
                            !pushResults[item.id].success && (
                              <Badge
                                variant="destructive"
                                className="text-xs"
                                title={pushResults[item.id].error}
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Push Failed
                              </Badge>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>Owner: {item.owner}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {item.deadline || "No deadline"}</span>
                        </div>
                      </div>

                      {item.hubspot_task_id && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">HubSpot Task ID:</span>{" "}
                          {item.hubspot_task_id}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {commitments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">
                      No action items for {selectedProspect.companyName}
                    </p>
                    <p className="text-sm">
                      Action items will appear here after processing calls with
                      this prospect
                    </p>
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
                    ? "No prospects available. Process some call transcripts first to generate action items."
                    : "Select a prospect from the sidebar to view their action items."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
