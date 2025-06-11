
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PresentationPromptCardProps {
  content: string;
  onRegenerate: () => void;
}

export const PresentationPromptCard: React.FC<PresentationPromptCardProps> = ({ content, onRegenerate }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Presentation prompt copied to clipboard');
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Presentation Prompt</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRegenerate}>
                Regenerate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-sm text-foreground">
            {content}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
