import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Lightbulb,
  Save,
  Edit,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BusinessKnowledgeData {
  organizationName: string;
  staticSupplyElements: {
    coreBusinessOffering: string;
    valueProposition: string;
    marketPosition: string;
    competitiveAdvantages: string[];
    productsServicesPortfolio: string[];
    fundamentalProblemSolved: string;
  };
  dynamicSupplyElements: {
    currentAdaptationsPivots: string[];
    responseToTrends: string[];
    activePromotionsCampaigns: string[];
    seasonalTacticalAdjustments: string[];
  };
  offerDefinition: {
    dreamOutcome: string;
    painProblem: string;
    proofDifferentiator: string;
  };
  prizingAndObjections: {
    prizeCriteria: string;
    lowStatusTriggers: string[];
    commonProspectAssumptions: string[];
  };
  ICP: {
    championPersona: string;
    economicBuyerPersona: string;
    antiPersona: string;
    keyMetricsOrKPIs: string[];
  };
  reframeNarratives: {
    unseenProblem: string;
    ahaMoment: string;
    contrarianView: string;
  };
  salesMethodology: {
    methodologyUsed: string;
    keyQualificationInfo: string;
    goToClosingTechnique: string;
  };
  brandVoiceGuidelines: string;
  assetsDetected: string[];
  sources: string[];
  summaryNote: string;
}

interface BusinessKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BusinessKnowledgeData | null;
  onSave: (data: BusinessKnowledgeData) => void;
}

export const BusinessKnowledgeModal: React.FC<BusinessKnowledgeModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
}) => {
  const [editedData, setEditedData] = useState<BusinessKnowledgeData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (data) {
      setEditedData(JSON.parse(JSON.stringify(data))); // Deep clone
    }
  }, [data]);

  const handleInputChange = (path: string, value: string | string[]) => {
    if (!editedData) return;

    const pathArray = path.split('.');
    const newData = JSON.parse(JSON.stringify(editedData));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setEditedData(newData);
  };

  const handleArrayItemChange = (path: string, index: number, value: string) => {
    if (!editedData) return;

    const pathArray = path.split('.');
    const newData = JSON.parse(JSON.stringify(editedData));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    const array = current[pathArray[pathArray.length - 1]];
    if (Array.isArray(array)) {
      array[index] = value;
    }
    
    setEditedData(newData);
  };

  const handleAddArrayItem = (path: string) => {
    if (!editedData) return;

    const pathArray = path.split('.');
    const newData = JSON.parse(JSON.stringify(editedData));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    const array = current[pathArray[pathArray.length - 1]];
    if (Array.isArray(array)) {
      array.push('');
    }
    
    setEditedData(newData);
  };

  const handleRemoveArrayItem = (path: string, index: number) => {
    if (!editedData) return;

    const pathArray = path.split('.');
    const newData = JSON.parse(JSON.stringify(editedData));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    const array = current[pathArray[pathArray.length - 1]];
    if (Array.isArray(array)) {
      array.splice(index, 1);
    }
    
    setEditedData(newData);
  };

  const handleSave = async () => {
    if (!editedData) return;

    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
      toast.success("Business knowledge updated successfully!");
    } catch (error) {
      console.error("Error saving business knowledge:", error);
      toast.error("Failed to save business knowledge");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setEditedData(JSON.parse(JSON.stringify(data)));
    }
    setIsEditing(false);
  };

  const renderArrayField = (
    title: string,
    path: string,
    items: string[],
    placeholder: string = "Enter item..."
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem(path)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Input
                  value={item}
                  onChange={(e) => handleArrayItemChange(path, index, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveArrayItem(path, index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-start space-x-2 w-full">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground flex-1">{item}</p>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && !isEditing && (
          <p className="text-sm text-muted-foreground italic">No items available</p>
        )}
      </div>
    </div>
  );

  const renderTextField = (
    title: string,
    path: string,
    value: string,
    multiline: boolean = false,
    placeholder: string = ""
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      {isEditing ? (
        multiline ? (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px]"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {value || "Not specified"}
        </p>
      )}
    </div>
  );

  if (!editedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Business Knowledge Profile</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {editedData.organizationName}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Review and edit your organization's business knowledge profile extracted from uploaded documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="core">Core Business</TabsTrigger>
            <TabsTrigger value="dynamic">Market Dynamics</TabsTrigger>
            <TabsTrigger value="offer">Value Offer</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
            <TabsTrigger value="icp">Target Customers</TabsTrigger>
            <TabsTrigger value="methodology">Sales Process</TabsTrigger>
          </TabsList>

          {/* Core Business Tab */}
          <TabsContent value="core" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Core Business Elements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Core Business Offering",
                  "staticSupplyElements.coreBusinessOffering",
                  editedData.staticSupplyElements.coreBusinessOffering,
                  true,
                  "Describe your main business offering..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Value Proposition",
                  "staticSupplyElements.valueProposition",
                  editedData.staticSupplyElements.valueProposition,
                  true,
                  "What unique value do you provide..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Market Position",
                  "staticSupplyElements.marketPosition",
                  editedData.staticSupplyElements.marketPosition,
                  true,
                  "How are you positioned in the market..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Fundamental Problem Solved",
                  "staticSupplyElements.fundamentalProblemSolved",
                  editedData.staticSupplyElements.fundamentalProblemSolved,
                  true,
                  "What core problem do you solve..."
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Advantages</CardTitle>
              </CardHeader>
              <CardContent>
                {renderArrayField(
                  "Key Advantages",
                  "staticSupplyElements.competitiveAdvantages",
                  editedData.staticSupplyElements.competitiveAdvantages,
                  "Enter competitive advantage..."
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products & Services Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {renderArrayField(
                  "Products/Services",
                  "staticSupplyElements.productsServicesPortfolio",
                  editedData.staticSupplyElements.productsServicesPortfolio,
                  "Enter product or service..."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Dynamics Tab */}
          <TabsContent value="dynamic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Market Dynamics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderArrayField(
                  "Current Adaptations & Pivots",
                  "dynamicSupplyElements.currentAdaptationsPivots",
                  editedData.dynamicSupplyElements.currentAdaptationsPivots,
                  "Enter adaptation or pivot..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Response to Market Trends",
                  "dynamicSupplyElements.responseToTrends",
                  editedData.dynamicSupplyElements.responseToTrends,
                  "Enter trend response..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Active Promotions & Campaigns",
                  "dynamicSupplyElements.activePromotionsCampaigns",
                  editedData.dynamicSupplyElements.activePromotionsCampaigns,
                  "Enter promotion or campaign..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Seasonal Tactical Adjustments",
                  "dynamicSupplyElements.seasonalTacticalAdjustments",
                  editedData.dynamicSupplyElements.seasonalTacticalAdjustments,
                  "Enter seasonal adjustment..."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Value Offer Tab */}
          <TabsContent value="offer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Value Offer Definition</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Dream Outcome",
                  "offerDefinition.dreamOutcome",
                  editedData.offerDefinition.dreamOutcome,
                  true,
                  "What's the ideal outcome for customers..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Pain & Problem",
                  "offerDefinition.painProblem",
                  editedData.offerDefinition.painProblem,
                  true,
                  "What pain points do you address..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Proof & Differentiator",
                  "offerDefinition.proofDifferentiator",
                  editedData.offerDefinition.proofDifferentiator,
                  true,
                  "What proves you're different and better..."
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Reframe Narratives</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Unseen Problem",
                  "reframeNarratives.unseenProblem",
                  editedData.reframeNarratives.unseenProblem,
                  true,
                  "What problem do prospects not realize they have..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Aha Moment",
                  "reframeNarratives.ahaMoment",
                  editedData.reframeNarratives.ahaMoment,
                  true,
                  "What insight creates the 'aha' moment..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Contrarian View",
                  "reframeNarratives.contrarianView",
                  editedData.reframeNarratives.contrarianView,
                  true,
                  "What contrarian perspective do you offer..."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objections Tab */}
          <TabsContent value="objections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Pricing & Objections</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Prize Criteria",
                  "prizingAndObjections.prizeCriteria",
                  editedData.prizingAndObjections.prizeCriteria,
                  true,
                  "What criteria determine success..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Low Status Triggers",
                  "prizingAndObjections.lowStatusTriggers",
                  editedData.prizingAndObjections.lowStatusTriggers,
                  "Enter status trigger..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Common Prospect Assumptions",
                  "prizingAndObjections.commonProspectAssumptions",
                  editedData.prizingAndObjections.commonProspectAssumptions,
                  "Enter prospect assumption..."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Target Customers Tab */}
          <TabsContent value="icp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Ideal Customer Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Champion Persona",
                  "ICP.championPersona",
                  editedData.ICP.championPersona,
                  true,
                  "Who champions your solution internally..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Economic Buyer Persona",
                  "ICP.economicBuyerPersona",
                  editedData.ICP.economicBuyerPersona,
                  true,
                  "Who makes the buying decision..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Anti-Persona",
                  "ICP.antiPersona",
                  editedData.ICP.antiPersona,
                  true,
                  "Who is NOT a good fit..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Key Metrics & KPIs",
                  "ICP.keyMetricsOrKPIs",
                  editedData.ICP.keyMetricsOrKPIs,
                  "Enter metric or KPI..."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Process Tab */}
          <TabsContent value="methodology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Sales Methodology</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderTextField(
                  "Methodology Used",
                  "salesMethodology.methodologyUsed",
                  editedData.salesMethodology.methodologyUsed,
                  false,
                  "e.g., SPIN, Challenger, MEDDIC..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Key Qualification Information",
                  "salesMethodology.keyQualificationInfo",
                  editedData.salesMethodology.keyQualificationInfo,
                  true,
                  "How do you qualify prospects..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Go-To Closing Technique",
                  "salesMethodology.goToClosingTechnique",
                  editedData.salesMethodology.goToClosingTechnique,
                  true,
                  "What's your primary closing approach..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Brand Voice Guidelines",
                  "brandVoiceGuidelines",
                  editedData.brandVoiceGuidelines,
                  true,
                  "Describe your brand voice and tone..."
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assets & Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderArrayField(
                  "Assets Detected",
                  "assetsDetected",
                  editedData.assetsDetected,
                  "Enter asset description..."
                )}
                
                <Separator />
                
                {renderArrayField(
                  "Sources",
                  "sources",
                  editedData.sources,
                  "Enter source..."
                )}
                
                <Separator />
                
                {renderTextField(
                  "Summary Note",
                  "summaryNote",
                  editedData.summaryNote,
                  true,
                  "Overall summary of the business knowledge..."
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};