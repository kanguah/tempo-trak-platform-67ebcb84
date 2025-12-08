-- Drop and recreate the organizations INSERT policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Make sure the organization_members INSERT policy allows users to add themselves as owners
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;

CREATE POLICY "Users can create their own org membership" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  (is_owner = true OR is_org_admin(auth.uid(), organization_id))
);