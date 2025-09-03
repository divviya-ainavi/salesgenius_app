import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Edit,
  Eye,
  Trash2,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, CURRENT_USER } from "@/lib/supabase";
import { PersonalInsightsModal } from "./PersonalInsightsModal";

interface PersonalInsight {
  repName: string;
  roleTitle: string;
  territory: string;
  verticalFocus: string[];
  quota: string;
  timeHorizon: string;
  activePipeline: string[];
  personalProofBank: string[];
  relationshipCapital: string[];
  sellingStyleStrengths: string[];
  commonObjectionsEncountered: string[];
  preferredAdvancePerAccount: string;
  availabilityWindows: string[];
  productCertifications: string[];
  brandVoiceTone: string;
  sources: string[];
  summaryNote: string;
}

interface PersonalInsightsDisplayProps {
  refreshTrigger: number;
}

export const PersonalInsightsDisplay: React.FC<PersonalInsightsDisplayProps> = ({
  refreshTrigger,
}) => {
  const [personalInsights, setPersonalInsights] = useState<PersonalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<PersonalInsight[]>([]);

  useEffect(() => {
    loadPersonalInsights();
  }, [refreshTrigger]);

  const loadPersonalInsights = async () => {
    setIsLoading(true);
    try {
      // For now, we'll store personal insights in a simple way
      // In a real implementation, you might want a separate table
      const { data, error } = await supabase
        .from('business_knowledge_files')
        .select('*')
        .eq('uploaded_by', CURRENT_USER.id)
        .like('description', '%Personal insights%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For demo purposes, we'll use mock data
      // In real implementation, you'd parse the stored insights
      setPersonalInsights([]);
    } catch (error) {
      console.error('Error loading personal insights:', error);
      toast.error('Failed to load personal insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInsight = (insight: PersonalInsight) => {
    setSelectedInsight([insight]);
    setShowModal(true);
  };

  const handleSaveInsight = async (updatedData: PersonalInsight[]) => {
    try {
      // In a real implementation, you would save the updated insights
      // For now, we'll just update the local state
      setPersonalInsights(prev => 
        prev.map(insight => 
          insight.repName === updatedData[0].repName ? updatedData[0] : insight
        )
      );
      
      toast.success('Personal insights updated successfully');
    } catch (error) {
      console.error('Error saving personal insights:', error);
      throw error;
    }
  };

  const handleDeleteInsight = async (insight: PersonalInsight) => {
    try {
      // In a real implementation, you would delete from database
      setPersonalInsights(prev => 
        prev.filter(item => item.repName !== insight.repName)
      );
      
      toast.success('Personal insight deleted successfully');
    } catch (error) {
      console.error('Error deleting personal insight:', error);
      toast.error('Failed to delete personal insight');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-purple-600" />
            <p className="text-muted-foreground">Loading personal insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (personalInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Personal Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Personal Insights</h3>
          <p className="text-muted-foreground mb-4">
            Upload your personal sales files to extract insights about your selling style and performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Personal Insights</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              {personalInsights.length} Profile{personalInsights.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadPersonalInsights}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {personalInsights.map((insight, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{insight.repName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{insight.roleTitle}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Territory: {insight.territory}</span>
                    <span>Verticals: {insight.verticalFocus.length}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInsight(insight)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInsight(insight)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInsight(insight)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {insight.sellingStyleStrengths.slice(0, 3).map((strength, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {strength}
                    </Badge>
                  ))}
                  {insight.sellingStyleStrengths.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{insight.sellingStyleStrengths.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {insight.summaryNote}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sources: {insight.sources.length} files</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Personal Insights Modal */}
      <PersonalInsightsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={selectedInsight}
        onSave={handleSaveInsight}
      />
    </>
  );
};