import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";

export function CookiesDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookies-accepted');
    if (!cookiesAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookies-accepted', 'false');
    // Clear any existing tracking data
    localStorage.removeItem('product-clicks');
    setIsVisible(false);
  };

  const closeBanner = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg">
        <div className="flex items-start gap-4 p-4">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Cookie Notice</h3>
              <p className="text-sm text-muted-foreground">
                We use essential cookies to remember your product clicks for popularity rankings. 
                We do not use any third-party tracking cookies or analytics. Your privacy is important to us.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={acceptCookies}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Accept Cookies
              </Button>
              <Button 
                onClick={rejectCookies}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Reject Cookies
              </Button>
            </div>
          </div>
          <Button
            onClick={closeBanner}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}