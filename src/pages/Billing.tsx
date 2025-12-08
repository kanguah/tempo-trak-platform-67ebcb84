import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  Loader2,
  Calendar,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    currency: 'GHS',
    period: 'month',
    features: [
      'Up to 50 students',
      'Up to 10 tutors',
      'Basic reporting',
      'Email support',
      'Payment tracking',
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    currency: 'GHS',
    period: 'month',
    features: [
      'Up to 200 students',
      'Up to 50 tutors',
      'Advanced analytics',
      'Priority support',
      'SMS messaging',
      'Automated reminders',
      'Custom branding',
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'GHS',
    period: 'month',
    features: [
      'Unlimited students',
      'Unlimited tutors',
      'Full analytics suite',
      'Dedicated support',
      'API access',
      'Multi-branch support',
      'White-label option',
      'Custom integrations',
    ],
    icon: Building2,
    popular: false,
  },
];

export default function Billing() {
  const { currentOrganization, refreshOrganizations, isOwner } = useOrganization();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentPlan = currentOrganization?.subscription_plan || 'trial';
  const subscriptionStatus = currentOrganization?.subscription_status || 'trial';
  const trialEndsAt = currentOrganization?.trial_ends_at;

  const daysRemaining = trialEndsAt 
    ? differenceInDays(new Date(trialEndsAt), new Date())
    : 0;

  const handleSubscribe = async (planId: string) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (!isOwner) {
      toast.error('Only organization owners can manage billing');
      return;
    }

    setIsLoading(planId);

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan');

      // Call Flutterwave payment edge function
      const { data, error } = await supabase.functions.invoke('create-flutterwave-payment', {
        body: {
          organization_id: currentOrganization.id,
          plan_id: planId,
          plan_name: plan.name,
          amount: plan.price,
          currency: plan.currency,
          redirect_url: `${window.location.origin}/billing?status=success`,
        },
      });

      if (error) throw error;

      if (data?.link) {
        // Redirect to Flutterwave payment page
        window.location.href = data.link;
      } else {
        throw new Error('No payment link returned');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusBadge = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-8 animate-fade-in max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your current subscription status</CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold capitalize">
                  {currentPlan === 'trial' ? 'Free Trial' : currentPlan}
                </p>
                {subscriptionStatus === 'trial' && trialEndsAt && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0 
                        ? `${daysRemaining} days remaining (ends ${format(new Date(trialEndsAt), 'MMM d, yyyy')})`
                        : 'Trial expired'}
                    </span>
                  </div>
                )}
              </div>
              {subscriptionStatus === 'trial' && daysRemaining <= 7 && daysRemaining > 0 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Trial ending soon</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id && subscriptionStatus === 'active';
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                    </div>
                    <div className="pt-4">
                      <span className="text-3xl font-bold">{plan.currency} {plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.popular ? 'gradient-primary text-primary-foreground' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || isLoading !== null || !isOwner}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {isLoading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
            <CardDescription>Secure payments powered by Flutterwave</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Card payments</span>
              </div>
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Mobile Money</span>
              </div>
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Bank Transfer</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              All payments are processed securely. You can cancel your subscription at any time.
            </p>
          </CardContent>
        </Card>

        {!isOwner && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Only organization owners can manage billing settings.</span>
          </div>
        )}
      </div>
    </div>
  );
}
