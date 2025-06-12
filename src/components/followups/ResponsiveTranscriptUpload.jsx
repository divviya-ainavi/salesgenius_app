import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GridRow, GridCol, GridCard, Section } from '@/components/layout/GridSystem'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const mockFathomCalls = [
  { id: '1', title: 'Client Discovery Call - Acme Corp', date: '2024-01-15', duration: '45 min' },
  { id: '2', title: 'Product Demo - TechStart Inc', date: '2024-01-14', duration: '30 min' },
  { id: '3', title: 'Follow-up Call - Global Solutions', date: '2024-01-13', duration: '25 min' },
  { id: '4', title: 'Pricing Discussion - StartupXYZ', date: '2024-01-12', duration: '35 min' }
]

export const ResponsiveTranscriptUpload = ({ 
  onFileUpload, 
  onFathomSelect, 
  isProcessing, 
  disabled = false 
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (disabled || isProcessing) return
    
    const file = acceptedFiles[0]
    if (file) {
      // Validate file type
      const validTypes = ['text/plain', 'text/vtt', 'application/pdf']
      const validExtensions = ['.txt', '.vtt', '.pdf']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        toast.error('Please upload only .txt, .vtt, or .pdf files')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }
      
      onFileUpload(file)
    }
  }, [onFileUpload, disabled, isProcessing])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || isProcessing
  })

  return (
    <Section>
      <GridRow>
        {/* Upload Transcript Card - 6 columns on desktop */}
        <GridCol span={12} lg={6}>
          <GridCard elevation="default">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Upload Transcript</h3>
              </div>
              
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer min-h-[200px] flex flex-col items-center justify-center",
                  isDragActive ? "border-primary bg-primary/5" : "border-border",
                  (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      {isProcessing ? 'Processing...' : 'Drop your transcript here'}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isProcessing 
                        ? 'Please wait while we analyze your call'
                        : 'Drag and drop your .txt, .vtt, or .pdf file, or click to browse'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: TXT, VTT, PDF (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GridCard>
        </GridCol>

        {/* Select from Fathom Card - 6 columns on desktop */}
        <GridCol span={12} lg={6}>
          <GridCard elevation="default">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Select from Fathom</h3>
              </div>
              
              <div className="min-h-[200px] flex flex-col justify-center space-y-4">
                <Select onValueChange={onFathomSelect} disabled={disabled || isProcessing}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a recent call recording" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockFathomCalls.map((call) => (
                      <SelectItem key={call.id} value={call.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{call.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {call.date} • {call.duration}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a call from your Fathom recordings to automatically import the transcript.
                  </p>
                </div>
              </div>
            </div>
          </GridCard>
        </GridCol>
      </GridRow>
    </Section>
  )
}