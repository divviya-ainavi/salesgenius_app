
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FathomSelectProps {
  onSelect: (recordingId: string) => void;
  disabled?: boolean;
}

const mockRecordings = [
  { id: '1', title: 'Client Discovery Call - Acme Corp', date: '2024-01-15' },
  { id: '2', title: 'Product Demo - TechStart Inc', date: '2024-01-14' },
  { id: '3', title: 'Follow-up Call - Global Solutions', date: '2024-01-13' },
  { id: '4', title: 'Pricing Discussion - StartupXYZ', date: '2024-01-12' },
];

export const FathomSelect: React.FC<FathomSelectProps> = ({ onSelect, disabled = false }) => {
  return (
    <div className="space-y-4">
      <Select onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a Fathom recording" />
        </SelectTrigger>
        <SelectContent>
          {mockRecordings.map((recording) => (
            <SelectItem key={recording.id} value={recording.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{recording.title}</span>
                <span className="text-sm text-muted-foreground">{recording.date}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
