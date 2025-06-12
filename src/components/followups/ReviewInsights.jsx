import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Target,
  MessageSquare,
  Search,
  TrendingUp,
  Heart,
  CheckSquare,
  Lightbulb,
  Star,
  Eye,
  Ear,
  Hand,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";

// Insight type configurations with icons and colors
const insightTypes = {
  prospect_mention: {
    icon: MessageSquare,
    label: "Prospect Mention",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Specific items mentioned by prospect",
  },
  research_insight: {
    icon: Search,
    label: "Research Insight",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Insights from prior research",
  },
  agreed_action: {
    icon: CheckSquare,
    label: "Agreed Action",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Actions agreed during call",
  },
  sales_signal: {
    icon: TrendingUp,
    label: "Sales Signal",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Sentiment and buying signals",
  },
  opportunity: {
    icon: Target,
    label: "Opportunity",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Sales opportunities identified",
  },
  user_insight: {
    icon: Lightbulb,
    label: "Your Insight",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Your personal insights",
  },
  communication_style: {
    icon: Eye,
    label: "Communication Style",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    description: "Visual/Auditory/Kinesthetic preferences",
  },
};

// Mock insights data with different types and relevance scores
const mockInsights = [
  {
    id: "1",
    type: "prospect_mention",
    content:
      "Prospect mentioned they are evaluating 3 vendors and need to make a decision by end of Q1. Budget is approved for $50K annually.",
    relevance_score: 95,
    is_selected: true,
    source: "AI Analysis",
    timestamp: "15:23",
  },
  {
    id: "2",
    type: "agreed_action",
    content:
      "Agreed to provide technical integration documentation and schedule demo with their engineering team next Tuesday.",
    relevance_score: 90,
    is_selected: true,
    source: "Call Transcript",
    timestamp: "28:45",
    owner: "Sarah Johnson",
    deadline: "2024-01-23",
  },
  {
    id: "3",
    type: "communication_style",
    content:
      "Primary decision maker (Sarah Johnson) shows strong visual learning preference - frequently asked for charts and visual data during call. Recommend including infographics and ROI dashboards in follow-up.",
    relevance_score: 88,
    is_selected: true,
    source: "Communication Analysis",
    timestamp: "Throughout call",
  },
  {
    id: "4",
    type: "sales_signal",
    content:
      'Strong positive sentiment when discussing ROI potential. Prospect used phrases like "exactly what we need" and "this could solve our biggest problem".',
    relevance_score: 87,
    is_selected: true,
    source: "Sentiment Analysis",
    timestamp: "22:10",
  },
  {
    id: "5",
    type: "research_insight",
    content:
      "Company recently raised Series B funding ($15M) and is expanding their sales team by 200%. Perfect timing for our sales automation solution.",
    relevance_score: 85,
    is_selected: true,
    source: "Company Research",
    timestamp: "Pre-call",
  },
  {
    id: "6",
    type: "communication_style",
    content:
      "Sales Operations Manager (Mike Chen) demonstrates kinesthetic learning style - asked multiple questions about hands-on implementation and requested live demo. Include practical examples in follow-up.",
    relevance_score: 83,
    is_selected: true,
    source: "Communication Analysis",
    timestamp: "18:30",
  },
  {
    id: "7",
    type: "opportunity",
    content:
      "Prospect mentioned pain point with current manual lead scoring process taking 2-3 hours daily. Our solution could save 15+ hours per week.",
    relevance_score: 82,
    is_selected: true,
    source: "AI Analysis",
    timestamp: "12:30",
  },
  {
    id: "8",
    type: "prospect_mention",
    content:
      "Current contract with competitor expires in 6 months. They are not happy with support response times and lack of customization options.",
    relevance_score: 80,
    is_selected: false,
    source: "Call Transcript",
    timestamp: "35:20",
  },
  {
    id: "9",
    type: "sales_signal",
    content:
      "Decision maker confirmed - no additional stakeholders needed for approval. Prospect has full authority to make purchasing decisions.",
    relevance_score: 78,
    is_selected: true,
    source: "AI Analysis",
    timestamp: "18:45",
  },
];

export const ReviewInsights = ({
  onSaveInsights,
  initialInsights = mockInsights,
  callNotesId,
  userId = CURRENT_USER.id,
  callAnalysisData = null,
  hideActionItems = false, // New prop to hide action items
}) => {
  const [insights, setInsights] = useState(initialInsights);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newInsight, setNewInsight] = useState({
    content: "",
    type: "user_insight",
  });
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const handleToggleSelect = (id) => {
    const updatedInsights = insights.map((insight) =>
      insight.id === id
        ? { ...insight, is_selected: !insight.is_selected }
        : insight
    );
    setInsights(updatedInsights);
    onSaveInsights?.(updatedInsights);
  };

  const handleMoveUp = (id) => {
    const currentIndex = insights.findIndex((insight) => insight.id === id);
    if (currentIndex > 0) {
      const newInsights = [...insights];
      const temp = newInsights[currentIndex];
      newInsights[currentIndex] = newInsights[currentIndex - 1];
      newInsights[currentIndex - 1] = temp;

      // Update relevance scores to reflect new order
      newInsights[currentIndex - 1].relevance_score = Math.min(
        100,
        newInsights[currentIndex - 1].relevance_score + 1
      );
      newInsights[currentIndex].relevance_score = Math.max(
        0,
        newInsights[currentIndex].relevance_score - 1
      );

      setInsights(newInsights);
      onSaveInsights?.(newInsights);
      toast.success("Insight priority updated");
    }
  };

  const handleMoveDown = (id) => {
    const currentIndex = insights.findIndex((insight) => insight.id === id);
    if (currentIndex < insights.length - 1) {
      const newInsights = [...insights];
      const temp = newInsights[currentIndex];
      newInsights[currentIndex] = newInsights[currentIndex + 1];
      newInsights[currentIndex + 1] = temp;

      // Update relevance scores to reflect new order
      newInsights[currentIndex].relevance_score = Math.min(
        100,
        newInsights[currentIndex].relevance_score + 1
      );
      newInsights[currentIndex + 1].relevance_score = Math.max(
        0,
        newInsights[currentIndex + 1].relevance_score - 1
      );

      setInsights(newInsights);
      onSaveInsights?.(newInsights);
      toast.success("Insight priority updated");
    }
  };

  const handleAddInsight = async () => {
    if (!newInsight.content.trim()) return;

    const insight = {
      id: Date.now().toString(),
      type: newInsight.type,
      content: newInsight.content.trim(),
      relevance_score: 75, // Default score for user insights
      is_selected: true,
      source: "User Input",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedInsights = [...insights, insight];
    setInsights(updatedInsights);
    setNewInsight({ content: "", type: "user_insight" });
    setIsAddingNew(false);
    onSaveInsights?.(updatedInsights);

    // Save to database if callNotesId is provided
    if (callNotesId) {
      try {
        await dbHelpers.saveCallInsights(callNotesId, userId, [insight]);
        toast.success("Insight added and saved");
      } catch (error) {
        toast.error("Insight added locally but failed to save to database");
      }
    } else {
      toast.success("Insight added successfully");
    }
  };

  const handleStartEdit = (insight) => {
    setEditingId(insight.id);
    setEditContent(insight.content);
  };

  const handleSaveEdit = async () => {
    const updatedInsights = insights.map((insight) =>
      insight.id === editingId ? { ...insight, content: editContent } : insight
    );
    setInsights(updatedInsights);
    setEditingId(null);
    setEditContent("");
    onSaveInsights?.(updatedInsights);

    // Update in database if possible
    if (callNotesId) {
      try {
        const insightToUpdate = updatedInsights.find(
          (insight) => insight.id === editingId
        );
        if (insightToUpdate) {
          await dbHelpers.updateCallInsight(insightToUpdate.id, {
            content: editContent,
          });
          toast.success("Insight updated and saved");
        }
      } catch (error) {
        toast.success("Insight updated locally");
      }
    } else {
      toast.success("Insight updated");
    }
  };

  const handleDelete = (id) => {
    const updatedInsights = insights.filter((insight) => insight.id !== id);
    setInsights(updatedInsights);
    onSaveInsights?.(updatedInsights);
    toast.success("Insight removed");
  };

  const selectedCount = insights.filter(
    (insight) => insight.is_selected
  ).length;
  const totalRelevanceScore = insights
    .filter((insight) => insight.is_selected)
    .reduce((sum, insight) => sum + insight.relevance_score, 0);
  const avgRelevanceScore =
    selectedCount > 0 ? Math.round(totalRelevanceScore / selectedCount) : 0;

  // Count communication style insights
  const communicationInsights = insights.filter(
    (insight) => insight.type === "communication_style"
  );

  // Count action items
  const actionItems = insights.filter(
    (insight) => insight.type === "agreed_action"
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Review Insights
          </h2>
          <p className="text-muted-foreground">
            AI-generated insights ranked by relevance for follow-up actions
          </p>
          <div className="mt-1 text-sm text-muted-foreground">
            Analyzing as:{" "}
            <span className="font-medium">{CURRENT_USER.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {selectedCount}
            </p>
            <p className="text-sm text-muted-foreground">Selected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {avgRelevanceScore}
            </p>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </div>
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Insight
          </Button>
        </div>
      </div>

      {/* Call Analysis Overview */}
      {callAnalysisData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <User className="w-5 h-5" />
              <span>Call Analysis Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Specific User</p>
                  <p className="font-medium text-blue-900">
                    {callAnalysisData.specific_user}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Sentiment Score
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-blue-900">
                      {callAnalysisData.sentiment_score}
                    </p>
                    <Badge
                      variant={
                        callAnalysisData.sentiment_score >= 0.7
                          ? "default"
                          : callAnalysisData.sentiment_score >= 0.4
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {callAnalysisData.sentiment_score >= 0.7
                        ? "Positive"
                        : callAnalysisData.sentiment_score >= 0.4
                        ? "Neutral"
                        : "Negative"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items Section - Updated to match your reference image */}
      {!hideActionItems &&
        (actionItems.length > 0 ||
          (callAnalysisData?.action_items &&
            callAnalysisData.action_items.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5" />
                <span>Action Items</span>
                <Badge variant="secondary" className="ml-2">
                  {callAnalysisData?.action_items
                    ? callAnalysisData.action_items.length
                    : actionItems.length}{" "}
                  items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Display action items from callAnalysisData if available, otherwise from insights */}
                {callAnalysisData?.action_items
                  ? callAnalysisData.action_items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-relaxed mb-2">
                              {item.task}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              {item.owner && <span>Created: {item.owner}</span>}
                              {item.deadline && (
                                <span>Due: {item.deadline}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : actionItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-relaxed mb-2">
                              {item.content.split("\n")[0]}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              {item.owner && <span>Created: {item.owner}</span>}
                              {item.deadline && (
                                <span>Due: {item.deadline}</span>
                              )}
                              <span>Time: {item.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Communication Styles Summary */}
      {communicationInsights.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-indigo-800">
              <Eye className="w-5 h-5" />
              <span>Communication Styles Detected</span>
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-800"
              >
                {communicationInsights.length} insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-700 mb-3">
              These insights will be used to personalize email templates and
              communication approach:
            </p>
            <div className="space-y-2">
              {communicationInsights.map((insight) => (
                <div key={insight.id} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <p className="text-sm text-indigo-700">{insight.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Sales Insights</span>
            <Badge variant="secondary" className="ml-2">
              {insights.length} total
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add New Insight */}
          {isAddingNew && (
            <div className="border border-dashed border-primary rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox checked={true} disabled />
                <select
                  value={newInsight.type}
                  onChange={(e) =>
                    setNewInsight((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="px-3 py-1 border border-border rounded-md text-sm"
                >
                  {Object.entries(insightTypes).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <Badge variant="outline" className="text-xs">
                  Score: 75
                </Badge>
              </div>

              <Textarea
                value={newInsight.content}
                onChange={(e) =>
                  setNewInsight((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Enter your insight about the prospect, opportunity, or sales strategy..."
                className="min-h-20"
                autoFocus
              />

              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handleAddInsight}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Insight
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewInsight({ content: "", type: "user_insight" });
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Insights */}
          {(hideActionItems
            ? insights
            : insights.filter((insight) => insight.type !== "agreed_action")
          ).map((insight, index) => {
            const typeConfig = insightTypes[insight.type];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={insight.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-all",
                  insight.is_selected
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={insight.is_selected}
                      onCheckedChange={() => handleToggleSelect(insight.id)}
                    />

                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", typeConfig.color)}
                      >
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </Badge>

                      <Badge variant="secondary" className="text-xs">
                        Score: {insight.relevance_score}
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {insight.source} • {insight.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Move Up/Down */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(insight.id)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(insight.id)}
                      disabled={
                        index ===
                        (hideActionItems
                          ? insights.length
                          : insights.filter(
                              (insight) => insight.type !== "agreed_action"
                            ).length) -
                          1
                      }
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>

                    {/* Edit/Delete */}
                    {editingId === insight.id ? (
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEdit}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(insight)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(insight.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="ml-6">
                  {editingId === insight.id ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-20"
                    />
                  ) : (
                    <div className="space-y-2">
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          !insight.is_selected && "text-muted-foreground"
                        )}
                      >
                        {insight.content}
                      </p>

                      {/* Show owner and deadline for action items */}
                      {insight.type === "agreed_action" &&
                        (insight.owner || insight.deadline) && (
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-2 border-t border-border">
                            {insight.owner && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Owner: {insight.owner}</span>
                              </div>
                            )}
                            {insight.deadline && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {insight.deadline}</span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {insights.length === 0 && !isAddingNew && (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No insights available yet</p>
              <p className="text-sm mb-4">
                Upload a call transcript to generate AI insights
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Manual Insight
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insight Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(insightTypes).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", config.color)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
