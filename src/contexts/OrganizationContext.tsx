import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  student_term: string;
  tutor_term: string;
  lesson_term: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_plan: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  membership: OrganizationMember | null;
  isLoading: boolean;
  isOrgAdmin: boolean;
  isOrgOwner: boolean;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  terms: {
    student: string;
    students: string;
    tutor: string;
    tutors: string;
    lesson: string;
    lessons: string;
  };
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user?.id) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all organizations the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select(`
          *,
          organizations (*)
        `)
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const orgs = memberships
        ?.map((m: any) => m.organizations)
        .filter(Boolean) as Organization[];

      setOrganizations(orgs || []);

      // Get saved org from localStorage or use first org
      const savedOrgId = localStorage.getItem(`current_org_${user.id}`);
      const savedOrg = orgs?.find((o) => o.id === savedOrgId);
      const currentOrg = savedOrg || orgs?.[0] || null;

      setCurrentOrganization(currentOrg);

      // Set current membership
      if (currentOrg) {
        const currentMembership = memberships?.find(
          (m: any) => m.organization_id === currentOrg.id
        ) as OrganizationMember;
        setMembership(currentMembership || null);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user?.id]);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org && user?.id) {
      setCurrentOrganization(org);
      localStorage.setItem(`current_org_${user.id}`, orgId);
      
      // Update membership for the new org
      supabase
        .from("organization_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("organization_id", orgId)
        .single()
        .then(({ data }) => {
          setMembership(data as OrganizationMember);
        });
    }
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  const isOrgAdmin = membership?.role === "admin" || membership?.is_owner === true;
  const isOrgOwner = membership?.is_owner === true;

  // Custom terminology
  const terms = {
    student: currentOrganization?.student_term?.replace(/s$/i, "") || "Student",
    students: currentOrganization?.student_term || "Students",
    tutor: currentOrganization?.tutor_term?.replace(/s$/i, "") || "Tutor",
    tutors: currentOrganization?.tutor_term || "Tutors",
    lesson: currentOrganization?.lesson_term?.replace(/s$/i, "") || "Lesson",
    lessons: currentOrganization?.lesson_term || "Lessons",
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        membership,
        isLoading,
        isOrgAdmin,
        isOrgOwner,
        switchOrganization,
        refreshOrganizations,
        terms,
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
