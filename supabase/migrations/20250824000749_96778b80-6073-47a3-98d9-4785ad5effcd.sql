-- Insert admin user directly (you'll need to use this email/password to login)
-- Email: admin@kixicopay.com
-- Password: admin123456
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

-- Create profile for admin user
INSERT INTO public.profiles (user_id, name, email)
SELECT id, 'Administrador', 'admin@kixicopay.com'
FROM auth.users 
WHERE email = 'admin@kixicopay.com';

-- Add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@kixicopay.com';