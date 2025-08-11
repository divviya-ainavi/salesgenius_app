import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
  className?: string
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ onFileSelect, selectedFile, accept, maxSize = 10 * 1024 * 1024, disabled = false, className }, ref) => {
    const [error, setError] = useState<string | null>(null)

    const onDrop = React.useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null)
      
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
          setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
        } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
          setError('Invalid file type. Please upload a PDF file.')
        } else {
          setError('File upload failed. Please try again.')
        }
        return
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    }, [onFileSelect, maxSize])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: accept || {
        'application/pdf': ['.pdf']
      },
      maxFiles: 1,
      maxSize,
      disabled
    })

    const handleRemoveFile = (e: React.MouseEvent) => {
      e.stopPropagation()
      onFileSelect(null)
      setError(null)
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-300 bg-red-50"
          )}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              <File className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the PDF file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF files only (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"

export { FileUpload }