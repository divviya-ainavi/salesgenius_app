import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { supabase, CURRENT_USER } from "@/lib/supabase";

export const PersonalInsightsUploadModal = ({ isOpen, onClose, onFilesUploaded }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/plain": [".txt"],
      "text/vtt": [".vtt"],
      "application/pdf": [".pdf"],
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "video/mp4": [".mp4"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error("Some files were rejected. Please check file types and sizes.");
      }
      
      const newFiles = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "pending",
        progress: 0,
      }));
      
      setFiles((prev) => [...prev, ...newFiles]);
    },
  });

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const fileItem of files) {
        try {
          // Update progress
          setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 0 }));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "uploading" } : f
            )
          );

          // Generate unique filename
          const timestamp = Date.now();
          const uniqueFileName = `${CURRENT_USER.id}/${timestamp}_${fileItem.file.name}`;

          // Upload to Supabase Storage (personal-insights bucket)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("personal-insights")
            .upload(uniqueFileName, fileItem.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("personal-insights")
            .getPublicUrl(uniqueFileName);

          // Save file metadata to database
          const { data: fileRecord, error: dbError } = await supabase
            .from("business_knowledge_files")
            .insert([
              {
                organization_id: CURRENT_USER.organization_id,
                uploaded_by: CURRENT_USER.id,
                filename: uniqueFileName,
                original_filename: fileItem.file.name,
                file_size: fileItem.file.size,
                content_type: fileItem.file.type,
                storage_path: uploadData.path,
                file_url: urlData.publicUrl,
                description: "Personal insights file",
              },
            ])
            .select()
            .single();

          if (dbError) throw dbError;

          uploadedFiles.push(fileRecord);

          // Update progress
          setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 100 }));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "completed" } : f
            )
          );
        } catch (error) {
          console.error(`Error uploading file ${fileItem.file.name}:`, error);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "error" } : f
            )
          );
          toast.error(`Failed to upload ${fileItem.file.name}`);
        }
      }

      if (uploadedFiles.length > 0) {
        onFilesUploaded(uploadedFiles);
        handleClose();
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error("Upload process failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setUploadProgress({});
      onClose();
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("video")) return "🎥";
    return "📝";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Personal Insights Files</span>
          </DialogTitle>
          <DialogDescription>
            Upload call recordings, performance reviews, or coaching notes to generate personalized insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? "Drop files here" : "Upload Personal Files"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">TXT</Badge>
              <Badge variant="outline">VTT</Badge>
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">MP3</Badge>
              <Badge variant="outline">WAV</Badge>
              <Badge variant="outline">MP4</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum file size: 50MB
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Selected Files ({files.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg">
                        {getFileIcon(fileItem.file.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileItem.status === "uploading" && (
                          <Progress
                            value={uploadProgress[fileItem.id] || 0}
                            className="mt-1 h-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {fileItem.status === "pending" && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {fileItem.status === "uploading" && (
                        <Badge variant="outline" className="text-blue-600">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {fileItem.status === "completed" && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {fileItem.status === "error" && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-200"
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}

                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileItem.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};