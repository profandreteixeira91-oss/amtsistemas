
DO $$
DECLARE
  v_user_id uuid;
  v_empresa_id uuid;
BEGIN
  -- Cria ou reaproveita usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ateixeira@rest.com.br';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated','authenticated',
      'ateixeira@rest.com.br',
      crypt('Teste@2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome','Administrador Teixeira'),
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', 'ateixeira@rest.com.br', 'email_verified', true),
            'email', v_user_id::text, now(), now(), now());
  END IF;

  -- Cria nova empresa
  INSERT INTO public.empresas (nome_fantasia, razao_social, criada_por)
  VALUES ('Restaurante Teste AMT', 'Restaurante Teste AMT LTDA', v_user_id)
  RETURNING id INTO v_empresa_id;

  -- Garante vínculo admin (o trigger tg_empresa_criada já faz isso, mas reforçamos)
  INSERT INTO public.membros (user_id, empresa_id, role, ativo)
  VALUES (v_user_id, v_empresa_id, 'admin', true)
  ON CONFLICT DO NOTHING;
END $$;
