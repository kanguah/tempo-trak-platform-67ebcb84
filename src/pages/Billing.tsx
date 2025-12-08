import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Check, Crown, Zap, Building2, Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    currency: "USD",
    period: "month",
    features: [
      "Up to 50 students",
      "Up to 5 tutors",
      "Basic reporting",
      "Email support",
      "SMS notifications",
    ],
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    currency: "USD",
    period: "month",
    features: [
      "Up to 200 students",
      "Up to 20 tutors",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "API access",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    currency: "USD",
    period: "month",
    features: [
      "Unlimited students",
      "Unlimited tutors",
      "White-label solution",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export default function Billing() {
  const { currentOrganization, isOrgOwner, refreshOrganizations } = useOrganization();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const trialDaysRemaining = currentOrganization?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(currentOrganization.trial_ends_at), new Date()))
    : 0;

  const isTrialActive = currentOrganization?.subscription_status === "trial" && trialDaysRemaining > 0;
  const isTrialExpired = currentOrganization?.subscription_status === "trial" && trialDaysRemaining <= 0;

  const handleSubscribe = async (planId: string) => {
    if (!isOrgOwner) {
      toast({
        title: "Permission denied",
        description: "Only organization owners can manage billing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-flutterwave-payment", {
        body: {
          organization_id: currentOrganization?.id,
          plan_id: planId,
        },
      });

      if (error) throw error;

      if (data?.payment_link) {
        window.location.href = data.payment_link;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and payment methods</p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold capitalize">
                    {currentOrganization?.subscription_plan || "Trial"}
                  </h3>
                  {isTrialActive && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      {trialDaysRemaining} days left
                    </Badge>
                  )}
                  {isTrialExpired && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Trial Expired
                    </Badge>
                  )}
                  {currentOrganization?.subscription_status === "active" && (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {currentOrganization?.name}
                </p>
              </div>
              
              {currentOrganization?.trial_ends_at && isTrialActive && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Trial ends on</p>
                  <p className="font-semibold">
                    {format(new Date(currentOrganization.trial_ends_at), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>

            {isTrialExpired && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Your trial has expired</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Subscribe to a plan below to continue using all features.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular ? "border-primary shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Crown className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.id === "enterprise" && <Zap className="h-5 w-5 text-yellow-500" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={
                      isLoading === plan.id ||
                      currentOrganization?.subscription_plan === plan.id ||
                      !isOrgOwner
                    }
                  >
                    {isLoading === plan.id ? (
                      "Processing..."
                    ) : currentOrganization?.subscription_plan === plan.id ? (
                      "Current Plan"
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Payments are processed securely via Flutterwave. We support credit/debit cards,
              mobile money, and bank transfers across Africa.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
