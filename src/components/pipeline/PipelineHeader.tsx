import { Search, Filter, Plus, Info, ChevronDown, User, Target, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PipelineFilters } from "@/types/pipeline";

interface PipelineHeaderProps {
  filters: PipelineFilters;
  onFiltersChange: (filters: PipelineFilters) => void;
  onAddDeal?: () => void;
  viewMode: 'active' | 'closed';
  onViewModeChange: (mode: 'active' | 'closed') => void;
}

export const PipelineHeader = ({ filters, onFiltersChange, onAddDeal, viewMode, onViewModeChange }: PipelineHeaderProps) => {
  return (
    <div className="border-b border-[rgba(0,0,0,0.06)] bg-white">
      <div className="px-6 py-5">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2 leading-tight">Deal Hub</h1>
                  <p className="text-[15px] text-[#636366]">LAPS-guided pipeline from Leads to Close</p>
                </div>
                
                {/* View Mode Toggle */}
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && onViewModeChange(value as 'active' | 'closed')} className="border rounded-lg">
                  <ToggleGroupItem value="active" className="gap-2">
                    <Target className="h-4 w-4" />
                    Active Pipeline
                  </ToggleGroupItem>
                  <ToggleGroupItem value="closed" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Closed Deals
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            
            {/* LAPS Methodology Explainer */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors group">
                <Info className="w-4 h-4" />
                What is LAPS?
                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-2xl">
                  <p className="text-xs text-[#1D1D1F] mb-3">
                    <strong>LAPS</strong> is a proven sales methodology that guides deals through four critical phases:
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">L</div>
                        <strong>Leads</strong>
                      </div>
                      <p className="text-[#6E6E73]">Capture & qualify prospects</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">A</div>
                        <strong>Appointments</strong>
                      </div>
                      <p className="text-[#6E6E73]">Book & verify meetings</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold">P</div>
                        <strong>Discovery</strong>
                      </div>
                      <p className="text-[#6E6E73]">Understand & present</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">S</div>
                        <strong>Sales</strong>
                      </div>
                      <p className="text-[#6E6E73]">Negotiate & close</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals, companies, or contacts..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10 h-10"
            />
          </div>
          
          <Select
            value={filters.owners[0] || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                owners: value === 'all' ? [] : [value]
              })
            }
          >
            <SelectTrigger className="w-[150px] h-10">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="You">My Deals</SelectItem>
              <SelectItem value="all">All Owners</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.healthStatuses[0] || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                healthStatuses: value === 'all' ? [] : [value as any]
              })
            }
          >
            <SelectTrigger className="w-[150px] h-10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="stalled">Stalled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="bg-[#007AFF] hover:bg-[#0051D5] text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-apple active:scale-[0.98] px-5 h-10"
            onClick={onAddDeal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>
    </div>
  );
};
