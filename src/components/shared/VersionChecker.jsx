import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const VersionChecker = () => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const STORAGE_KEY = 'app_version';
  const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = () => {
    try {
      const storedVersion = localStorage.getItem(STORAGE_KEY);

      if (storedVersion && storedVersion !== currentVersion) {
        setShowUpdateDialog(true);
      } else if (!storedVersion) {
        localStorage.setItem(STORAGE_KEY, currentVersion);
      }
    } catch (error) {
      console.error('Error checking version:', error);
    }
  };

  const clearAllData = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const handleUpdate = async () => {
    await clearAllData();
    window.location.reload(true);
  };

  return (
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <span>New Version Available</span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            A new version of the application is available. To ensure the best experience,
            we need to reload the page and clear cached data.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Current Version:</span>
              <span className="font-medium">{localStorage.getItem(STORAGE_KEY) || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span>New Version:</span>
              <span className="font-medium">{currentVersion}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpdate}
            className="w-full"
          >
            Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VersionChecker;
