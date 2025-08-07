import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Building, User, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProspectCarousel = ({ 
  prospects = [], 
  selectedProspect, 
  onProspectSelect,
  showStakeholders = false 
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false
  });
  
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (prospects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="mb-2">No prospects available</p>
        <p className="text-sm">Process some call transcripts first to generate prospects.</p>
      </div>
    );
  }

  // If 4 or fewer prospects, show them in a simple grid without carousel
  if (prospects.length <= 4) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prospects.map((prospect) => (
          <div
            key={prospect.id}
            className={cn(
              "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
              selectedProspect?.id === prospect.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onProspectSelect(prospect)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm truncate">{prospect.companyName}</h4>
                {prospect.people?.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {prospect.people.map(p => p.name).join(', ')}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs", getStatusColor(prospect.status))}
              >
                {prospect.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>{prospect.dealValue}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{prospect.people?.length || 0} contacts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show carousel for more than 4 prospects
  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {prospects.map((prospect) => (
            <div
              key={prospect.id}
              className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 first:pl-0"
            >
              <div
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md h-full",
                  selectedProspect?.id === prospect.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onProspectSelect(prospect)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{prospect.companyName}</h4>
                    {prospect.people?.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {prospect.people.map(p => p.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs ml-2 flex-shrink-0", getStatusColor(prospect.status))}
                  >
                    {prospect.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="truncate">{prospect.dealValue}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{prospect.people?.length || 0} contacts</span>
                  </div>
                </div>

                {showStakeholders && prospect.stakeholders && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <h5 className="text-xs font-medium mb-2">Key Stakeholders</h5>
                    <div className="space-y-1">
                      {prospect.stakeholders.slice(0, 2).map((stakeholder, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate">{stakeholder.name}</span>
                          <Badge variant="outline" className="text-xs ml-1 flex-shrink-0">
                            {stakeholder.style}
                          </Badge>
                        </div>
                      ))}
                      {prospect.stakeholders.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{prospect.stakeholders.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        {/* Dots Indicator */}
        <div className="flex items-center space-x-2">
          {Array.from({ length: Math.ceil(prospects.length / 3) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === Math.floor(selectedIndex / 3)
                  ? "bg-primary"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => emblaApi?.scrollTo(index * 3)}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={scrollNext}
          disabled={nextBtnDisabled}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Prospect Counter */}
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          Showing {Math.min(selectedIndex + 3, prospects.length)} of {prospects.length} prospects
        </p>
      </div>
    </div>
  );
};