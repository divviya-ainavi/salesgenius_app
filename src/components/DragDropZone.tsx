import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DragDropZoneProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/plain', 'text/vtt', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.txt', '.vtt', '.pdf'];

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFileUpload,
  disabled = false,
}) => {
  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return false;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      toast.error('Please upload only .txt, .vtt, or .pdf files');
      return false;
    }

    // Check file extension as fallback
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error('Please upload only .txt, .vtt, or .pdf files');
      return false;
    }

    // Check for potentially malicious filenames
    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      toast.error('Invalid filename detected');
      return false;
    }

    return true;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (disabled) return;

      if (fileRejections && fileRejections.length > 0) {
        toast.error('Please upload only .txt, .vtt, or .pdf files');
        return;
      }

      const file = acceptedFiles[0];
      if (file && validateFile(file)) {
        onFileUpload(file);
      }
    },
    [onFileUpload, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        disabled
          ? 'border-muted bg-muted/50 cursor-not-allowed opacity-50'
          : 'border-border cursor-pointer hover:border-primary'
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          {isDragActive ? (
            <Upload className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {disabled
              ? 'Processing...'
              : isDragActive
              ? 'Drop your file here'
              : 'Upload call transcript'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {disabled
              ? 'Please wait while we process your file'
              : 'Drag and drop your .txt, .vtt, or .pdf file here, or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: TXT, VTT, PDF (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};