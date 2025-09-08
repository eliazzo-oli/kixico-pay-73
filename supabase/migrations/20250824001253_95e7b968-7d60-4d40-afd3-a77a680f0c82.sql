-- Add admin role to user eliasoliveirae792@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('b3f9953a-534d-44ee-a661-3b677e839147', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;