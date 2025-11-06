import { DealCard, DealStage } from "@/types/pipeline";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { StakeholderMap } from "./StakeholderMap";
import {
  Mail,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Ban,
  Building2,
  ExternalLink,
  FileText,
  Save,
  Lightbulb,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface DealDrawerProps {
  deal: DealCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (
    dealId: string,
    status: "closed-won" | "closed-lost"
  ) => void;
  onUpdateDeal?: (deal: DealCard) => void;
  onTriggerStageChange?: (deal: DealCard, newStage: DealStage) => void;
}

export const DealDrawer = ({
  deal,
  open,
  onOpenChange,
  onStatusChange,
  onUpdateDeal,
  onTriggerStageChange,
}: DealDrawerProps) => {
  const navigate = useNavigate();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState("");
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Reset local state when deal changes
  useEffect(() => {
    if (deal) {
      setLocalNotes(deal.notes || "");
      setIsEditingNotes(false);
      setIsEditingInsights(false);
      setIsAddingActivity(false);
    }
  }, [deal?.id]);

  const handleSaveNotes = () => {
    if (deal && onUpdateDeal) {
      onUpdateDeal({ ...deal, notes: localNotes, updatedAt: new Date() });
    }
    setIsEditingNotes(false);
  };

  const formatStageName = (stage: DealStage) => {
    const stageNames: Record<DealStage, string> = {
      leads: "Leads",
      "appointment-set": "Appointment Set",
      qualified: "Qualified",
      presentation: "Discovery",
      "proposal-sent": "Proposal Sent",
      "negotiation-started": "Negotiation Started",
    };
    return stageNames[stage];
  };

  if (!deal) return null;

  const isAppointmentStage =
    deal.stage === "appointment-set" || deal.stage === "qualified";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const healthColors = {
    healthy: "bg-green-50 text-green-700 border-green-300",
    "at-risk": "bg-amber-50 text-amber-700 border-amber-300",
    stalled: "bg-red-50 text-red-700 border-red-300",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {deal.companyLogo ? (
                <img
                  src={deal.companyLogo}
                  alt={deal.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-2xl">{deal.companyName}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {deal.contactName} • {deal.contactTitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(deal.value)}
                </p>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border font-medium",
                    healthColors[deal.health]
                  )}
                >
                  {deal.health}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Last Interaction */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Last Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {deal.lastInteraction.type === "call" && (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                    {deal.lastInteraction.type === "email" && (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                    {deal.lastInteraction.type === "meeting" && (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                    {deal.lastInteraction.type === "demo" && (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {deal.lastInteraction.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(deal.lastInteraction.date, "MMMM dd, yyyy")}
                    </p>
                    <p className="text-sm mt-2">
                      {deal.lastInteraction.summary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Confidence & Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  AI Confidence & Deal Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Confidence Score
                  </span>
                  <ConfidenceBadge confidence={deal.confidence} size="md" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Engagement Score
                  </span>
                  <span className="font-medium">
                    🔥 {deal.engagementScore}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Days Since Activity
                  </span>
                  <span className="font-medium">
                    {deal.daysSinceLastActivity} days
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision Makers</CardTitle>
              </CardHeader>
              <CardContent>
                <StakeholderMap stakeholders={deal.stakeholders} />
              </CardContent>
            </Card>

            {/* Pain Points */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Pain Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {deal.painPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 mt-0.5">⚠️</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Objections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-600" />
                  Objections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {deal.objections.map((objection, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 mt-0.5">🚫</span>
                      <span>{objection}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* AI Nudge */}
            {deal.aiNudge && !deal.aiNudge.dismissed && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base">AI Suggestion</CardTitle>
                    </div>
                    <ConfidenceBadge
                      confidence={deal.aiNudge.confidence}
                      size="sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Ready to move to{" "}
                      {formatStageName(deal.aiNudge.suggestedStage)}
                    </p>
                    <p className="text-sm text-blue-700">
                      {deal.aiNudge.reason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        if (onTriggerStageChange) {
                          onTriggerStageChange(
                            deal,
                            deal.aiNudge!.suggestedStage
                          );
                        }
                      }}
                    >
                      Move Deal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onUpdateDeal) {
                          const updated = {
                            ...deal,
                            aiNudge: { ...deal.aiNudge!, dismissed: true },
                          };
                          onUpdateDeal(updated);
                        }
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suggested{" "}
                    {formatDistanceToNow(deal.aiNudge.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pre-Meeting Research or Next Best Move */}
            {isAppointmentStage && deal.researchSummary ? (
              <Card className="border-purple-300 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Pre-Meeting Research
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:text-purple-700"
                      onClick={() =>
                        navigate(
                          `/research?company=${encodeURIComponent(
                            deal.companyName
                          )}`
                        )
                      }
                    >
                      View Full Research
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Company Overview
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {deal.researchSummary.companyOverview}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recent News</h4>
                    <ul className="space-y-1">
                      {deal.researchSummary.recentNews
                        .slice(0, 3)
                        .map((news, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-purple-600 mt-0.5">📰</span>
                            <span>{news}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Key Talking Points
                    </h4>
                    <ul className="space-y-1">
                      {deal.researchSummary.talkingPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-purple-600 mt-0.5">💡</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {format(deal.researchSummary.lastUpdated, "MMM dd, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ) : deal.status === "active" && deal.nextBestMove ? (
              <Card className="border-[hsl(var(--peregrine-blue))] bg-[hsl(var(--peregrine-blue))]/5">
                <CardHeader>
                  <CardTitle className="text-base">🎯 Next Best Move</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {deal.nextBestMove.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {deal.nextBestMove.rationale}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: {format(deal.nextBestMove.dueDate, "MMMM dd, yyyy")}
                    </span>
                    <span
                      className={cn(
                        "ml-auto px-2 py-1 rounded-full text-xs font-medium",
                        deal.nextBestMove.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : deal.nextBestMove.priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {deal.nextBestMove.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Quick Actions */}
            {deal.status === "active" && onStatusChange && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                  onClick={() => onStatusChange(deal.id, "closed-won")}
                >
                  Mark as Won
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => onStatusChange(deal.id, "closed-lost")}
                >
                  Mark as Lost
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Prep Qs
              </Button>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Stakeholders
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Win Probability Factors
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>
                      ✓ Strong champion identified (
                      {
                        deal.stakeholders.find((s) => s.role === "champion")
                          ?.name
                      }
                      )
                    </li>
                    <li>✓ Budget confirmed with decision maker</li>
                    <li>✓ Technical requirements aligned</li>
                    <li>⚠ Implementation timeline needs clarification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Deal Velocity</h4>
                  <p className="text-sm text-muted-foreground">
                    This deal is progressing{" "}
                    {deal.confidence > 75 ? "faster" : "slower"} than average
                    for this stage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Discovery call completed
                  </p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                  <p className="text-sm mt-1">
                    Discussed technical requirements and integration needs
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Follow-up email sent</p>
                  <p className="text-xs text-muted-foreground">5 days ago</p>
                  <p className="text-sm mt-1">
                    Shared case study and ROI analysis
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Deal Notes & Timeline
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditingNotes) {
                      handleSaveNotes();
                    } else {
                      setIsEditingNotes(true);
                    }
                  }}
                >
                  {isEditingNotes ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  ) : (
                    "Edit"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Add notes... Stage movements will appear here automatically."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {deal.notes ? (
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                        {deal.notes}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No notes yet. Stage movements will be logged here
                        automatically.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm text-muted-foreground">
                    No files uploaded yet
                  </p>
                  <Button variant="outline" className="mt-4">
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
