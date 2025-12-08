import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  student_term: string | null;
  tutor_term: string | null;
  lesson_term: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  trial_ends_at: string | null;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  is_owner: boolean | null;
  organization: Organization;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  memberRole: string | null;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  needsOnboarding: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const CURRENT_ORG_KEY = "currentOrganizationId";

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setMemberships([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's organization memberships with organization details
      const { data: memberData, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          is_owner,
          organization:organizations (
            id,
            name,
            slug,
            logo_url,
            primary_color,
            secondary_color,
            student_term,
            tutor_term,
            lesson_term,
            subscription_status,
            subscription_plan,
            trial_ends_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!memberData || memberData.length === 0) {
        // User has no organizations - needs onboarding
        setNeedsOnboarding(true);
        setOrganizations([]);
        setMemberships([]);
        setCurrentOrganization(null);
        setIsLoading(false);
        return;
      }

      // Transform data
      const orgs = memberData
        .map((m: any) => m.organization)
        .filter((org: Organization | null): org is Organization => org !== null);
      
      const members = memberData.map((m: any) => ({
        ...m,
        organization: m.organization
      })) as OrganizationMember[];

      setOrganizations(orgs);
      setMemberships(members);
      setNeedsOnboarding(false);

      // Determine which org to set as current
      const savedOrgId = localStorage.getItem(CURRENT_ORG_KEY);
      const savedOrg = orgs.find(o => o.id === savedOrgId);
      
      if (savedOrg) {
        setCurrentOrganization(savedOrg);
      } else if (orgs.length > 0) {
        setCurrentOrganization(orgs[0]);
        localStorage.setItem(CURRENT_ORG_KEY, orgs[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!isLoading && needsOnboarding && user && location.pathname !== '/onboarding' && location.pathname !== '/auth') {
      navigate('/onboarding');
    }
  }, [isLoading, needsOnboarding, user, location.pathname, navigate]);

  const switchOrganization = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem(CURRENT_ORG_KEY, orgId);
      toast.success(`Switched to ${org.name}`);
    }
  }, [organizations]);

  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  // Get current membership details
  const currentMembership = memberships.find(
    m => m.organization_id === currentOrganization?.id
  );

  const isOwner = currentMembership?.is_owner ?? false;
  const isAdmin = currentMembership?.role === 'admin' || isOwner;
  const memberRole = currentMembership?.role ?? null;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isLoading,
        isOwner,
        isAdmin,
        memberRole,
        switchOrganization,
        refreshOrganizations,
        needsOnboarding,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
