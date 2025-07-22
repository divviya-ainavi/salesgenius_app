import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Upload,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Calendar,
  User,
  FileIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import businessKnowledgeService from '@/lib/businessKnowledgeService';
import { useSelector } from 'react-redux';

const BusinessKnowledgeSection = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get user data from Redux store
  const { user, organizationDetails, userRoleId } = useSelector((state) => state.auth);

  // Check if user is org admin (userRoleId === 2)
  const isOrgAdmin = userRoleId === 2;

  // Load files on component mount
  useEffect(() => {
    if (organizationDetails?.id && isOrgAdmin) {
      console.log('Loading files for organization:', organizationDetails.id);
      loadFiles();
    } else {
      console.log('Not loading files - missing org ID or not org admin:', {
        orgId: organizationDetails?.id,
        isOrgAdmin,
        userRoleId
      });
    }
  }, [organizationDetails?.id, isOrgAdmin]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      console.log('Calling businessKnowledgeService.getFiles with org ID:', organizationDetails.id);
      const filesData = await businessKnowledgeService.getFiles(organizationDetails.id);
      console.log('Received files data:', filesData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading business knowledge files:', error);
      toast.error('Failed to load files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // File upload handling
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setShowUploadDialog(true);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!organizationDetails?.id) {
      toast.error('Organization information not available');
      return;
    }

    if (!user?.id) {
      toast.error('User information not available');
      return;
    }

    console.log('Starting upload with:', {
      fileName: selectedFile.name,
      orgId: organizationDetails.id,
      userId: user.id,
      userRoleId,
      isOrgAdmin
    });

    // Validate file
    const validation = businessKnowledgeService.validateFile(selectedFile);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    setIsUploading(true);

    try {
      await businessKnowledgeService.uploadFile(
        selectedFile,
        organizationDetails.id,
        user.id,
        uploadDescription
      );

      toast.success('File uploaded successfully');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadDescription('');
      await loadFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) {
      toast.error('No file selected for deletion');
      return;
    }

    if (!organizationDetails?.id) {
      toast.error('Organization information not available');
      return;
    }

    setIsDeleting(true);

    try {
      await businessKnowledgeService.deleteFile(fileToDelete.id, organizationDetails.id);
      toast.success('File deleted successfully');
      setShowDeleteDialog(false);
      setFileToDelete(null);
      await loadFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (file) => {
    setSelectedFile(file);
    setShowViewDialog(true);
  };

  const handleDownload = async (file) => {
    try {
      if (file.file_url) {
        // Open the file URL in a new tab
        window.open(file.file_url, '_blank');
      } else {
        // Create a signed URL for download
        const downloadUrl = await businessKnowledgeService.getDownloadUrl(file.storage_path);
        window.open(downloadUrl, '_blank');
      }
      
      toast.success('File opened for download');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType) => {
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('sheet')) return '📊';
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📋';
    if (contentType.includes('text')) return '📄';
    return '📁';
  };

  // Don't render anything if user is not org admin
  if (!isOrgAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Business-Specific Knowledge</span>
            <Badge variant="outline" className="text-xs">
              Org Admin Only
            </Badge>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Business Knowledge File</DialogTitle>
                <DialogDescription>
                  Upload documents that contain business-specific knowledge for AI training.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* File Drop Zone */}
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  {selectedFile ? (
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive ? "Drop the file here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, Word, Excel, PowerPoint, Text files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this file contains..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFile(null);
                    setUploadDescription('');
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload business-specific documents, guidelines, and knowledge base files to improve AI responses for your organization.
        </p>

        {/* Files List */}
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No business knowledge files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">{getFileIcon(file.content_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{file.original_filename}</h4>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{file.uploader?.full_name || file.uploaded_by || 'Unknown'}</span>
                      </span>
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {file.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(file)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setFileToDelete(file);
                          setShowDeleteDialog(true);
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
            ))}
          </div>
        )}

        {/* File View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="text-2xl">{selectedFile && getFileIcon(selectedFile.content_type)}</div>
                <span>{selectedFile?.original_filename}</span>
              </DialogTitle>
              <DialogDescription>
                File details and information
              </DialogDescription>
            </DialogHeader>

            {selectedFile && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="text-muted-foreground">{formatFileSize(selectedFile.file_size)}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Type:</span>
                    <p className="text-muted-foreground">{selectedFile.content_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded By:</span>
                    <p className="text-muted-foreground">{selectedFile.uploader?.full_name || selectedFile.uploaded_by || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Upload Date:</span>
                    <p className="text-muted-foreground">
                      {new Date(selectedFile.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedFile.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground mt-1">{selectedFile.description}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    onClick={() => handleDownload(selectedFile)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span>Delete File</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{fileToDelete?.original_filename}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setFileToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BusinessKnowledgeSection;