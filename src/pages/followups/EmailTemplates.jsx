import React from "react";
import ContentGenerationEngine from "@/components/ContentGenerationEngine";
import { usePageTimer } from "@/hooks/userPageTimer";

export const EmailTemplates = () => {
  usePageTimer("Email Templates");

  return (
    <div>
      <ContentGenerationEngine defaultArtefactType="email" />
    </div>
  );
};

export default EmailTemplates;
