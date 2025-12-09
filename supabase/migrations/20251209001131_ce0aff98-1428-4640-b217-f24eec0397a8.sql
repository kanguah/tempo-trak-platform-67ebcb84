-- Drop and recreate organization insert policy with explicit role
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also check organization_members - drop and recreate
DROP POLICY IF EXISTS "Users can create their own org membership" ON public.organization_members;

-- Create a simpler policy that allows users to create membership for themselves as owner
CREATE POLICY "Users can create org membership as owner" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);