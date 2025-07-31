import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  X,
  ThumbsUp,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { useSelector } from "react-redux";

interface FeedbackFormData {
  whatYouLike: string;
  whatNeedsImproving: string;
  newFeaturesNeeded: string;
}

export const FeedbackWidget = () => {
  const location = useLocation();
  const {
    userProfileInfo,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    whatYouLike: "",
    whatNeedsImproving: "",
    newFeaturesNeeded: "",
  });

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // console.log(location.pathname, pageName, "location.pathname");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current Supabase Auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    const pageName =
      location.pathname == "/research"
        ? "Research"
        : location.pathname == "/calls"
        ? "Sales Calls"
        : location.pathname == "/call-insights"
        ? "Call Insights"
        : location.pathname == "/follow-ups/emails"
        ? "Emails"
        : location.pathname == "/follow-ups/decks"
        ? "Presentation"
        : location.pathname == "/follow-ups/actions"
        ? "Actions"
        : location.pathname == "/analytics"
        ? "Analytics"
        : location.pathname == "/settings"
        ? "Settings"
        : "";
    // Validate that at least one field is filled
    const hasContent = Object.values(formData).some(
      (value) => value.trim().length > 0
    );
    if (!hasContent) {
      toast.error("Please provide feedback in at least one field");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate session ID
      const sessionId = `${CURRENT_USER.id}_${Date.now()}`;

      // Prepare feedback data
      const feedbackData = {
        user_id: user?.id,
        auth_user_id: authUser.id,
        organization_id: user?.organization_id || organizationDetails?.id,
        page_url: window.location.href,
        page_route: pageName,
        what_you_like: formData.whatYouLike.trim() || null,
        what_needs_improving: formData.whatNeedsImproving.trim() || null,
        new_features_needed: formData.newFeaturesNeeded.trim() || null,
        session_id: sessionId,
        user_agent: navigator.userAgent,
      };

      // Save feedback to database
      await dbHelpers.saveFeedbackTesting(feedbackData);

      // Track analytics
      analytics.track("feedback_submitted", {
        page_route: location.pathname,
        has_likes: !!formData.whatYouLike.trim(),
        has_improvements: !!formData.whatNeedsImproving.trim(),
        has_feature_requests: !!formData.newFeaturesNeeded.trim(),
        total_characters: Object.values(formData).join("").length,
      });

      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");

      // Reset form after a delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setFormData({
          whatYouLike: "",
          whatNeedsImproving: "",
          newFeaturesNeeded: "",
        });
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setIsSubmitted(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {userRoleId != null && (
            <Button
              className={cn(
                "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "border-2 border-white/20"
              )}
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Feedback
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            if (isSubmitting) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Share Your Feedback</span>
            </DialogTitle>
            <DialogDescription>
              Help us improve SalesGenius.ai by sharing your thoughts and
              suggestions. Your feedback is valuable to us!
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            // Success State
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-center">
                Thank You for Your Feedback!
              </h3>
              <p className="text-sm text-center text-muted-foreground max-w-md">
                Your insights help us make SalesGenius.ai better for everyone.
                We'll review your feedback and use it to improve the platform.
              </p>
            </div>
          ) : (
            // Feedback Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question 1: What do you like? */}
              <div className="space-y-2">
                <Label
                  htmlFor="what-you-like"
                  className="flex items-center space-x-2 text-sm font-medium"
                >
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>What do you like about SalesGenius.ai?</span>
                </Label>
                <Textarea
                  id="what-you-like"
                  placeholder="Tell us what's working well for you..."
                  value={formData.whatYouLike}
                  onChange={(e) =>
                    handleInputChange("whatYouLike", e.target.value)
                  }
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 2: What needs improving? */}
              <div className="space-y-2">
                <Label
                  htmlFor="what-needs-improving"
                  className="flex items-center space-x-2 text-sm font-medium"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>What needs improving?</span>
                </Label>
                <Textarea
                  id="what-needs-improving"
                  placeholder="Share what could be better or any issues you've encountered..."
                  value={formData.whatNeedsImproving}
                  onChange={(e) =>
                    handleInputChange("whatNeedsImproving", e.target.value)
                  }
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 3: What new features would benefit you? */}
              <div className="space-y-2">
                <Label
                  htmlFor="new-features-needed"
                  className="flex items-center space-x-2 text-sm font-medium"
                >
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span>What new features would benefit you?</span>
                </Label>
                <Textarea
                  id="new-features-needed"
                  placeholder="Suggest new features or capabilities you'd like to see..."
                  value={formData.newFeaturesNeeded}
                  onChange={(e) =>
                    handleInputChange("newFeaturesNeeded", e.target.value)
                  }
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Current Page Info */}
              {/* <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Current page:</span>{" "}
                  {location.pathname}
                </p>
              </div> */}
            </form>
          )}

          {!isSubmitted && (
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
