import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  MapPin,
  Target,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  Award,
  MessageSquare,
  FileText,
  CheckCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PersonalInsightsModal = ({ insights, onApprove, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsights, setEditedInsights] = useState(insights?.[0] || {});

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Update the insights with edited data
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInsights(insights?.[0] || {});
  };

  const handleFieldChange = (field, value) => {
    setEditedInsights((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setEditedInsights((prev) => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => (i === index ? value : item)) || [],
    }));
  };

  const addArrayItem = (field) => {
    setEditedInsights((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeArrayItem = (field, index) => {
    setEditedInsights((prev) => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || [],
    }));
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-semibold mb-2">No Insights Generated</h3>
        <p className="text-muted-foreground">
          Unable to generate personal insights from the uploaded files.
        </p>
      </div>
    );
  }

  const insightData = editedInsights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Personal Sales Insights</h3>
          <p className="text-sm text-muted-foreground">
            AI-generated insights for {insightData.repName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="territory">
            <MapPin className="w-4 h-4 mr-1" />
            Territory
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Target className="w-4 h-4 mr-1" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <Users className="w-4 h-4 mr-1" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="style">
            <MessageSquare className="w-4 h-4 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="w-4 h-4 mr-1" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Sales Representative Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  {isEditing ? (
                    <Textarea
                      value={insightData.repName || ""}
                      onChange={(e) => handleFieldChange("repName", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {insightData.repName || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Role Title</Label>
                  {isEditing ? (
                    <Textarea
                      value={insightData.roleTitle || ""}
                      onChange={(e) => handleFieldChange("roleTitle", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {insightData.roleTitle || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label>Brand Voice & Tone</Label>
                {isEditing ? (
                  <Textarea
                    value={insightData.brandVoiceTone || ""}
                    onChange={(e) => handleFieldChange("brandVoiceTone", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {insightData.brandVoiceTone || "Not specified"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Territory Tab */}
        <TabsContent value="territory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Territory & Focus Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Territory</Label>
                {isEditing ? (
                  <Textarea
                    value={insightData.territory || ""}
                    onChange={(e) => handleFieldChange("territory", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {insightData.territory || "Not specified"}
                  </p>
                )}
              </div>

              <div>
                <Label>Vertical Focus</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.verticalFocus || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("verticalFocus", index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("verticalFocus", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("verticalFocus")}
                    >
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.verticalFocus || []).map((item, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span>Performance & Pipeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quota</Label>
                  {isEditing ? (
                    <Textarea
                      value={insightData.quota || ""}
                      onChange={(e) => handleFieldChange("quota", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {insightData.quota || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Time Horizon</Label>
                  {isEditing ? (
                    <Textarea
                      value={insightData.timeHorizon || ""}
                      onChange={(e) => handleFieldChange("timeHorizon", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {insightData.timeHorizon || "Not specified"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Personal Proof Bank</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.personalProofBank || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("personalProofBank", index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("personalProofBank", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("personalProofBank")}
                    >
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.personalProofBank || []).map((item, index) => (
                      <p key={index} className="text-sm bg-gray-50 p-3 rounded-md">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Relationship Capital</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Key Relationships</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.relationshipCapital || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("relationshipCapital", index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("relationshipCapital", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("relationshipCapital")}
                    >
                      Add Relationship
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.relationshipCapital || []).map((item, index) => (
                      <p key={index} className="text-sm bg-gray-50 p-3 rounded-md">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Availability Windows</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.availabilityWindows || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("availabilityWindows", index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("availabilityWindows", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("availabilityWindows")}
                    >
                      Add Window
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.availabilityWindows || []).map((item, index) => (
                      <p key={index} className="text-sm bg-gray-50 p-3 rounded-md">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Selling Style & Approach</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selling Style Strengths</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.sellingStyleStrengths || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("sellingStyleStrengths", index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("sellingStyleStrengths", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("sellingStyleStrengths")}
                    >
                      Add Strength
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.sellingStyleStrengths || []).map((item, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Common Objections Encountered</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(insightData.commonObjectionsEncountered || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Textarea
                          value={item}
                          onChange={(e) => handleArrayFieldChange("commonObjectionsEncountered", index, e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("commonObjectionsEncountered", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("commonObjectionsEncountered")}
                    >
                      Add Objection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(insightData.commonObjectionsEncountered || []).map((item, index) => (
                      <p key={index} className="text-sm bg-gray-50 p-3 rounded-md">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Preferred Advance Per Account</Label>
                {isEditing ? (
                  <Textarea
                    value={insightData.preferredAdvancePerAccount || ""}
                    onChange={(e) => handleFieldChange("preferredAdvancePerAccount", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {insightData.preferredAdvancePerAccount || "Not specified"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span>Executive Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Summary Note</Label>
                {isEditing ? (
                  <Textarea
                    value={insightData.summaryNote || ""}
                    onChange={(e) => handleFieldChange("summaryNote", e.target.value)}
                    className="mt-1"
                    rows={8}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-4 rounded-md leading-relaxed">
                    {insightData.summaryNote || "No summary available"}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Label>Sources</Label>
                <div className="space-y-2 mt-2">
                  {(insightData.sources || []).map((source, index) => (
                    <p key={index} className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      📄 {source}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve & Save
        </Button>
      </div>
    </div>
  );
};

export default PersonalInsightsModal;