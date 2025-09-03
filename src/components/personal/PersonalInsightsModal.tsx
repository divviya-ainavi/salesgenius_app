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

  // Initialize form data when modal opens
  useEffect(() => {
    if (data && data.length > 0) {
      const insights = data[0]; // Take first item from array
      setFormData({
        repName: insights.repName || "",
        roleTitle: insights.roleTitle || "",
        territory: insights.territory || "",
        verticalFocus: insights.verticalFocus || [],
        quota: insights.quota || "",
        timeHorizon: insights.timeHorizon || "",
        activePipeline: insights.activePipeline || [],
        personalProofBank: insights.personalProofBank || [],
        relationshipCapital: insights.relationshipCapital || [],
        sellingStyleStrengths: insights.sellingStyleStrengths || [],
        commonObjectionsEncountered: insights.commonObjectionsEncountered || [],
        preferredAdvancePerAccount: insights.preferredAdvancePerAccount || "",
        availabilityWindows: insights.availabilityWindows || [],
        productCertifications: insights.productCertifications || [],
        brandVoiceTone: insights.brandVoiceTone || "",
        sources: insights.sources || [],
        summaryNote: insights.summaryNote || "",
      });
    }
  }, [data]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field, value) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  const handleArrayRemove = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
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
          {formData[field].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
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
                if (e.key === 'Enter') {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Personal Insights</span>
          </DialogTitle>
          <DialogDescription>
            Review and edit your personal sales insights generated from uploaded files.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="selling-style">Selling Style</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
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
                      value={formData.repName}
                      onChange={(e) => handleInputChange('repName', e.target.value)}
                      placeholder="Enter representative name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-title">Role Title</Label>
                    <Input
                      id="role-title"
                      value={formData.roleTitle}
                      onChange={(e) => handleInputChange('roleTitle', e.target.value)}
                      placeholder="Enter role title"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="territory">Territory</Label>
                  <Input
                    id="territory"
                    value={formData.territory}
                    onChange={(e) => handleInputChange('territory', e.target.value)}
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
                    value={formData.summaryNote}
                    onChange={(e) => handleInputChange('summaryNote', e.target.value)}
                    placeholder="Enter summary note"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
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
                      value={formData.quota}
                      onChange={(e) => handleInputChange('quota', e.target.value)}
                      placeholder="Enter quota information"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-horizon">Time Horizon</Label>
                    <Input
                      id="time-horizon"
                      value={formData.timeHorizon}
                      onChange={(e) => handleInputChange('timeHorizon', e.target.value)}
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
                  icon={Target}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Relationships & Network</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ArrayEditor
                  field="relationshipCapital"
                  label="Relationship Capital"
                  placeholder="Add relationship contact"
                  icon={Users}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Selling Style Tab */}
          <TabsContent value="selling-style" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Selling Style & Approach</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ArrayEditor
                  field="sellingStyleStrengths"
                  label="Selling Style Strengths"
                  placeholder="Add selling strength"
                  icon={Target}
                />

                <div className="space-y-2">
                  <Label htmlFor="preferred-advance">Preferred Advance Per Account</Label>
                  <Textarea
                    id="preferred-advance"
                    value={formData.preferredAdvancePerAccount}
                    onChange={(e) => handleInputChange('preferredAdvancePerAccount', e.target.value)}
                    placeholder="Enter preferred advance strategy"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-voice">Brand Voice & Tone</Label>
                  <Textarea
                    id="brand-voice"
                    value={formData.brandVoiceTone}
                    onChange={(e) => handleInputChange('brandVoiceTone', e.target.value)}
                    placeholder="Enter brand voice and tone"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objections Tab */}
          <TabsContent value="objections" className="space-y-4">
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
          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Availability & Scheduling</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ArrayEditor
                  field="availabilityWindows"
                  label="Availability Windows"
                  placeholder="Add availability window"
                  icon={Calendar}
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
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Save Personal Insights
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};