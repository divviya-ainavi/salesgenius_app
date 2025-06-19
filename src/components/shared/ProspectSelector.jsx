import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building,
  User,
  Search,
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";

// Mock prospects data - in real app, this would come from props or context
const mockProspects = [
  {
    id: "acme_corp",
    companyName: "Acme Corp",
    prospectName: "Sarah Johnson",
    title: "VP of Sales",
    totalCalls: 4,
    lastCallDate: "2024-01-15",
    lastEngagement: "2 hours ago",
    status: "hot",
    dealValue: "$120K",
    probability: 85,
    nextAction: "Pilot program approval",
    stakeholders: [
      { name: "Sarah Johnson", role: "VP Sales", style: "Visual" },
      { name: "Mike Chen", role: "Sales Ops", style: "Kinesthetic" },
      { name: "Lisa Rodriguez", role: "Marketing Dir", style: "Auditory" },
    ],
  },
  {
    id: "techstart_inc",
    companyName: "TechStart Inc",
    prospectName: "John Smith",
    title: "CEO",
    totalCalls: 2,
    lastCallDate: "2024-01-14",
    lastEngagement: "1 day ago",
    status: "warm",
    dealValue: "$45K",
    probability: 65,
    nextAction: "Technical demo",
    stakeholders: [
      { name: "John Smith", role: "CEO", style: "Visual" },
      { name: "Emma Wilson", role: "CTO", style: "Kinesthetic" },
    ],
  },
  {
    id: "global_solutions",
    companyName: "Global Solutions Ltd",
    prospectName: "Emma Wilson",
    title: "Director of Operations",
    totalCalls: 3,
    lastCallDate: "2024-01-10",
    lastEngagement: "5 days ago",
    status: "warm",
    dealValue: "$85K",
    probability: 70,
    nextAction: "Proposal review",
    stakeholders: [
      { name: "Emma Wilson", role: "Director Operations", style: "Auditory" },
      { name: "David Brown", role: "IT Manager", style: "Kinesthetic" },
    ],
  },
];

export const ProspectSelector = ({
  selectedProspect,
  onProspectSelect,
  prospectList = [],
  compact = false,
  showStakeholders = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(!compact);

  const filteredProspects = prospectList.filter(
    (p) =>
      p.id !== selectedProspect?.id &&
      (p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prospectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (compact && selectedProspect && !isExpanded) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <h3 className="font-medium text-sm">
                  {selectedProspect.companyName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedProspect.prospectName} • {selectedProspect.title}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  getStatusColor(selectedProspect.status)
                )}
              >
                {selectedProspect.status}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Prospect Context</span>
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        {/* Search */}
        <div className="relative">
          <label htmlFor="prospect-search" className="sr-only">
            Search prospects by company or name
          </label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="prospect-search"
            placeholder="Search prospects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Prospect Details */}
        {selectedProspect && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {selectedProspect.companyName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedProspect.prospectName} • {selectedProspect.title}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  getStatusColor(selectedProspect.status)
                )}
              >
                {selectedProspect.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Last Call:</span>
                <span className="font-medium">
                  {selectedProspect.lastCallDate}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Deal Value:</span>
                <span className="font-medium">
                  {selectedProspect.dealValue}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Probability:</span>
                <span className="font-medium">
                  {selectedProspect.probability}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Stakeholders:</span>
                <span className="font-medium">
                  {selectedProspect.stakeholders?.length || 0}
                </span>
              </div>
            </div>

            {showStakeholders && selectedProspect.stakeholders && (
              <div className="pt-3 border-t border-primary/20">
                <h4 className="text-sm font-medium mb-2">Key Stakeholders</h4>
                <div className="space-y-1">
                  {selectedProspect.stakeholders.map((stakeholder, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">{stakeholder.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          {stakeholder.role}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {stakeholder.style}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Next Action:</span>{" "}
                {selectedProspect.nextAction}
              </p>
            </div>
          </div>
        )}

        {/* Prospect List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Select Different Prospect</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredProspects.map((prospect) => (
              <div
                key={prospect.id}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                  selectedProspect?.id === prospect.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onProspectSelect(prospect)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">
                      {prospect.companyName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {prospect.prospectName} • {prospect.title}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getStatusColor(prospect.status))}
                  >
                    {prospect.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{prospect.dealValue}</span>
                  <span>{prospect.lastEngagement}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
