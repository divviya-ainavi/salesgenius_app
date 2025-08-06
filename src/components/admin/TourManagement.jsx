import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Route, Play, Plus, Edit, Trash2, Save, X, MoreVertical, ArrowUp, ArrowDown, Eye, Loader2, RefreshCw, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dbHelpers } from '@/lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TourManagement = () => {
  const [tourSteps, setTourSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);

  // Form state for creating/editing steps
  const [formData, setFormData] = useState({
    step_order: '',
    target: '',
    title: '',
    content: '',
    placement: 'right',
    disable_beacon: false,
    is_active: true,
  });

  const placementOptions = [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'center', label: 'Center' },
  ];

  // Load tour steps on component mount
  useEffect(() => {
    loadTourSteps();
  }, []);

  const loadTourSteps = async () => {
    try {
      setIsLoading(true);
      const steps = await dbHelpers.getTourSteps();
      setTourSteps(steps);
    } catch (error) {
      console.error('Error loading tour steps:', error);
      toast.error('Failed to load tour steps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      step_order: '',
      target: '',
      title: '',
      content: '',
      placement: 'right',
      disable_beacon: false,
      is_active: true,
    });
    setEditingStep(null);
  };

  const handleCreateStep = async () => {
    try {
      setIsUpdating(true);
      
      // Validate required fields
      if (!formData.title || !formData.content || !formData.target) {
        toast.error('Please fill in all required fields');
        return;
      }

      const stepData = {
        ...formData,
        step_order: parseInt(formData.step_order) || tourSteps.length + 1,
      };

      await dbHelpers.createTourStep(stepData);
      await loadTourSteps();
      setShowCreateDialog(false);
      resetForm();
      toast.success('Tour step created successfully');
    } catch (error) {
      console.error('Error creating tour step:', error);
      toast.error('Failed to create tour step');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStep = async () => {
    try {
      setIsUpdating(true);
      
      const updates = {
        ...formData,
        step_order: parseInt(formData.step_order),
      };

      await dbHelpers.updateTourStep(editingStep.id, updates);
      await loadTourSteps();
      setEditingStep(null);
      resetForm();
      toast.success('Tour step updated successfully');
    } catch (error) {
      console.error('Error updating tour step:', error);
      toast.error('Failed to update tour step');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStep = async () => {
    try {
      setIsUpdating(true);
      await dbHelpers.deleteTourStep(previewStep.id);
      await loadTourSteps();
      setShowPreviewDialog(false);
      setPreviewStep(null);
      toast.success('Tour step deleted successfully');
    } catch (error) {
      console.error('Error deleting tour step:', error);
      toast.error('Failed to delete tour step');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    setFormData({
      step_order: step.step_order.toString(),
      target: step.target,
      title: step.title,
      content: step.content,
      placement: step.placement,
      disable_beacon: step.disable_beacon,
      is_active: step.is_active,
    });
  };

  const handlePreviewStep = (step) => {
    setPreviewStep(step);
    setShowPreviewDialog(true);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(tourSteps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update step_order for all items
    const stepUpdates = items.map((item, index) => ({
      id: item.id,
      step_order: index + 1,
    }));

    try {
      setIsUpdating(true);
      await dbHelpers.reorderTourSteps(stepUpdates);
      await loadTourSteps();
      toast.success('Tour steps reordered successfully');
    } catch (error) {
      console.error('Error reordering tour steps:', error);
      toast.error('Failed to reorder tour steps');
    } finally {
      setIsUpdating(false);
    }
  };

  const testTour = () => {
    if (window.replaySalesFlowTour) {
      window.replaySalesFlowTour();
    } else {
      toast.error('Tour function not available');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>Tour Management</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              <Crown className="w-3 h-3 mr-1" />
              Super Admin Only
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={testTour}
              variant="outline"
              size="sm"
            >
              <Play className="w-4 h-4 mr-1" />
              Test Tour
            </Button>
            <Button
              onClick={loadTourSteps}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Tour Step</DialogTitle>
                  <DialogDescription>
                    Add a new step to the onboarding tour
                  </DialogDescription>
                </DialogHeader>
                <TourStepForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  placementOptions={placementOptions}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStep}
                    disabled={isUpdating || !formData.title || !formData.content || !formData.target}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Step'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage the onboarding tour steps that guide new users through the platform. 
          Drag and drop to reorder steps.
        </p>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading tour steps...</p>
          </div>
        ) : tourSteps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No tour steps found</p>
            <p className="text-sm">Create your first tour step to get started</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tour-steps">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {tourSteps.map((step, index) => (
                    <Draggable
                      key={step.id}
                      draggableId={step.id}
                      index={index}
                      isDragDisabled={isUpdating}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "border border-border rounded-lg p-4 bg-background",
                            snapshot.isDragging && "shadow-lg"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing"
                              >
                                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">
                                  {step.step_order}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium">{step.title}</h4>
                                  <Badge
                                    variant="outline"
                                    className={step.is_active ? 'text-green-600' : 'text-gray-500'}
                                  >
                                    {step.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {step.placement}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {step.content}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Target: <code className="bg-gray-100 px-1 rounded">{step.target}</code></span>
                                  <span>Updated: {new Date(step.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewStep(step)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditStep(step)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handlePreviewStep(step)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPreviewStep(step);
                                      if (window.confirm(`Are you sure you want to delete "${step.title}"?`)) {
                                        handleDeleteStep();
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Edit Step Dialog */}
        <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Tour Step</DialogTitle>
              <DialogDescription>
                Update the tour step details
              </DialogDescription>
            </DialogHeader>
            <TourStepForm
              formData={formData}
              onInputChange={handleInputChange}
              placementOptions={placementOptions}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingStep(null);
                  resetForm();
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStep}
                disabled={isUpdating || !formData.title || !formData.content || !formData.target}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Step
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Step Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Preview Tour Step</DialogTitle>
            </DialogHeader>
            {previewStep && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">{previewStep.title}</h3>
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: previewStep.content.replace(/\n/g, '<br />') 
                    }} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Target:</span>
                    <p className="text-muted-foreground font-mono">{previewStep.target}</p>
                  </div>
                  <div>
                    <span className="font-medium">Placement:</span>
                    <p className="text-muted-foreground">{previewStep.placement}</p>
                  </div>
                  <div>
                    <span className="font-medium">Order:</span>
                    <p className="text-muted-foreground">{previewStep.step_order}</p>
                  </div>
                  <div>
                    <span className="font-medium">Beacon:</span>
                    <p className="text-muted-foreground">
                      {previewStep.disable_beacon ? 'Disabled' : 'Enabled'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Tour Step Form Component
const TourStepForm = ({ formData, onInputChange, placementOptions }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step-order">Step Order</Label>
          <Input
            id="step-order"
            type="number"
            placeholder="1"
            value={formData.step_order}
            onChange={(e) => onInputChange('step_order', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="placement">Placement</Label>
          <Select
            value={formData.placement}
            onValueChange={(value) => onInputChange('placement', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {placementOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">Target Selector *</Label>
        <Input
          id="target"
          placeholder='[data-tour="example"] or body'
          value={formData.target}
          onChange={(e) => onInputChange('target', e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          CSS selector for the element to highlight (e.g., [data-tour="research"], body)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Step title with emoji"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder="Step description and instructions..."
          value={formData.content}
          onChange={(e) => onInputChange('content', e.target.value)}
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          Use \n for line breaks. HTML tags are not supported.
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="disable-beacon"
            checked={formData.disable_beacon}
            onCheckedChange={(checked) => onInputChange('disable_beacon', checked)}
          />
          <Label htmlFor="disable-beacon" className="text-sm">
            Disable Beacon
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onInputChange('is_active', checked)}
          />
          <Label htmlFor="is-active" className="text-sm">
            Active
          </Label>
        </div>
      </div>
    </div>
  );
};

export default TourManagement;