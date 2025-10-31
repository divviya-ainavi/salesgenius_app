import React from "react";
import ContentGenerationEngine from "@/components/ContentGenerationEngine";
import { usePageTimer } from "@/hooks/userPageTimer";

export const DeckBuilder = () => {
  usePageTimer("Presentation Prompt Builder");

  return (
    <div>
      <ContentGenerationEngine defaultArtefactType="presentation" />
    </div>
  );
};

export default DeckBuilder;
