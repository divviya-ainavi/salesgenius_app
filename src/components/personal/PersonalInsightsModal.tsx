import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle,
  X,
  Briefcase,
  Clock,
  Award,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const PersonalInsightsModal = ({
  isOpen,
  onClose,
  personalInsights,
  onSave,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [editedData, setEditedData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edited data when modal opens
  useEffect(() => {
    if (personalInsights && isOpen) {
      setEditedData({
        repName: personalInsights.repName || "",
        roleTitle: personalInsights.roleTitle || "",
        territory: personalInsights.territory || "",
        verticalFocus: personalInsights.verticalFocus || [],
        quota: personalInsights.quota || "",
        timeHorizon: personalInsights.timeHorizon || "",
        activePipeline: personalInsights.activePipeline || [],
        personalProofBank: personalInsights.personalProofBank || [],
        relationshipCapital: personalInsights.relationshipCapital || [],
        sellingStyleStrengths: personalInsights.sellingStyleStrengths || [],
        commonObjectionsEncountered: personalInsights.commonObjectionsEncountered || [],
        preferredAdvancePerAccount: personalInsights.preferredAdvancePerAccount || "",
        availabilityWindows: personalInsights.availabilityWindows || [],
        productCertifications: personalInsights.productCertifications || [],
        brandVoiceTone: personalInsights.brandVoiceTone || "",
        summaryNote: personalInsights.summaryNote || "",
      });
      setHasChanges(false);
    }
  }, [personalInsights, isOpen]);

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleArrayInputChange = (field, value) => {
    const arrayValue = value
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    handleInputChange(field, arrayValue);
  };

  const handleSave = async () => {
    try {
      await onSave(editedData);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Error saving personal insights:", error);
      toast.error("Failed to save personal insights");
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderTextareaField = (field, label, placeholder, multiline = true) => {
    const value = Array.isArray(editedData[field])
      ? editedData[field].join("\n")
      : editedData[field] || "";

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) =>
              Array.isArray(editedData[field])
                ? handleArrayInputChange(field, e.target.value)
                : handleInputChange(field, e.target.value)
            }
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
          />
        ) : (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] resize-none"
            rows={2}
          />
        )}
      </div>
    );
  };

  if (!personalInsights) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Sales Insights</span>
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review and edit your personalized sales profile and insights
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <TooltipProvider>
            <TabsList className="grid w-full grid-cols-6 flex-shrink-0 bg-muted p-1 rounded-lg">
              <TabsTrigger value="profile" className="w-full">
                <User className="w-4 h-4 mr-1.5" />
                Profile
              </TabsTrigger>
              
              <TabsTrigger value="performance" className="w-full">
                <Target className="w-4 h-4 mr-1.5" />
                Performance
              </TabsTrigger>
              
              <TabsTrigger value="relationships" className="w-full">
                <Users className="w-4 h-4 mr-1.5" />
                Relationships
              </TabsTrigger>
              
              <TabsTrigger value="selling" className="w-4 h-4 mr-1.5" className="w-full">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Selling Style
              </TabsTrigger>
              
              <TabsTrigger value="objections" className="w-full">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Objections
              </TabsTrigger>
              
              <TabsTrigger value="availability" className="w-full">
                <Clock className="w-4 h-4 mr-1.5" />
                Availability
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  {renderTextareaField(
                    "repName",
                    "Representative Name",
                    "Enter your full name",
                    false
                  )}
                  {renderTextareaField(
                    "roleTitle",
                    "Role & Title",
                    "Enter your role and title",
                    false
                  )}
                </div>
                
                {renderTextareaField(
                  "territory",
                  "Territory",
                  "Describe your sales territory or region"
                )}
                
                {renderTextareaField(
                  "verticalFocus",
                  "Vertical Focus Areas",
                  "List your industry verticals or focus areas (one per line)"
                )}
                
                {renderTextareaField(
                  "summaryNote",
                  "Summary Note",
                  "Overall summary of your sales profile and approach"
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  {renderTextareaField(
                    "quota",
                    "Sales Quota",
                    "Describe your sales targets and quotas",
                    false
                  )}
                  {renderTextareaField(
                    "timeHorizon",
                    "Time Horizon",
                    "Typical sales cycle length and planning horizon",
                    false
                  )}
                </div>
                
                {renderTextareaField(
                  "activePipeline",
                  "Active Pipeline",
                  "List your current active deals and opportunities (one per line)"
                )}
                
                {renderTextareaField(
                  "personalProofBank",
                  "Personal Proof Bank",
                  "List your success stories, case studies, and achievements (one per line)"
                )}
                
                {renderTextareaField(
                  "productCertifications",
                  "Product Certifications",
                  "List your certifications and qualifications (one per line)"
                )}
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-4 mt-0">
                {renderTextareaField(
                  "relationshipCapital",
                  "Relationship Capital",
                  "List your key relationships, champions, and network contacts (one per line)"
                )}
              </TabsContent>

              {/* Selling Style Tab */}
              <TabsContent value="selling" className="space-y-4 mt-0">
                {renderTextareaField(
                  "sellingStyleStrengths",
                  "Selling Style Strengths",
                  "List your key selling strengths and approaches (one per line)"
                )}
                
                {renderTextareaField(
                  "preferredAdvancePerAccount",
                  "Preferred Advance Strategy",
                  "Describe your preferred approach for advancing accounts"
                )}
                
                {renderTextareaField(
                  "brandVoiceTone",
                  "Brand Voice & Tone",
                  "Describe your communication style and brand voice"
                )}
              </TabsContent>

              {/* Objections Tab */}
              <TabsContent value="objections" className="space-y-4 mt-0">
                {renderTextareaField(
                  "commonObjectionsEncountered",
                  "Common Objections",
                  "List common objections you encounter and how you handle them (one per line)"
                )}
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-4 mt-0">
                {renderTextareaField(
                  "availabilityWindows",
                  "Availability Windows",
                  "List your typical availability patterns and scheduling preferences (one per line)"
                )}
              </TabsContent>
            </div>
          </TooltipProvider>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};