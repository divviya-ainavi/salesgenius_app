@@ .. @@
   const handleUpgrade = async (plan) => {
     if (!plan.stripe_price_id) {
       toast.error("This plan is not available for purchase yet");
       return;
     }
 
     setIsProcessingPayment(true);
 
     try {
       console.log("🔄 Creating checkout session for plan:", plan.plan_name);
 
       const payload = {
         userid: user.id,
         plan_id: plan.stripe_price_id,
         emailid: user.email,
         dbplan_id: plan.id,
+        name: user.full_name || user.email,
       };
 
       const response = await fetch(
         `${import.meta.env.VITE_API_BASE_URL}checkout-session`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify(payload),
         }
       );