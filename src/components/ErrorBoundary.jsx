import React from 'react';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { AlertTriangle, RefreshCw } from 'lucide-react';

   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false, error: null };
     }

     static getDerivedStateFromError(error) {
       return { hasError: true, error };
     }

     componentDidCatch(error, errorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
     }

     render() {
       if (this.state.hasError) {
         return (
           <Card className="max-w-md mx-auto mt-8">
             <CardHeader>
               <CardTitle className="flex items-center space-x-2 text-destructive">
                 <AlertTriangle className="w-5 h-5" />
                 <span>Something went wrong</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">
                 We encountered an error while loading this component.
               </p>
               <Button 
                 onClick={() => window.location.reload()} 
                 className="w-full"
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 Reload Page
               </Button>
             </CardContent>
           </Card>
         );
       }

       return this.props.children;
     }
   }

   export default ErrorBoundary;