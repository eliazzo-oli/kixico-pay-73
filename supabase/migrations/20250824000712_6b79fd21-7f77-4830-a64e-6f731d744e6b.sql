-- Create trigger for automatic profile creation when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert admin user directly (you'll need to use this email/password to login)
-- Email: admin@kixicopay.com
-- Password: admin123456
-- Note: This creates the user in auth.users and the trigger will create the profile automatically
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@kixicopay.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Administrador"}',
  false,
  '',
  '',
  '',
  ''
);

-- Get the admin user ID and add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@kixicopay.com';