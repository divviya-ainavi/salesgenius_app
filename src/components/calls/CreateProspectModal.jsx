import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, CURRENT_USER } from '@/lib/supabase';

export const CreateProspectModal = ({ isOpen, onClose, onProspectCreated, companyId }) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Prospect name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const prospectData = {
        name: formData.name.trim(),
        company_id: companyId,
        user_id: CURRENT_USER.id,
        calls: 0
      };

      const { data, error } = await supabase
        .from('prospect')
        .insert([prospectData])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`Prospect "${data.name}" created successfully`);
      onProspectCreated(data);
      handleClose();
    } catch (error) {
      console.error('Error creating prospect:', error);
      toast.error('Failed to create prospect: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Create New Prospect</span>
          </DialogTitle>
          <DialogDescription>
            Add a new prospect (deal) to associate with your call transcript.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prospect-name">Prospect Name *</Label>
            <Input
              id="prospect-name"
              placeholder="Enter prospect or deal name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
              aria-describedby={errors.name ? "prospect-name-error" : undefined}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Prospect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};