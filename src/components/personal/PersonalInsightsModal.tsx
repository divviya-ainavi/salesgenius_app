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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  Save,
  X,
  Plus,
  Trash2,
  Award,
  Heart,
  Lightbulb,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const PersonalInsightsModal = ({ isOpen, onClose, data, onSave }) => {
  const [formData, setFormData] = useState({
    repName: "",
    roleTitle: "",
    territory: "",
    verticalFocus: [],
    quota: "",
    timeHorizon: "",
    activePipeline: [],
    personalProofBank: [],
    relationshipCapital: [],
    sellingStyleStrengths: [],
    commonObjectionsEncountered: [],
    preferredAdvancePerAccount: "",
    availabilityWindows: [],
    productCertifications: [],
    brandVoiceTone: "",
    sources: [],
    summaryNote: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (data) {
      const insights = Array.isArray(data) ? data[0] : data; // Handle both array and object
      setFormData({
        // ...insights,
        repName: insights.repName || insights.rep_name || "",
        roleTitle: insights.roleTitle || insights.role_title || "",
        territory: insights.territory || "",
        verticalFocus: insights.verticalFocus || insights.vertical_focus || [],
        quota: insights.quota || "",
        timeHorizon: insights.timeHorizon || insights.time_horizon || "",
        activePipeline:
          insights.activePipeline || insights.active_pipeline || [],
        personalProofBank:
          insights.personalProofBank || insights.personal_proof_bank || [],
        relationshipCapital:
          insights.relationshipCapital || insights.relationship_capital || [],
        sellingStyleStrengths:
          insights.sellingStyleStrengths ||
          insights.selling_style_strengths ||
          [],
        commonObjectionsEncountered:
          insights.commonObjectionsEncountered ||
          insights.common_objections_encountered ||
          [],
        preferredAdvancePerAccount:
          insights.preferredAdvancePerAccount ||
          insights.preferred_advance_per_account ||
          "",
        availabilityWindows:
          insights.availabilityWindows || insights.availability_windows || [],
        productCertifications:
          insights.productCertifications ||
          insights.product_certifications ||
          [],
        brandVoiceTone:
          insights.brandVoiceTone || insights.brand_voice_tone || "",
        sources: insights.sources || [],
        summaryNote: insights.summaryNote || insights.summary_note || "",
        id: insights?.id,
      });
    }
  }, [data]);

  console.log(formData, "check form data");
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayAdd = (field, value) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const handleArrayRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // const handleSave = () => {
  //   onSave(formData);
  // };

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      // setIsEditing(false);
      toast.success("Personal knowledge updated successfully!");
    } catch (error) {
      console.error("Error saving business knowledge:", error);
      toast.error("Failed to save business knowledge");
    } finally {
      setIsSaving(false);
    }
  };

  const ArrayEditor = ({ field, label, placeholder, icon: Icon }) => {
    const [newItem, setNewItem] = useState("");

    return (
      <div className="space-y-3">
        <Label className="flex items-center space-x-2">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </Label>

        <div className="space-y-2">
          {formData[field]?.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
            >
              <span className="flex-1 text-sm">{item}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleArrayRemove(field, index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}

          <div className="flex space-x-2">
            <Input
              placeholder={placeholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleArrayAdd(field, newItem);
                  setNewItem("");
                }
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleArrayAdd(field, newItem);
                setNewItem("");
              }}
              disabled={!newItem.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Personal Insights</span>
          </DialogTitle>
          <DialogDescription>
            Review and edit your personal sales insights generated from uploaded
            files.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0 mb-4">
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-1"
              title="Personal profile information and territory details"
            >
              <User className="w-3 h-3" />
              <span>Profile</span>
            </TabsTrigger>

            <TabsTrigger
              value="performance"
              className="flex items-center space-x-1"
              title="Quota, pipeline, and performance metrics"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Performance</span>
            </TabsTrigger>

            <TabsTrigger
              value="relationships"
              className="flex items-center space-x-1"
              title="Network connections and relationship capital"
            >
              <Heart className="w-3 h-3" />
              <span>Relationships</span>
            </TabsTrigger>

            <TabsTrigger
              value="selling-style"
              className="flex items-center space-x-1"
              title="Selling strengths, approach, and brand voice"
            >
              <Lightbulb className="w-3 h-3" />
              <span>Selling Style</span>
            </TabsTrigger>

            <TabsTrigger
              value="objections"
              className="flex items-center space-x-1"
              title="Common objections and handling strategies"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Objections</span>
            </TabsTrigger>

            <TabsTrigger
              value="availability"
              className="flex items-center space-x-1"
              title="Scheduling windows and source references"
            >
              <Clock className="w-3 h-3" />
              <span>Availability</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Profile Tab */}
            <TabsContent
              value="profile"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Personal Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rep-name">Representative Name</Label>
                      <Input
                        id="rep-name"
                        value={formData?.repName}
                        onChange={(e) =>
                          handleInputChange("repName", e.target.value)
                        }
                        placeholder="Enter representative name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-title">Role Title</Label>
                      <Input
                        id="role-title"
                        value={formData?.roleTitle}
                        onChange={(e) =>
                          handleInputChange("roleTitle", e.target.value)
                        }
                        placeholder="Enter role title"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="territory">Territory</Label>
                    <Input
                      id="territory"
                      value={formData?.territory}
                      onChange={(e) =>
                        handleInputChange("territory", e.target.value)
                      }
                      placeholder="Enter territory coverage"
                    />
                  </div>

                  <ArrayEditor
                    field="verticalFocus"
                    label="Vertical Focus"
                    placeholder="Add vertical focus area"
                    icon={Target}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="summary-note">Summary Note</Label>
                    <Textarea
                      id="summary-note"
                      value={formData?.summaryNote}
                      onChange={(e) =>
                        handleInputChange("summaryNote", e.target.value)
                      }
                      placeholder="Enter summary note"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent
              value="performance"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Performance & Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quota">Quota</Label>
                      <Input
                        id="quota"
                        value={formData?.quota}
                        onChange={(e) =>
                          handleInputChange("quota", e.target.value)
                        }
                        placeholder="Enter quota information"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time-horizon">Time Horizon</Label>
                      <Input
                        id="time-horizon"
                        value={formData?.timeHorizon}
                        onChange={(e) =>
                          handleInputChange("timeHorizon", e.target.value)
                        }
                        placeholder="Enter time horizon"
                      />
                    </div>
                  </div>

                  <ArrayEditor
                    field="activePipeline"
                    label="Active Pipeline"
                    placeholder="Add pipeline item"
                    icon={TrendingUp}
                  />

                  <ArrayEditor
                    field="personalProofBank"
                    label="Personal Proof Bank"
                    placeholder="Add proof point"
                    icon={Target}
                  />

                  <ArrayEditor
                    field="productCertifications"
                    label="Product Certifications"
                    placeholder="Add certification"
                    icon={Award}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent
              value="relationships"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Relationships & Network</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ArrayEditor
                    field="relationshipCapital"
                    label="Relationship Capital"
                    placeholder="Add relationship contact"
                    icon={Heart}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Selling Style Tab */}
            <TabsContent
              value="selling-style"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Selling Style & Approach</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ArrayEditor
                    field="sellingStyleStrengths"
                    label="Selling Style Strengths"
                    placeholder="Add selling strength"
                    icon={Lightbulb}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="preferred-advance">
                      Preferred Advance Per Account
                    </Label>
                    <Textarea
                      id="preferred-advance"
                      value={formData?.preferredAdvancePerAccount}
                      onChange={(e) =>
                        handleInputChange(
                          "preferredAdvancePerAccount",
                          e.target.value
                        )
                      }
                      placeholder="Enter preferred advance strategy"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-voice">Brand Voice & Tone</Label>
                    <Textarea
                      id="brand-voice"
                      value={formData?.brandVoiceTone}
                      onChange={(e) =>
                        handleInputChange("brandVoiceTone", e.target.value)
                      }
                      placeholder="Enter brand voice and tone"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objections Tab */}
            <TabsContent
              value="objections"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Common Objections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ArrayEditor
                    field="commonObjectionsEncountered"
                    label="Common Objections Encountered"
                    placeholder="Add common objection"
                    icon={MessageSquare}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent
              value="availability"
              className="space-y-4 mt-0 h-full overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Availability & Scheduling</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ArrayEditor
                    field="availabilityWindows"
                    label="Availability Windows"
                    placeholder="Add availability window"
                    icon={Clock}
                  />

                  <ArrayEditor
                    field="sources"
                    label="Sources"
                    placeholder="Add source reference"
                    icon={Target}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
