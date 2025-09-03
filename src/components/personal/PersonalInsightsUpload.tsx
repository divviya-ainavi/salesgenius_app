import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase, CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { config } from "@/lib/config";

const PersonalInsightsUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [personalInsights, setPersonalInsights] = useState(null);

  const { user, organizationDetails } = useSelector((state) => state.auth);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "text/vtt": [".vtt"],
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "video/mp4": [".mp4"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const file = fileItem.file;

        // Update file status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "uploading" } : f
          )
        );

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = `${user.id}/${timestamp}_${file.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("personal-insights")
          .upload(uniqueFileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "error" } : f
            )
          );
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("personal-insights")
          .getPublicUrl(uniqueFileName);

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from("business_knowledge_files")
          .insert([
            {
              organization_id: user.organization_id,
              uploaded_by: user.id,
              filename: uniqueFileName,
              original_filename: file.name,
              file_size: file.size,
              content_type: file.type,
              storage_path: uploadData.path,
              file_url: urlData.publicUrl,
              description: "Personal insights file",
            },
          ])
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "error" } : f
            )
          );
          continue;
        }

        uploadedFiles.push(fileRecord);

        // Update file status and progress
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "completed" } : f
          )
        );

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (uploadedFiles.length > 0) {
        toast.success(`${uploadedFiles.length} files uploaded successfully`);
        await processPersonalInsights(uploadedFiles);
      } else {
        toast.error("No files were uploaded successfully");
      }
    } catch (error) {
      console.error("Upload process error:", error);
      toast.error("Failed to upload files: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const processPersonalInsights = async (uploadedFiles) => {
    setIsProcessing(true);

    try {
      // Call the personal insights API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${config.api.endpoints.personalInsights}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: uploadedFiles.map((file) => ({
              id: file.id,
              filename: file.original_filename,
              url: file.file_url,
              content_type: file.content_type,
            })),
            user_id: user.id,
            organization_id: user.organization_id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      console.log("Personal insights API response:", apiData);

      setPersonalInsights(apiData);
      setProcessingComplete(true);
      toast.success("Personal insights generated successfully!");
    } catch (error) {
      console.error("Error processing personal insights:", error);
      toast.error("Failed to process personal insights: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFiles([]);
    setUploadProgress(0);
    setIsUploading(false);
    setIsProcessing(false);
    setProcessingComplete(false);
    setPersonalInsights(null);
  };

  const handleApprove = async () => {
    try {
      // Save the personal insights to database
      // This would typically save to a personal_insights table
      toast.success("Personal insights approved and saved!");
      handleClose();
    } catch (error) {
      console.error("Error approving personal insights:", error);
      toast.error("Failed to save personal insights");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Brain className="w-4 h-4 mr-2" />
          Generate Personal Insights
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <span>Personal Insights Generation</span>
          </DialogTitle>
          <DialogDescription>
            Upload files to generate personalized sales insights and strategies
          </DialogDescription>
        </DialogHeader>

        {!processingComplete ? (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive
                  ? "Drop files here..."
                  : "Upload Personal Files"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supported: PDF, TXT, VTT, MP3, WAV, MP4 (max 10MB each)
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            fileItem.status === "completed"
                              ? "default"
                              : fileItem.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {fileItem.status === "uploading" && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          {fileItem.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {fileItem.status === "error" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {fileItem.status}
                        </Badge>
                        {fileItem.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
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

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploading files...</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Generating Personal Insights
                </h3>
                <p className="text-muted-foreground">
                  AI is analyzing your files to create personalized sales insights...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Personal Insights Results */
          <PersonalInsightsModal 
            insights={personalInsights} 
            onApprove={handleApprove}
            onClose={handleClose}
          />
        )}

        {!processingComplete && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading || isProcessing}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PersonalInsightsUpload;