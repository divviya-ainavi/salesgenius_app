import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Sparkles,
  Phone,
  Building,
  User,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER, supabase } from "@/lib/supabase";
import firefliesService from "@/services/firefliesService";
import { useNavigate } from "react-router-dom";
import { usePageTimer } from "../hooks/userPageTimer";

const SalesCalls = () => {
  usePageTimer("Sales Calls");

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fireflies");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [firefliesFiles, setFirefliesFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Company and Prospect dropdown states
  const [companies, setCompanies] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedProspect, setSelectedProspect] = useState("");
  const [hasCompanyData, setHasCompanyData] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Check for company data and load companies on component mount
  useEffect(() => {
    const checkCompanyData = async () => {
      if (!userId) return;

      try {
        setIsLoadingCompanies(true);
        
        // Check if user has any company data
        const { data: companyData, error } = await supabase
          .from('company')
          .select('id, name')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error checking company data:', error);
          return;
        }

        if (companyData && companyData.length > 0) {
          setHasCompanyData(true);
          setCompanies(companyData);
        } else {
          setHasCompanyData(false);
        }
      } catch (error) {
        console.error('Error checking company data:', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    checkCompanyData();
  }, [userId]);

  // Load prospects when company is selected
  useEffect(() => {
    const loadProspects = async () => {
      if (!selectedCompany || selectedCompany === "add_new") {
        setProspects([]);
        setSelectedProspect("");
        return;
      }

      try {
        setIsLoadingProspects(true);
        
        const { data: prospectData, error } = await supabase
          .from('prospect')
          .select('id, name, title')
          .eq('company_id', selectedCompany)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading prospects:', error);
          return;
        }

        setProspects(prospectData || []);
        setSelectedProspect(""); // Reset prospect selection
      } catch (error) {
        console.error('Error loading prospects:', error);
      } finally {
        setIsLoadingProspects(false);
      }
    };

    loadProspects();
  }, [selectedCompany]);

  // Load uploaded files
  useEffect(() => {
    const fetchUploadedFiles = async () => {
      if (!userId) return;

      try {
        const files = await dbHelpers.getUploadedFiles(userId);
        setUploadedFiles(files);
      } catch (error) {
        console.error("Failed to load uploaded files:", error);
        toast.error("Could not load uploaded files");
      }
    };

    fetchUploadedFiles();
  }, [userId]);

  // Load Fireflies files
  useEffect(() => {
    const fetchFirefliesFiles = async () => {
      if (!userId) return;

      setIsLoadingFireflies(true);
      try {
        const files = await firefliesService.getTranscripts();
        setFirefliesFiles(files);
      } catch (error) {
        console.error("Failed to load Fireflies files:", error);
        toast.error("Could not load Fireflies transcripts");
      } finally {
        setIsLoadingFireflies(false);
      }
    };

    if (activeTab === "fireflies") {
      fetchFirefliesFiles();
    }
  }, [activeTab, userId]);

  // Handle company selection
  const handleCompanySelect = (value) => {
    if (value === "add_new") {
      // Handle add new company logic here
      toast.info("Add new company functionality to be implemented");
      return;
    }
    setSelectedCompany(value);
  };

  // Handle prospect selection
  const handleProspectSelect = (value) => {
    if (value === "add_new") {
      // Handle add new prospect logic here
      toast.info("Add new prospect functionality to be implemented");
      return;
    }
    setSelectedProspect(value);
  };

  // Company/Prospect Dropdown Component
  const CompanyProspectDropdowns = () => {
    if (!hasCompanyData) return null;

    return (
      <div className="mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Company Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="company-select" className="text-sm font-medium">
              Company Name
            </Label>
            <Select
              value={selectedCompany}
              onValueChange={handleCompanySelect}
              disabled={isLoadingCompanies}
            >
              <SelectTrigger id="company-select">
                <SelectValue placeholder={isLoadingCompanies ? "Loading companies..." : "Select a company"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>{company.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="add_new">
                  <div className="flex items-center space-x-2 text-primary">
                    <Plus className="w-4 h-4" />
                    <span>Add New Company</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prospect Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="prospect-select" className="text-sm font-medium">
              Prospect Name
            </Label>
            <Select
              value={selectedProspect}
              onValueChange={handleProspectSelect}
              disabled={!selectedCompany || selectedCompany === "add_new" || isLoadingProspects}
            >
              <SelectTrigger id="prospect-select">
                <SelectValue 
                  placeholder={
                    !selectedCompany || selectedCompany === "add_new" 
                      ? "Select a company first" 
                      : isLoadingProspects 
                        ? "Loading prospects..." 
                        : "Select a prospect"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {prospects.map((prospect) => (
                  <SelectItem key={prospect.id} value={prospect.id}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span>{prospect.name}</span>
                        {prospect.title && (
                          <span className="text-xs text-muted-foreground">{prospect.title}</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {selectedCompany && selectedCompany !== "add_new" && (
                  <SelectItem value="add_new">
                    <div className="flex items-center space-x-2 text-primary">
                      <Plus className="w-4 h-4" />
                      <span>Add New Prospect</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    if (!userId) {
      toast.error("Please log in to upload files");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of acceptedFiles) {
        // Validate file
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 50MB)`);
          continue;
        }

        // Read file content
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        // Save to database
        const savedFile = await dbHelpers.saveUploadedFile(
          userId,
          file,
          content
        );

        // Update progress
        setUploadProgress((prev) => prev + 100 / acceptedFiles.length);

        // Add to local state
        setUploadedFiles((prev) => [savedFile, ...prev]);

        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/vtt": [".vtt"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  // Process selected files
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to process");
      return;
    }

    setIsProcessing(true);
    try {
      for (const fileId of selectedFiles) {
        // Mark file as processed
        await dbHelpers.updateUploadedFile(fileId, { is_processed: true });
      }

      // Refresh file list
      const files = await dbHelpers.getUploadedFiles(userId);
      setUploadedFiles(files);
      setSelectedFiles([]);

      toast.success(`${selectedFiles.length} files processed successfully`);
      navigate("/call-insights");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Fireflies file processing
  const handleFirefliesProcess = async (firefliesFile) => {
    try {
      setIsProcessing(true);

      // Get detailed transcript data
      const transcriptData = await firefliesService.getTranscriptById(
        firefliesFile.id
      );

      if (!transcriptData?.success || !transcriptData?.data?.transcript) {
        throw new Error("Failed to fetch transcript data");
      }

      // Create call insight entry
      const insightData = {
        fireflies_id: firefliesFile.id,
        type: "fireflies_import",
        extracted_transcript: transcriptData.data.transcript,
        processing_status: "completed",
        company_details: {
          name: firefliesFile.companyName,
        },
        prospect_details: [
          {
            name: firefliesFile.prospectName,
            title: "Prospect",
          },
        ],
        call_summary: firefliesFile.firefliesSummary,
      };

      await dbHelpers.createCallInsight(userId, null, insightData);

      // Mark as processed
      await dbHelpers.updateFirefliesFile(firefliesFile.id, {
        is_processed: true,
      });

      toast.success(`${firefliesFile.callId} processed successfully`);
      navigate("/call-insights");
    } catch (error) {
      console.error("Fireflies processing error:", error);
      toast.error("Failed to process Fireflies transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      // Remove from database (this will also trigger storage cleanup)
      await dbHelpers.updateUploadedFile(fileToDelete.id, {
        is_processed: false,
      });

      // Remove from local state
      setUploadedFiles((prev) =>
        prev.filter((file) => file.id !== fileToDelete.id)
      );

      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  // Filter files based on search and status
  const filteredUploadedFiles = uploadedFiles.filter((file) => {
    const matchesSearch = file.filename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "processed" && file.is_processed) ||
      (statusFilter === "unprocessed" && !file.is_processed);

    return matchesSearch && matchesStatus;
  });

  const filteredFirefliesFiles = firefliesFiles.filter((file) => {
    const matchesSearch =
      file.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.prospectName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // File selection handling
  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredUploadedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredUploadedFiles.map((file) => file.id));
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading state while checking authentication
  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sales Calls
          </h1>
          <p className="text-muted-foreground">
            Import call transcripts from Fireflies.ai or upload your own files
            for AI-powered analysis and insights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-xs">
            <Phone className="w-3 h-3 mr-1" />
            {uploadedFiles.length + firefliesFiles.length} Total Calls
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fireflies" className="flex items-center space-x-2">
            <ExternalLink className="w-4 h-4" />
            <span>Fireflies.ai Imports</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Transcript</span>
          </TabsTrigger>
        </TabsList>

        {/* Fireflies.ai Tab */}
        <TabsContent value="fireflies" className="mt-6">
          <div className="space-y-6">
            {/* Company/Prospect Dropdowns */}
            <CompanyProspectDropdowns />

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search calls by title, company, or prospect..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLoadingFireflies(true);
                      firefliesService
                        .getTranscripts()
                        .then(setFirefliesFiles)
                        .finally(() => setIsLoadingFireflies(false));
                    }}
                    disabled={isLoadingFireflies}
                  >
                    <RefreshCw
                      className={cn(
                        "w-4 h-4 mr-1",
                        isLoadingFireflies && "animate-spin"
                      )}
                    />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fireflies Files List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Fireflies.ai Transcripts</span>
                  <Badge variant="secondary">
                    {filteredFirefliesFiles.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFireflies ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">
                      Loading Fireflies transcripts...
                    </p>
                  </div>
                ) : filteredFirefliesFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No Fireflies transcripts found</p>
                    <p className="text-sm">
                      Connect your Fireflies.ai account to import call
                      transcripts automatically
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFirefliesFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium">{file.callId}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{file.companyName}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{file.prospectName}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{file.date}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{file.duration}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              file.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {file.status === "completed" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {file.status}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFirefliesProcess(file)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-6">
          <div className="space-y-6">
            {/* Company/Prospect Dropdowns */}
            <CompanyProspectDropdowns />

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Call Transcripts</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-lg font-medium">Drop files here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drag & drop transcript files here
                      </p>
                      <p className="text-muted-foreground mb-4">
                        or click to browse files
                      </p>
                      <Button variant="outline">Choose Files</Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: TXT, VTT, PDF (max 50MB per file)
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uploading...</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search uploaded files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Files</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="unprocessed">Unprocessed</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedFiles.length > 0 && (
                    <Button
                      onClick={handleProcessFiles}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      Process {selectedFiles.length} Files
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Uploaded Files</span>
                    <Badge variant="secondary">
                      {filteredUploadedFiles.length}
                    </Badge>
                  </div>

                  {filteredUploadedFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedFiles.length === filteredUploadedFiles.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No uploaded files found</p>
                    <p className="text-sm">
                      Upload transcript files to get started with AI analysis
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                            className="rounded border-border"
                          />

                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium">{file.filename}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{formatDate(file.created_at)}</span>
                              <span className="capitalize">{file.file_type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              file.is_processed ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {file.is_processed ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {file.is_processed ? "Processed" : "Pending"}
                          </Badge>

                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFileToDelete(file);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{fileToDelete?.filename}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesCalls;
export { SalesCalls };