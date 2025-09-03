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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BusinessKnowledgeData {
  organization_name: string;
  static_supply_elements: {
    coreBusinessOffering: string;
    valueProposition: string;
    marketPosition: string;
    competitiveAdvantages: string[];
    productsServicesPortfolio: string[];
    fundamentalProblemSolved: string;
  };
  dynamic_supply_elements: {
    currentAdaptationsPivots: string[];
    responseToTrends: string[];
    activePromotionsCampaigns: string[];
    seasonalTacticalAdjustments: string[];
  };
  offer_definition: {
    dreamOutcome: string;
    painProblem: string;
    proofDifferentiator: string;
  };
  pricing_and_objections: {
    prizeCriteria: string;
    lowStatusTriggers: string[];
    commonProspectAssumptions: string[];
  };
  icp: {
    championPersona: string;
    economicBuyerPersona: string;
    antiPersona: string;
    keyMetricsOrKPIs: string[];
  };
  reframe_narratives: {
    unseenProblem: string;
    ahaMoment: string;
    contrarianView: string;
  };
  sales_methodology: {
    methodologyUsed: string;
    keyQualificationInfo: string;
    goToClosingTechnique: string;
  };
  brand_voice_guidelines: string;
  assets_detected: string[];
  sources: string[];
  summary_note: string;
  others?: Array<{
    title: string;
    content: string;
  }>;
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
  const [editedData, setEditedData] = useState<BusinessKnowledgeData | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  console.log(data, "check data");
  React.useEffect(() => {
    if (data) {
      setEditedData(JSON.parse(JSON.stringify(data))); // Deep clone
      setIsEditing(true);
    }
  }, [data]);

  const handleInputChange = (path: string, value: string | string[]) => {
    if (!editedData) return;

    const pathArray = path.split(".");
    const newData = JSON.parse(JSON.stringify(editedData));

    let current = newData;
    for (let i = 0; i < pathArray?.length - 1; i++) {
      current = current[pathArray?.[i]];
    }
    current[pathArray[pathArray?.length - 1]] = value;

    setEditedData(newData);
  };

  const handleArrayItemChange = (
    path: string,
    index: number,
    value: string
  ) => {
    if (!editedData) return;

    const pathArray = path.split(".");
    const newData = JSON.parse(JSON.stringify(editedData));

    let current = newData;
    for (let i = 0; i < pathArray?.length - 1; i++) {
      current = current[pathArray[i]];
    }

    const array = current[pathArray[pathArray?.length - 1]];
    if (Array.isArray(array)) {
      array[index] = value;
    }

    setEditedData(newData);
  };

  const handleAddArrayItem = (path: string) => {
    if (!editedData) return;

    const pathArray = path.split(".");
    const newData = JSON.parse(JSON.stringify(editedData));

    let current = newData;
    for (let i = 0; i < pathArray?.length - 1; i++) {
      current = current[pathArray[i]];
    }

    const array = current[pathArray[pathArray?.length - 1]];
    if (Array.isArray(array)) {
      array.push("");
    }

    setEditedData(newData);
  };

  const handleRemoveArrayItem = (path: string, index: number) => {
    if (!editedData) return;

    const pathArray = path.split(".");
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

  const handleOthersItemChange = (
    index: number,
    field: "title" | "content",
    value: string
  ) => {
    if (!editedData || !editedData.others) return;

    const newData = JSON.parse(JSON.stringify(editedData));
    newData.others[index][field] = value;
    setEditedData(newData);
  };

  const handleAddOthersItem = () => {
    if (!editedData) return;

    const newData = JSON.parse(JSON.stringify(editedData));
    if (!newData.others) {
      newData.others = [];
    }
    newData.others.push({ title: "", content: "" });
    setEditedData(newData);
  };

  const handleRemoveOthersItem = (index: number) => {
    if (!editedData || !editedData.others) return;

    const newData = JSON.parse(JSON.stringify(editedData));
    newData.others.splice(index, 1);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{title}</span>
        </Label>
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem(path)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            Add
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {items?.length > 0 &&
          items?.map((item, index) => (
            <div key={index} className="flex items-center space-x-3 group">
              {isEditing ? (
                <>
                  <Input
                    value={item}
                    onChange={(e) =>
                      handleArrayItemChange(path, index, e.target.value)
                    }
                    placeholder={placeholder}
                    className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveArrayItem(path, index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <div className="flex items-start space-x-3 w-full bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700 flex-1 leading-relaxed">
                    {item}
                  </p>
                </div>
              )}
            </div>
          ))}
        {items?.length === 0 && !isEditing && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 italic">No items available</p>
          </div>
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
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span>{title}</span>
      </Label>
      {isEditing ? (
        multiline ? (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            placeholder={placeholder}
            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
          />
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {value || (
              <span className="italic text-gray-500">Not specified</span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  if (!editedData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Your Organization's Value Proposition{" "}
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-3 py-1.5 font-medium"
                  >
                    {editedData.organization_name}
                  </Badge>
                </h2>

                {/* <p className="text-sm text-gray-600 mt-0.5">
                  Comprehensive business intelligence and insights
                </p> */}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Review and edit your organization's business knowledge profile
            extracted from uploaded documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="core"
          className="w-full flex flex-col flex-1 min-h-0 mt-4"
        >
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <TabsTrigger
              value="core"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <Target className="w-4 h-4 mr-1.5" />
              Core Business
            </TabsTrigger>
            <TabsTrigger
              value="dynamic"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Dynamic Supply
            </TabsTrigger>
            <TabsTrigger
              value="offer"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              Offer Definition
            </TabsTrigger>
            <TabsTrigger
              value="objections"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Customer Fit Intelligence
            </TabsTrigger>
            <TabsTrigger
              value="icp"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Ideal Customer Profile
            </TabsTrigger>
            <TabsTrigger
              value="methodology"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium rounded-lg transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Sales Methodology
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            {/* Core Business Tab */}
            <TabsContent value="core" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Core Business Elements
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Core Business Offering",
                    "static_supply_elements.coreBusinessOffering",
                    editedData.static_supply_elements?.coreBusinessOffering,
                    true,
                    "Describe your main business offering..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Value Proposition",
                    "static_supply_elements.valueProposition",
                    editedData.static_supply_elements?.valueProposition,
                    true,
                    "What unique value do you provide..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Market Position",
                    "static_supply_elements.marketPosition",
                    editedData.static_supply_elements?.marketPosition,
                    true,
                    "How are you positioned in the market..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Fundamental Problem Solved",
                    "static_supply_elements.fundamentalProblemSolved",
                    editedData.static_supply_elements?.fundamentalProblemSolved,
                    true,
                    "What core problem do you solve..."
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Competitive Advantages
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderArrayField(
                    "Key Advantages",
                    "static_supply_elements.competitiveAdvantages",
                    editedData.static_supply_elements?.competitiveAdvantages,
                    "Enter competitive advantage..."
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg border-b border-purple-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Products & Services Portfolio
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderArrayField(
                    "Products/Services",
                    "static_supply_elements.productsServicesPortfolio",
                    editedData.static_supply_elements
                      ?.productsServicesPortfolio,
                    "Enter product or service..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Market Dynamics Tab */}
            <TabsContent value="dynamic" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Market Dynamics
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderArrayField(
                    "Current Adaptations & Pivots",
                    "dynamic_supply_elements.currentAdaptationsPivots",
                    editedData.dynamic_supply_elements.currentAdaptationsPivots,
                    "Enter adaptation or pivot..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Response to Market Trends",
                    "dynamic_supply_elements.responseToTrends",
                    editedData.dynamic_supply_elements.responseToTrends,
                    "Enter trend response..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Active Promotions & Campaigns",
                    "dynamic_supply_elements.activePromotionsCampaigns",
                    editedData.dynamic_supply_elements
                      .activePromotionsCampaigns,
                    "Enter promotion or campaign..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Seasonal Tactical Adjustments",
                    "dynamic_supply_elements.seasonalTacticalAdjustments",
                    editedData.dynamic_supply_elements
                      .seasonalTacticalAdjustments,
                    "Enter seasonal adjustment..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Value Offer Tab */}
            <TabsContent value="offer" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Value Offer Definition
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Dream Outcome",
                    "offer_definition.dreamOutcome",
                    editedData.offer_definition.dreamOutcome,
                    true,
                    "What's the ideal outcome for customers..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Pain & Problem",
                    "offer_definition.painProblem",
                    editedData.offer_definition.painProblem,
                    true,
                    "What pain points do you address..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Proof & Differentiator",
                    "offer_definition.proofDifferentiator",
                    editedData.offer_definition.proofDifferentiator,
                    true,
                    "What proves you're different and better..."
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-lg border-b border-yellow-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Reframe Narratives
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Unseen Problem",
                    "reframe_narratives.unseenProblem",
                    editedData.reframe_narratives.unseenProblem,
                    true,
                    "What problem do prospects not realize they have..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Aha Moment",
                    "reframe_narratives.ahaMoment",
                    editedData.reframe_narratives.ahaMoment,
                    true,
                    "What insight creates the 'aha' moment..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Contrarian View",
                    "reframe_narratives.contrarianView",
                    editedData.reframe_narratives.contrarianView,
                    true,
                    "What contrarian perspective do you offer..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objections Tab */}
            <TabsContent value="objections" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 rounded-t-lg border-b border-red-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Pricing & Objections
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Prize Criteria",
                    "pricing_and_objections.prizeCriteria",
                    editedData.pricing_and_objections.prizeCriteria,
                    true,
                    "What criteria determine success..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Low Status Triggers",
                    "pricing_and_objections.lowStatusTriggers",
                    editedData.pricing_and_objections.lowStatusTriggers,
                    "Enter status trigger..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Common Prospect Assumptions",
                    "pricing_and_objections.commonProspectAssumptions",
                    editedData.pricing_and_objections.commonProspectAssumptions,
                    "Enter prospect assumption..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Target Customers Tab */}
            <TabsContent value="icp" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg border-b border-cyan-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Ideal Customer Profile
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Champion Persona",
                    "icp.championPersona",
                    editedData.icp.championPersona,
                    true,
                    "Who champions your solution internally..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Economic Buyer Persona",
                    "icp.economicBuyerPersona",
                    editedData.icp.economicBuyerPersona,
                    true,
                    "Who makes the buying decision..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Anti-Persona",
                    "icp.antiPersona",
                    editedData.icp.antiPersona,
                    true,
                    "Who is NOT a good fit..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Key Metrics & KPIs",
                    "icp.keyMetricsOrKPIs",
                    editedData.icp.keyMetricsOrKPIs,
                    "Enter metric or KPI..."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Process Tab */}
            <TabsContent value="methodology" className="space-y-6 p-1 mt-0">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg border-b border-indigo-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Sales Methodology
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderTextField(
                    "Methodology Used",
                    "sales_methodology.methodologyUsed",
                    editedData.sales_methodology.methodologyUsed,
                    false,
                    "e.g., SPIN, Challenger, MEDDIC..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Key Qualification Information",
                    "sales_methodology.keyQualificationInfo",
                    editedData.sales_methodology.keyQualificationInfo,
                    true,
                    "How do you qualify prospects..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Go-To Closing Technique",
                    "sales_methodology.goToClosingTechnique",
                    editedData.sales_methodology.goToClosingTechnique,
                    true,
                    "What's your primary closing approach..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Brand Voice Guidelines",
                    "brand_voice_guidelines",
                    editedData.brand_voice_guidelines,
                    true,
                    "Describe your brand voice and tone..."
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-slate-500 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-lg">
                      Assets & Sources
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {renderArrayField(
                    "Assets Detected",
                    "assets_detected",
                    editedData.assets_detected,
                    "Enter asset description..."
                  )}

                  <Separator className="my-6" />

                  {renderArrayField(
                    "Sources",
                    "sources",
                    editedData.sources,
                    "Enter source..."
                  )}

                  <Separator className="my-6" />

                  {renderTextField(
                    "Summary Note",
                    "summary_note",
                    editedData.summary_note,
                    true,
                    "Overall summary of the business knowledge..."
                  )}
                </CardContent>
              </Card>

              {/* Others Data Section */}
              {editedData.others && editedData.others.length > 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-lg border-b border-teal-100">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-teal-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-800 text-lg">
                        Additional Insights
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {editedData.others.map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span>{item.title}</span>
                          </Label>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOthersItem(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                handleOthersItemChange(
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Enter title..."
                              className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                            />
                            <Textarea
                              value={item.content}
                              onChange={(e) =>
                                handleOthersItemChange(
                                  index,
                                  "content",
                                  e.target.value
                                )
                              }
                              placeholder="Enter content..."
                              className="min-h-[100px] border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {item.content || (
                                <span className="italic text-gray-500">
                                  No content available
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {index < editedData.others.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}

                    {isEditing && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOthersItem}
                          className="text-teal-600 border-teal-200 hover:bg-teal-50"
                        >
                          <Plus className="w-3 h-3 mr-1.5" />
                          Add Additional Insight
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 flex-shrink-0 border-t border-gray-200 pt-6 mt-6 bg-gray-50 rounded-b-lg -mx-6 -mb-6 px-6 pb-6">
          {/* <Button variant="outline" onClick={onClose}>
            Close
          </Button> */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2.5 border-gray-300 hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              {isSaving ? (
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
