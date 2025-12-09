-- Drop the existing insert policy for organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create a proper insert policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure organization_members has proper insert policy for new owners
DROP POLICY IF EXISTS "Users can create their own org membership" ON public.organization_members;

CREATE POLICY "Users can create their own org membership" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  (is_owner = true OR is_org_admin(auth.uid(), organization_id))
);