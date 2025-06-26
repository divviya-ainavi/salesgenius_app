import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export const usePageTimer = (pageName) => {
    const startTimeRef = useRef(null);

    useEffect(() => {
        startTimeRef.current = Date.now();

        return () => {
            const endTime = Date.now();
            const durationInSeconds = Math.round((endTime - startTimeRef.current) / 1000);

            posthog.capture('page_time_spent', {
                page: pageName,
                duration: durationInSeconds,
                duration_minutes: Math.round(durationInSeconds / 60 * 100) / 100, // Convert to minutes with 2 decimal places
            });

            console.log(`Page timer: ${pageName} - ${durationInSeconds}s`);
        };
    }, [pageName]);
};