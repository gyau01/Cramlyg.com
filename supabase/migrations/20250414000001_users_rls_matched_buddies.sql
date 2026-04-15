-- Allow reading public.users rows for people you are matched with (chat, match cards).
-- Existing policy still restricts other rows to "own user only"; this policy ORs in matches.

DROP POLICY IF EXISTS "Users can view matched buddies" ON public.users;
CREATE POLICY "Users can view matched buddies" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user1_id = auth.uid()::text AND m.user2_id = users.user_id)
       OR (m.user2_id = auth.uid()::text AND m.user1_id = users.user_id)
  )
);
