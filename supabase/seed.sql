-- DaanSetu development/demo seed
--
-- This file is intentionally separate from schema migrations. It is safe to run
-- repeatedly: every generated record has a deterministic UUID or unique key and
-- inserts use conflict handling. All people, organizations, payments, and impact
-- records are fictional and exist only for UI development and demonstrations.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.seed_uuid (seed_key TEXT) RETURNS UUID LANGUAGE SQL IMMUTABLE AS $$
  SELECT MD5(seed_key)::UUID;
$$;

-- ---------------------------------------------------------------------------
-- Authentication and public identities: 180 supporters, 24 NGO owners,
-- 12 corporate owners, and 4 administrators (220 total).
-- Shared development password: DaanSetuDemo@2026
-- ---------------------------------------------------------------------------
WITH
  seed_users AS (
    SELECT
      pg_temp.seed_uuid ('supporter:' || sequence) AS id,
      'supporter' || LPAD(sequence::TEXT, 3, '0') || '@demo.daansetu.local' AS email,
      (
        ARRAY[
          'Aarav',
          'Aditi',
          'Advait',
          'Ananya',
          'Arjun',
          'Avni',
          'Dev',
          'Diya',
          'Ishaan',
          'Isha',
          'Kabir',
          'Kavya',
          'Krish',
          'Meera',
          'Neel',
          'Nisha',
          'Pranav',
          'Rhea',
          'Rohan',
          'Saanvi',
          'Samar',
          'Siya',
          'Vihaan',
          'Zoya'
        ]
      ) [((sequence - 1) % 24) + 1] || ' ' || (
        ARRAY[
          'Sharma',
          'Patel',
          'Das',
          'Reddy',
          'Nair',
          'Singh',
          'Gupta',
          'Iyer',
          'Mehta',
          'Joshi',
          'Khan',
          'Bose',
          'Pillai',
          'Mishra',
          'Kapoor'
        ]
      ) [((sequence - 1) % 15) + 1] AS full_name,
      'supporter' AS account_type,
      sequence
    FROM
      GENERATE_SERIES(1, 180) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('ngo-owner:' || sequence),
      'ngo' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local',
      'NGO Coordinator ' || LPAD(sequence::TEXT, 2, '0'),
      'ngo',
      180 + sequence
    FROM
      GENERATE_SERIES(1, 24) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('corporate-owner:' || sequence),
      'corporate' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local',
      'CSR Lead ' || LPAD(sequence::TEXT, 2, '0'),
      'corporate',
      204 + sequence
    FROM
      GENERATE_SERIES(1, 12) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('admin:' || sequence),
      'admin' || sequence || '@demo.daansetu.local',
      'Platform Administrator ' || sequence,
      'admin',
      216 + sequence
    FROM
      GENERATE_SERIES(1, 4) AS sequence
  )
INSERT INTO
  auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
SELECT
  '00000000-0000-0000-0000-000000000000'::UUID,
  id,
  'authenticated',
  'authenticated',
  email,
  CRYPT ('DaanSetuDemo@2026', GEN_SALT ('bf')),
  NOW() - ((221 - sequence) || ' hours')::INTERVAL,
  '{"provider":"email","providers":["email"]}'::JSONB,
  JSONB_BUILD_OBJECT(
    'name',
    full_name,
    'full_name',
    full_name,
    'account_type',
    account_type,
    'seed_data',
    TRUE
  ),
  NOW() - ((221 - sequence) || ' hours')::INTERVAL,
  NOW(),
  '',
  '',
  '',
  ''
FROM
  seed_users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

WITH
  seed_users AS (
    SELECT
      pg_temp.seed_uuid ('supporter:' || sequence) AS id,
      'supporter' || LPAD(sequence::TEXT, 3, '0') || '@demo.daansetu.local' AS email
    FROM
      GENERATE_SERIES(1, 180) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('ngo-owner:' || sequence),
      'ngo' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local'
    FROM
      GENERATE_SERIES(1, 24) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('corporate-owner:' || sequence),
      'corporate' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local'
    FROM
      GENERATE_SERIES(1, 12) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('admin:' || sequence),
      'admin' || sequence || '@demo.daansetu.local'
    FROM
      GENERATE_SERIES(1, 4) AS sequence
  )
INSERT INTO
  auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
SELECT
  pg_temp.seed_uuid ('identity:' || id::TEXT),
  id::TEXT,
  id,
  JSONB_BUILD_OBJECT(
    'sub',
    id::TEXT,
    'email',
    email,
    'email_verified',
    TRUE,
    'seed_data',
    TRUE
  ),
  'email',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '30 days',
  NOW()
FROM
  seed_users
ON CONFLICT (provider_id, provider) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

WITH
  seed_users AS (
    SELECT
      pg_temp.seed_uuid ('supporter:' || sequence) AS id,
      'supporter' || LPAD(sequence::TEXT, 3, '0') || '@demo.daansetu.local' AS email,
      (
        ARRAY[
          'Aarav',
          'Aditi',
          'Advait',
          'Ananya',
          'Arjun',
          'Avni',
          'Dev',
          'Diya',
          'Ishaan',
          'Isha',
          'Kabir',
          'Kavya',
          'Krish',
          'Meera',
          'Neel',
          'Nisha',
          'Pranav',
          'Rhea',
          'Rohan',
          'Saanvi',
          'Samar',
          'Siya',
          'Vihaan',
          'Zoya'
        ]
      ) [((sequence - 1) % 24) + 1] || ' ' || (
        ARRAY[
          'Sharma',
          'Patel',
          'Das',
          'Reddy',
          'Nair',
          'Singh',
          'Gupta',
          'Iyer',
          'Mehta',
          'Joshi',
          'Khan',
          'Bose',
          'Pillai',
          'Mishra',
          'Kapoor'
        ]
      ) [((sequence - 1) % 15) + 1] AS full_name,
      'supporter' AS account_type
    FROM
      GENERATE_SERIES(1, 180) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('ngo-owner:' || sequence),
      'ngo' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local',
      'NGO Coordinator ' || LPAD(sequence::TEXT, 2, '0'),
      'ngo'
    FROM
      GENERATE_SERIES(1, 24) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('corporate-owner:' || sequence),
      'corporate' || LPAD(sequence::TEXT, 2, '0') || '@demo.daansetu.local',
      'CSR Lead ' || LPAD(sequence::TEXT, 2, '0'),
      'corporate'
    FROM
      GENERATE_SERIES(1, 12) AS sequence
    UNION ALL
    SELECT
      pg_temp.seed_uuid ('admin:' || sequence),
      'admin' || sequence || '@demo.daansetu.local',
      'Platform Administrator ' || sequence,
      'admin'
    FROM
      GENERATE_SERIES(1, 4) AS sequence
  )
INSERT INTO
  public.users (id, name, email, role)
SELECT
  id,
  full_name,
  email,
  account_type
FROM
  seed_users
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

INSERT INTO
  public.user_profiles (
    id,
    user_id,
    bio,
    avatar_url,
    location,
    website,
    twitter_handle,
    linkedin_url
  )
SELECT
  pg_temp.seed_uuid ('user-profile:' || sequence),
  pg_temp.seed_uuid ('supporter:' || sequence),
  'I support transparent, community-led change and enjoy contributing to causes that create measurable local impact.',
  '/logo.png',
  (
    ARRAY[
      'Bengaluru, Karnataka',
      'Mumbai, Maharashtra',
      'Delhi, Delhi',
      'Kolkata, West Bengal',
      'Chennai, Tamil Nadu',
      'Pune, Maharashtra',
      'Hyderabad, Telangana',
      'Jaipur, Rajasthan',
      'Kochi, Kerala',
      'Bhubaneswar, Odisha',
      'Ahmedabad, Gujarat',
      'Lucknow, Uttar Pradesh'
    ]
  ) [((sequence - 1) % 12) + 1],
  CASE
    WHEN sequence % 4 = 0 THEN 'https://example.com/supporter-' || sequence
    ELSE NULL
  END,
  CASE
    WHEN sequence % 3 = 0 THEN 'daansetu_supporter_' || sequence
    ELSE NULL
  END,
  CASE
    WHEN sequence % 2 = 0 THEN 'https://linkedin.com/in/daansetu-supporter-' || sequence
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 180) AS sequence
ON CONFLICT (user_id) DO UPDATE
SET
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  location = EXCLUDED.location,
  website = EXCLUDED.website,
  twitter_handle = EXCLUDED.twitter_handle,
  linkedin_url = EXCLUDED.linkedin_url,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- NGO profiles, verification, public programs, updates, galleries, locations,
-- and payout readiness.
-- ---------------------------------------------------------------------------
INSERT INTO
  public.ngos (
    id,
    user_id,
    name,
    display_name,
    legal_name,
    tagline,
    description,
    mission,
    vision,
    theory_of_change,
    program_summary,
    category,
    impact_areas,
    beneficiary_groups,
    core_values,
    organization_type,
    founding_year,
    team_size,
    volunteers_engaged,
    beneficiaries_reached,
    communities_served,
    address_line_1,
    city,
    state,
    postal_code,
    country_code,
    latitude,
    longitude,
    operating_states,
    public_email,
    public_phone,
    website_url,
    social_links,
    logo_path,
    cover_image_path,
    accepts_donations,
    accepts_volunteers,
    accepts_csr,
    tax_exemption_80g,
    profile_status,
    onboarding_step,
    is_discoverable,
    is_verified,
    published_at
  )
SELECT
  pg_temp.seed_uuid ('ngo:' || sequence),
  pg_temp.seed_uuid ('ngo-owner:' || sequence),
  (
    ARRAY[
      'Udaan Learning Foundation',
      'Swasthya Saathi Trust',
      'Annapurna Community Kitchen',
      'Jal Jeevan Collective',
      'Nayi Disha Women Network',
      'Paws and Hope India',
      'Green Roots Alliance',
      'Saksham Disability Forum',
      'Bal Suraksha Mission',
      'Gram Udyam Society',
      'Silver Years Foundation',
      'Sahara Disaster Response',
      'Kala Setu Collective',
      'Nyaya Access Network',
      'Sehat Rural Initiative',
      'Vidya Jyoti Society',
      'Poshan First Foundation',
      'Nadi Rakshak Trust',
      'Asha Livelihood Network',
      'Little Steps India',
      'Care for Elders Trust',
      'Prakriti Animal Rescue',
      'Sambhav Inclusion Foundation',
      'Saathi Community Action'
    ]
  ) [sequence],
  (
    ARRAY[
      'Udaan Learning',
      'Swasthya Saathi',
      'Annapurna Kitchen',
      'Jal Jeevan',
      'Nayi Disha',
      'Paws and Hope',
      'Green Roots',
      'Saksham',
      'Bal Suraksha',
      'Gram Udyam',
      'Silver Years',
      'Sahara Response',
      'Kala Setu',
      'Nyaya Access',
      'Sehat Rural',
      'Vidya Jyoti',
      'Poshan First',
      'Nadi Rakshak',
      'Asha Livelihoods',
      'Little Steps',
      'Care for Elders',
      'Prakriti Rescue',
      'Sambhav Inclusion',
      'Saathi Action'
    ]
  ) [sequence],
  'DaanSetu Demo Organization ' || LPAD(sequence::TEXT, 2, '0') || ' Foundation',
  (
    ARRAY[
      'Every child deserves a classroom',
      'Healthcare within every family''s reach',
      'No neighbour should sleep hungry',
      'Restoring water, restoring futures',
      'Women leading resilient communities',
      'Compassion for every living being'
    ]
  ) [((sequence - 1) % 6) + 1],
  'We work alongside local communities to design practical, accountable programs with transparent goals, regular updates, and measurable outcomes.',
  'To create durable opportunity by placing community knowledge, dignity, and evidence at the centre of every intervention.',
  'An India where geography, identity, income, or ability never limits a person''s chance to thrive.',
  'We combine trusted local partnerships, trained volunteers, direct support, and public measurement to turn resources into lasting outcomes.',
  'Current programs combine direct service delivery, community training, volunteer engagement, and follow-up measurement.',
  (
    ARRAY[
      'education',
      'health',
      'food',
      'environment',
      'women',
      'animals',
      'environment',
      'disability',
      'children',
      'livelihoods',
      'elderly',
      'disaster-relief',
      'arts-culture',
      'human-rights',
      'health',
      'education',
      'food',
      'environment',
      'livelihoods',
      'children',
      'elderly',
      'animals',
      'disability',
      'other'
    ]
  ) [sequence],
  ARRAY[
    (
      ARRAY[
        'education',
        'healthcare',
        'nutrition',
        'environment',
        'women empowerment',
        'animal welfare',
        'inclusion',
        'livelihoods'
      ]
    ) [((sequence - 1) % 8) + 1],
    'community development'
  ],
  ARRAY['children', 'families', 'rural communities'],
  ARRAY['transparency', 'dignity', 'community ownership'],
  (ARRAY['trust', 'society', 'section-8-company']) [((sequence - 1) % 3) + 1],
  1992 + (sequence % 29),
  8 + (sequence * 3),
  45 + (sequence * 17),
  1200 + (sequence * 735),
  6 + (sequence * 2),
  sequence || ', Community Service Road',
  (
    ARRAY[
      'Bengaluru',
      'Mumbai',
      'New Delhi',
      'Kolkata',
      'Chennai',
      'Pune',
      'Hyderabad',
      'Jaipur',
      'Kochi',
      'Bhubaneswar',
      'Ahmedabad',
      'Lucknow'
    ]
  ) [((sequence - 1) % 12) + 1],
  (
    ARRAY[
      'Karnataka',
      'Maharashtra',
      'Delhi',
      'West Bengal',
      'Tamil Nadu',
      'Maharashtra',
      'Telangana',
      'Rajasthan',
      'Kerala',
      'Odisha',
      'Gujarat',
      'Uttar Pradesh'
    ]
  ) [((sequence - 1) % 12) + 1],
  (560001 + sequence)::TEXT,
  'IN',
  (
    ARRAY[
      12.9716,
      19.0760,
      28.6139,
      22.5726,
      13.0827,
      18.5204,
      17.3850,
      26.9124,
      9.9312,
      20.2961,
      23.0225,
      26.8467
    ]
  ) [((sequence - 1) % 12) + 1],
  (
    ARRAY[
      77.5946,
      72.8777,
      77.2090,
      88.3639,
      80.2707,
      73.8567,
      78.4867,
      75.7873,
      76.2673,
      85.8245,
      72.5714,
      80.9462
    ]
  ) [((sequence - 1) % 12) + 1],
  ARRAY[
    (
      ARRAY[
        'Karnataka',
        'Maharashtra',
        'Delhi',
        'West Bengal',
        'Tamil Nadu',
        'Telangana',
        'Rajasthan',
        'Kerala',
        'Odisha',
        'Gujarat',
        'Uttar Pradesh'
      ]
    ) [((sequence - 1) % 11) + 1]
  ],
  'contact+' || sequence || '@demo.daansetu.local',
  '+91 90000 ' || LPAD(sequence::TEXT, 5, '0'),
  'https://example.org/ngo-' || sequence,
  JSONB_BUILD_OBJECT(
    'instagram',
    'https://instagram.com/daansetu_ngo_' || sequence,
    'linkedin',
    'https://linkedin.com/company/daansetu-ngo-' || sequence
  ),
  'demo/logos/logo-' || (((sequence - 1) % 6) + 1) || '.png',
  'demo/covers/cover-' || (((sequence - 1) % 6) + 1) || '.png',
  sequence <= 18,
  sequence % 5 <> 0,
  sequence % 4 <> 0,
  sequence <= 12,
  CASE
    WHEN sequence <= 20 THEN 'published'
    ELSE 'draft'
  END,
  CASE
    WHEN sequence <= 20 THEN 6
    ELSE 2 + (sequence % 4)
  END,
  sequence <= 20,
  sequence <= 14,
  CASE
    WHEN sequence <= 20 THEN NOW() - ((sequence * 7) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 24) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  profile_status = EXCLUDED.profile_status,
  is_discoverable = EXCLUDED.is_discoverable,
  updated_at = NOW();

INSERT INTO
  public.ngo_verifications (
    id,
    ngo_id,
    verification_status,
    legal_name,
    registration_number,
    registration_type,
    registration_date,
    pan_number,
    registered_address,
    ngo_darpan_id,
    has_12a,
    has_80g,
    has_fcra,
    documents_verified,
    submitted_at,
    verified_by,
    reviewed_at,
    verification_date,
    verification_notes
  )
SELECT
  pg_temp.seed_uuid ('ngo-verification:' || sequence),
  pg_temp.seed_uuid ('ngo:' || sequence),
  (
    ARRAY[
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'verified',
      'submitted',
      'changes_requested',
      'rejected',
      'expired',
      'draft',
      'submitted',
      'changes_requested',
      'rejected',
      'expired',
      'draft'
    ]
  ) [sequence],
  'DaanSetu Demo Organization ' || LPAD(sequence::TEXT, 2, '0') || ' Foundation',
  'REG-DEMO-' || LPAD(sequence::TEXT, 5, '0'),
  (ARRAY['trust', 'society', 'section-8-company']) [((sequence - 1) % 3) + 1],
  DATE '2000-01-01' + (sequence * 91),
  'DEMOX' || LPAD(sequence::TEXT, 4, '0') || 'Z',
  sequence || ', Community Service Road, India',
  'DL/2026/' || LPAD(sequence::TEXT, 6, '0'),
  sequence <= 14,
  sequence <= 12,
  sequence % 6 = 0,
  sequence <= 14,
  CASE
    WHEN sequence <= 20 THEN NOW() - INTERVAL '60 days'
    ELSE NULL
  END,
  CASE
    WHEN sequence <= 18 THEN pg_temp.seed_uuid ('admin:1')
    ELSE NULL
  END,
  CASE
    WHEN sequence <= 18 THEN NOW() - INTERVAL '45 days'
    ELSE NULL
  END,
  CASE
    WHEN sequence <= 14 THEN CURRENT_DATE - 45
    ELSE NULL
  END,
  CASE
    WHEN sequence = 16 THEN 'Please provide a clearer registration certificate.'
    WHEN sequence = 17 THEN 'Registration details could not be validated.'
    WHEN sequence = 18 THEN 'Verification validity period has elapsed.'
    ELSE 'Demo verification record for workflow and UI testing.'
  END
FROM
  GENERATE_SERIES(1, 24) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  verification_status = EXCLUDED.verification_status,
  has_80g = EXCLUDED.has_80g,
  documents_verified = EXCLUDED.documents_verified,
  updated_at = NOW();

INSERT INTO
  public.ngo_verification_documents (
    id,
    verification_id,
    ngo_id,
    uploaded_by,
    document_type,
    storage_path,
    original_name,
    mime_type,
    size_bytes,
    encryption_version,
    encrypted_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-document:' || sequence),
  pg_temp.seed_uuid ('ngo-verification:' || sequence),
  pg_temp.seed_uuid ('ngo:' || sequence),
  pg_temp.seed_uuid ('ngo-owner:' || sequence),
  (
    ARRAY[
      'registration',
      'pan',
      '12a',
      '80g',
      'fcra',
      'supporting'
    ]
  ) [((sequence - 1) % 6) + 1],
  'demo/verification/document-' || LPAD(sequence::TEXT, 3, '0') || '.encrypted',
  'verification-document-' || sequence || '.pdf',
  'application/pdf',
  2048 + (sequence * 13),
  1,
  NOW() - INTERVAL '30 days'
FROM
  GENERATE_SERIES(1, 24) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.ngo_programs (
    id,
    ngo_id,
    title,
    summary,
    description,
    category,
    status,
    starts_on,
    ends_on,
    beneficiaries_reached,
    volunteers_needed,
    image_path,
    sort_order
  )
SELECT
  pg_temp.seed_uuid ('ngo-program:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY[
      'Community Learning Hubs',
      'Mobile Health Clinics',
      'Nutrition Support Circles',
      'Water Stewardship Labs',
      'Women Enterprise Cohorts',
      'Volunteer Action Days'
    ]
  ) [((sequence - 1) % 6) + 1] || ' ' || CEIL(sequence / 24.0)::INT,
  'A locally delivered program with clear milestones and public progress reporting.',
  'Community members, trained volunteers, and field coordinators work together through scheduled activities, documented follow-ups, and outcome reviews.',
  (
    ARRAY[
      'education',
      'health',
      'food',
      'environment',
      'women',
      'livelihoods'
    ]
  ) [((sequence - 1) % 6) + 1],
  (ARRAY['active', 'active', 'draft', 'archived']) [((sequence - 1) % 4) + 1],
  CURRENT_DATE - ((sequence % 18) * 30),
  CASE
    WHEN sequence % 4 = 0 THEN CURRENT_DATE - 10
    ELSE CURRENT_DATE + 180
  END,
  80 + (sequence * 19),
  sequence % 16,
  'demo/covers/cover-' || (((sequence - 1) % 6) + 1) || '.png',
  ((sequence - 1) / 24)::INT
FROM
  GENERATE_SERIES(1, 72) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.ngo_updates (
    id,
    ngo_id,
    title,
    body,
    image_path,
    status,
    published_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-update:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY[
      'Field update',
      'Volunteer spotlight',
      'Milestone reached',
      'Monthly report'
    ]
  ) [((sequence - 1) % 4) + 1] || ': cycle ' || CEIL(sequence / 24.0)::INT,
  'This fictional update records completed activities, community feedback, spending progress, and the next measurable milestone for the program.',
  'demo/covers/cover-' || (((sequence - 1) % 6) + 1) || '.png',
  (
    ARRAY['published', 'published', 'draft', 'archived']
  ) [((sequence - 1) % 4) + 1],
  CASE
    WHEN sequence % 4 IN (1, 2) THEN NOW() - (sequence || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 96) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.ngo_gallery_images (
    id,
    ngo_id,
    image_path,
    alt_text,
    caption,
    sort_order,
    is_featured
  )
SELECT
  pg_temp.seed_uuid ('ngo-gallery:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  'demo/covers/cover-' || (((sequence - 1) % 6) + 1) || '.png',
  'Fictional community program activity ' || sequence,
  'Participants and volunteers during a demo program activity.',
  ((sequence - 1) / 24)::INT,
  sequence <= 24
FROM
  GENERATE_SERIES(1, 72) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.ngo_service_areas (
    id,
    ngo_id,
    state,
    district,
    city,
    latitude,
    longitude,
    beneficiaries_reached,
    programs_count,
    sort_order
  )
SELECT
  pg_temp.seed_uuid ('ngo-service-area:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY[
      'Karnataka',
      'Maharashtra',
      'Delhi',
      'West Bengal',
      'Tamil Nadu',
      'Telangana',
      'Rajasthan',
      'Kerala',
      'Odisha',
      'Gujarat',
      'Uttar Pradesh',
      'Madhya Pradesh'
    ]
  ) [((sequence - 1) % 12) + 1],
  'Demo District ' || (((sequence - 1) % 12) + 1),
  (
    ARRAY[
      'Bengaluru',
      'Mumbai',
      'New Delhi',
      'Kolkata',
      'Chennai',
      'Hyderabad',
      'Jaipur',
      'Kochi',
      'Bhubaneswar',
      'Ahmedabad',
      'Lucknow',
      'Bhopal'
    ]
  ) [((sequence - 1) % 12) + 1],
  8.0 + ((sequence * 1.37)::NUMERIC % 25),
  70.0 + ((sequence * 0.79)::NUMERIC % 20),
  400 + (sequence * 43),
  1 + (sequence % 5),
  ((sequence - 1) / 24)::INT
FROM
  GENERATE_SERIES(1, 48) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.payout_accounts (
    id,
    owner_id,
    ngo_id,
    provider,
    gateway_account_id,
    status,
    beneficiary,
    beneficiary_review_note,
    activated_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-payout:' || sequence),
  pg_temp.seed_uuid ('ngo-owner:' || sequence),
  pg_temp.seed_uuid ('ngo:' || sequence),
  'paypal',
  'seed-merchant-ngo-' || sequence,
  (
    ARRAY[
      'active',
      'active',
      'active',
      'pending',
      'restricted',
      'rejected',
      'disabled'
    ]
  ) [((sequence - 1) % 7) + 1],
  JSONB_BUILD_OBJECT(
    'type',
    'ngo',
    'email',
    'payout+' || sequence || '@demo.daansetu.local',
    'seed_data',
    TRUE
  ),
  CASE
    WHEN sequence % 7 = 5 THEN 'Additional beneficiary verification is required.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 7 IN (1, 2, 3) THEN NOW() - INTERVAL '40 days'
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 24) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  beneficiary = EXCLUDED.beneficiary,
  updated_at = NOW();

INSERT INTO
  public.payout_accounts (
    id,
    owner_id,
    provider,
    gateway_account_id,
    status,
    beneficiary,
    activated_at
  )
SELECT
  pg_temp.seed_uuid ('supporter-payout:' || sequence),
  pg_temp.seed_uuid ('supporter:' || sequence),
  'paypal',
  'seed-beneficiary-' || sequence,
  (ARRAY['active', 'pending', 'restricted', 'draft']) [((sequence - 1) % 4) + 1],
  JSONB_BUILD_OBJECT(
    'type',
    'personal_beneficiary',
    'name',
    'Demo Beneficiary ' || sequence,
    'consent',
    TRUE,
    'seed_data',
    TRUE
  ),
  CASE
    WHEN sequence % 4 = 1 THEN NOW() - INTERVAL '20 days'
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 20) AS sequence
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Fundraising campaigns and corporate CSR structures.
-- ---------------------------------------------------------------------------
INSERT INTO
  public.campaigns (
    id,
    ngo_id,
    creator_id,
    payout_account_id,
    title,
    short_description,
    description,
    deadline,
    image_url,
    category,
    status,
    target_paise,
    raised_paise,
    beneficiary,
    beneficiary_consent,
    evidence,
    moderation_notes,
    approved_at,
    published_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-campaign:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  pg_temp.seed_uuid ('ngo-owner:' || (((sequence - 1) % 24) + 1)),
  pg_temp.seed_uuid ('ngo-payout:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY[
      'Equip a Community Classroom',
      'Fund a Mobile Health Camp',
      'Serve Nutritious Family Meals',
      'Restore a Village Water Source',
      'Back Women-Led Microenterprises',
      'Rescue and Rehabilitate Animals',
      'Plant a Native Community Forest',
      'Build Accessible Learning Spaces'
    ]
  ) [((sequence - 1) % 8) + 1] || ' — ' || CEIL(sequence / 8.0)::INT,
  'A transparent campaign with itemized goals, regular updates, and community-verified milestones.',
  'This fictional campaign is designed for development and demo use. It includes a detailed implementation plan, beneficiary safeguards, evidence review, public updates, and payout reconciliation.',
  NOW() + ((30 + (sequence % 330)) || ' days')::INTERVAL,
  '/landing_page_images/how_it_works/' || (
    ARRAY[
      'donations.png',
      'skill_based_volunteering.png',
      'fundraising_campaigns.png',
      'corporate_csr.png',
      'community_stories.png',
      'ai_powered_recommendation.png'
    ]
  ) [((sequence - 1) % 6) + 1],
  (
    ARRAY[
      'education',
      'healthcare',
      'hunger',
      'environment',
      'women',
      'animals',
      'disaster',
      'general'
    ]
  ) [((sequence - 1) % 8) + 1],
  (
    ARRAY[
      'active',
      'active',
      'active',
      'active',
      'approved',
      'paused',
      'completed',
      'draft',
      'pending_review',
      'changes_requested',
      'rejected',
      'cancelled'
    ]
  ) [((sequence - 1) % 12) + 1],
  (2500000 + (sequence * 175000))::BIGINT,
  CASE
    WHEN sequence % 12 BETWEEN 1 AND 4  THEN (600000 + (sequence * 43000))::BIGINT
    WHEN sequence % 12 = 7 THEN (2500000 + (sequence * 175000))::BIGINT
    ELSE 0
  END,
  JSONB_BUILD_OBJECT(
    'type',
    'ngo_program',
    'name',
    'Community beneficiaries',
    'consent',
    TRUE,
    'seed_data',
    TRUE
  ),
  TRUE,
  JSONB_BUILD_ARRAY(
    JSONB_BUILD_OBJECT(
      'id',
      pg_temp.seed_uuid ('ngo-campaign-evidence:' || sequence),
      'type',
      'project_plan',
      'storagePath',
      'demo/' || pg_temp.seed_uuid ('ngo-campaign:' || sequence) || '/' || pg_temp.seed_uuid ('ngo-campaign-evidence:' || sequence) || '.encrypted',
      'originalName',
      'project-plan-' || sequence || '.pdf',
      'mimeType',
      'application/pdf',
      'encryptionVersion',
      1
    )
  ),
  CASE
    WHEN sequence % 12 = 10 THEN 'Clarify the beneficiary consent and budget breakdown.'
    WHEN sequence % 12 = 11 THEN 'Evidence was insufficient for approval.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 12 IN (0, 1, 2, 3, 4, 5, 6, 7) THEN NOW() - INTERVAL '90 days'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 12 IN (1, 2, 3, 4, 6, 7) THEN NOW() - INTERVAL '75 days'
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 96) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  target_paise = EXCLUDED.target_paise,
  raised_paise = EXCLUDED.raised_paise,
  updated_at = NOW();

INSERT INTO
  public.campaigns (
    id,
    creator_id,
    payout_account_id,
    title,
    short_description,
    description,
    deadline,
    image_url,
    category,
    status,
    target_paise,
    raised_paise,
    beneficiary,
    beneficiary_consent,
    evidence,
    moderation_notes,
    approved_at,
    published_at
  )
SELECT
  pg_temp.seed_uuid ('supporter-campaign:' || sequence),
  pg_temp.seed_uuid ('supporter:' || sequence),
  pg_temp.seed_uuid ('supporter-payout:' || sequence),
  (
    ARRAY[
      'Help fund urgent treatment',
      'Rebuild a family home',
      'Keep a student in college',
      'Support emergency rehabilitation'
    ]
  ) [((sequence - 1) % 4) + 1] || ' ' || sequence,
  'A supporter-led fundraiser with beneficiary consent, evidence, and moderated payout details.',
  'This fictional personal fundraiser demonstrates the complete supporter-led review, consent, evidence, update, donation, refund, and payout workflow without representing a real beneficiary.',
  NOW() + ((45 + sequence * 8) || ' days')::INTERVAL,
  '/landing_page_images/hero_image.png',
  (
    ARRAY['healthcare', 'disaster', 'education', 'general']
  ) [((sequence - 1) % 4) + 1],
  (
    ARRAY[
      'active',
      'active',
      'approved',
      'paused',
      'completed',
      'draft',
      'pending_review',
      'changes_requested',
      'rejected',
      'cancelled'
    ]
  ) [((sequence - 1) % 10) + 1],
  (1500000 + sequence * 125000)::BIGINT,
  CASE
    WHEN sequence % 10 IN (1, 2) THEN (250000 + sequence * 37000)::BIGINT
    WHEN sequence % 10 = 5 THEN (1500000 + sequence * 125000)::BIGINT
    ELSE 0
  END,
  JSONB_BUILD_OBJECT(
    'type',
    'individual',
    'name',
    'Demo Beneficiary ' || sequence,
    'relationship',
    'family friend',
    'identity_verified',
    TRUE,
    'seed_data',
    TRUE
  ),
  TRUE,
  JSONB_BUILD_ARRAY(
    JSONB_BUILD_OBJECT(
      'id',
      pg_temp.seed_uuid ('supporter-campaign-consent:' || sequence),
      'type',
      'consent',
      'storagePath',
      'demo/' || pg_temp.seed_uuid ('supporter-campaign:' || sequence) || '/' || pg_temp.seed_uuid ('supporter-campaign-consent:' || sequence) || '.encrypted',
      'originalName',
      'beneficiary-consent-' || sequence || '.pdf',
      'mimeType',
      'application/pdf',
      'encryptionVersion',
      1
    ),
    JSONB_BUILD_OBJECT(
      'id',
      pg_temp.seed_uuid ('supporter-campaign-estimate:' || sequence),
      'type',
      'estimate',
      'storagePath',
      'demo/' || pg_temp.seed_uuid ('supporter-campaign:' || sequence) || '/' || pg_temp.seed_uuid ('supporter-campaign-estimate:' || sequence) || '.encrypted',
      'originalName',
      'cost-estimate-' || sequence || '.pdf',
      'mimeType',
      'application/pdf',
      'encryptionVersion',
      1
    )
  ),
  CASE
    WHEN sequence % 10 = 8 THEN 'Please upload a recent cost estimate.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 10 IN (1, 2, 3, 4, 5) THEN NOW() - INTERVAL '30 days'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 10 IN (1, 2, 4, 5) THEN NOW() - INTERVAL '25 days'
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 20) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.campaign_milestones (
    id,
    campaign_id,
    title,
    description,
    reward_description,
    target_paise,
    achieved,
    achieved_at,
    milestone_order
  )
SELECT
  pg_temp.seed_uuid ('campaign-milestone:' || sequence),
  pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1)),
  (
    ARRAY[
      'Preparation funded',
      'First delivery completed',
      'Halfway outcome verified',
      'Full target delivered'
    ]
  ) [((sequence - 1) % 4) + 1],
  'A measurable implementation milestone with receipts, field evidence, and a public progress update.',
  CASE
    WHEN sequence % 4 = 0 THEN 'A final impact report will be published.'
    ELSE NULL
  END,
  (500000 + (((sequence - 1) % 4) * 750000))::BIGINT,
  sequence % 4 = 1,
  CASE
    WHEN sequence % 4 = 1 THEN NOW() - ((sequence % 70) || ' days')::INTERVAL
    ELSE NULL
  END,
  ((sequence - 1) % 4) + 1
FROM
  GENERATE_SERIES(1, 384) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.campaign_updates (id, campaign_id, text, image_url, created_at)
SELECT
  pg_temp.seed_uuid ('campaign-update:' || sequence),
  CASE
    WHEN sequence <= 288 THEN pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1))
    ELSE pg_temp.seed_uuid (
      'supporter-campaign:' || (((sequence - 289) % 20) + 1)
    )
  END,
  (
    ARRAY[
      'Planning is complete',
      'Materials have been procured',
      'Volunteers completed the field visit',
      'Beneficiary feedback has been recorded'
    ]
  ) [((sequence - 1) % 4) + 1] || '. This fictional update includes transparent progress and next steps.',
  '/landing_page_images/after_image.png',
  NOW() - ((sequence % 120) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 328) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.corporate_profiles (
    id,
    user_id,
    company_name,
    industry,
    company_size,
    description,
    website,
    logo_url
  )
SELECT
  pg_temp.seed_uuid ('corporate:' || sequence),
  pg_temp.seed_uuid ('corporate-owner:' || sequence),
  (
    ARRAY[
      'BluePeak Technologies',
      'Aarohan Financial Services',
      'TerraNova Foods',
      'Vistara Manufacturing',
      'NimbleCloud Systems',
      'Saffron Retail Group',
      'Orbit Mobility',
      'JanSetu Consulting',
      'Indigo Healthworks',
      'Cedar Infrastructure',
      'Prism Media Labs',
      'Navya Consumer Products'
    ]
  ) [sequence],
  (
    ARRAY[
      'Technology',
      'Financial Services',
      'Food and Agriculture',
      'Manufacturing',
      'Software',
      'Retail'
    ]
  ) [((sequence - 1) % 6) + 1],
  (ARRAY['51-200', '201-500', '501-1000', '1000+']) [((sequence - 1) % 4) + 1],
  'A fictional company using DaanSetu to coordinate employee giving, volunteering, matching, partnerships, and auditable CSR settlement.',
  'https://example.com/company-' || sequence,
  '/logo.png'
FROM
  GENERATE_SERIES(1, 12) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO
  public.corporate_campaigns (
    id,
    corporate_id,
    title,
    description,
    cause,
    goal_paise,
    raised_paise,
    deadline,
    image_url,
    status
  )
SELECT
  pg_temp.seed_uuid ('corporate-campaign:' || sequence),
  pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1)),
  (
    ARRAY[
      'Employee Education Drive',
      'Workplace Hunger Action',
      'Community Health Month',
      'Climate Action Challenge'
    ]
  ) [((sequence - 1) % 4) + 1] || ' ' || CEIL(sequence / 12.0)::INT,
  'A company-wide fictional campaign combining employee participation, corporate matching, NGO partnerships, and transparent settlement.',
  (
    ARRAY['education', 'food', 'health', 'environment']
  ) [((sequence - 1) % 4) + 1],
  (5000000 + sequence * 250000)::BIGINT,
  (700000 + sequence * 68000)::BIGINT,
  NOW() + ((45 + sequence * 6) || ' days')::INTERVAL,
  '/landing_page_images/how_it_works/corporate_csr.png',
  (
    ARRAY['active', 'active', 'completed', 'cancelled']
  ) [((sequence - 1) % 4) + 1]
FROM
  GENERATE_SERIES(1, 36) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  raised_paise = EXCLUDED.raised_paise,
  updated_at = NOW();

INSERT INTO
  public.corporate_employees (
    id,
    corporate_id,
    user_id,
    name,
    email,
    designation,
    joined_at
  )
SELECT
  pg_temp.seed_uuid ('corporate-employee:' || sequence),
  pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid ('supporter:' || sequence),
  users.name,
  users.email,
  (
    ARRAY[
      'Software Engineer',
      'Operations Manager',
      'Designer',
      'Analyst',
      'Team Lead',
      'People Partner'
    ]
  ) [((sequence - 1) % 6) + 1],
  NOW() - ((sequence % 800) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 72) AS sequence
  JOIN public.users ON users.id = pg_temp.seed_uuid ('supporter:' || sequence)
ON CONFLICT (id) DO UPDATE
SET
  designation = EXCLUDED.designation,
  joined_at = EXCLUDED.joined_at;

INSERT INTO
  public.corporate_invitations (
    id,
    corporate_id,
    email,
    token_hash,
    invited_by,
    status,
    expires_at,
    accepted_by,
    accepted_at
  )
SELECT
  pg_temp.seed_uuid ('corporate-invitation:' || sequence),
  pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1)),
  CASE
    WHEN sequence % 4 = 2 THEN 'supporter' || LPAD((((sequence - 1) % 72) + 1)::TEXT, 3, '0') || '@demo.daansetu.local'
    ELSE 'invitee' || sequence || '@demo.daansetu.local'
  END,
  ENCODE(
    DIGEST ('seed-invitation-token-' || sequence, 'sha256'),
    'hex'
  ),
  pg_temp.seed_uuid ('corporate-owner:' || (((sequence - 1) % 12) + 1)),
  (
    ARRAY['pending', 'accepted', 'expired', 'revoked']
  ) [((sequence - 1) % 4) + 1],
  CASE
    WHEN sequence % 4 = 3 THEN NOW() - INTERVAL '3 days'
    ELSE NOW() + INTERVAL '14 days'
  END,
  CASE
    WHEN sequence % 4 = 2 THEN pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 72) + 1))
    ELSE NULL
  END,
  CASE
    WHEN sequence % 4 = 2 THEN NOW() - INTERVAL '10 days'
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 48) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.partnership_requests (
    id,
    corporate_campaign_id,
    ngo_id,
    message,
    status
  )
SELECT
  pg_temp.seed_uuid ('partnership:' || sequence),
  pg_temp.seed_uuid (
    'corporate-campaign:' || (((sequence - 1) % 36) + 1)
  ),
  pg_temp.seed_uuid ('ngo:' || (((sequence * 5 - 1) % 24) + 1)),
  'We would like to explore program alignment, employee participation, measurement, and transparent settlement for this fictional CSR campaign.',
  (ARRAY['pending', 'accepted', 'rejected']) [((sequence - 1) % 3) + 1]
FROM
  GENERATE_SERIES(1, 96) AS sequence
ON CONFLICT (corporate_campaign_id, ngo_id) DO NOTHING;

INSERT INTO
  public.csr_initiatives (
    id,
    corporate_id,
    campaign_id,
    title,
    description,
    match_percent,
    per_employee_cap_paise,
    initiative_cap_paise,
    starts_at,
    ends_at,
    status
  )
SELECT
  pg_temp.seed_uuid ('csr-initiative:' || sequence),
  pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid (
    'ngo-campaign:' || (((sequence * 3 - 1) % 96) + 1)
  ),
  (
    ARRAY[
      'Equal Match Initiative',
      'Double Impact Week',
      'Year-Round Giving Match',
      'Emergency Response Match'
    ]
  ) [((sequence - 1) % 4) + 1] || ' ' || CEIL(sequence / 12.0)::INT,
  'A fictional employee matching program with per-person caps, an initiative budget, immutable pledges, and batch settlement.',
  (ARRAY[50, 100, 150, 200]) [((sequence - 1) % 4) + 1],
  (250000 + (sequence % 4) * 100000)::BIGINT,
  (5000000 + sequence * 250000)::BIGINT,
  NOW() - INTERVAL '60 days',
  NOW() + INTERVAL '240 days',
  (
    ARRAY[
      'active',
      'active',
      'paused',
      'completed',
      'cancelled',
      'draft'
    ]
  ) [((sequence - 1) % 6) + 1]
FROM
  GENERATE_SERIES(1, 36) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- PayPal-shaped demo orders, recurring plans, captured gifts, refunds, payout
-- reconciliation, CSR pledges, receipts, and statutory document mappings.
-- No provider API is called by this seed.
-- ---------------------------------------------------------------------------
INSERT INTO
  public.payment_orders (
    id,
    donor_id,
    campaign_id,
    corporate_employee_id,
    csr_initiative_id,
    gateway_order_id,
    amount_paise,
    settlement_currency,
    settlement_amount_minor,
    exchange_rate,
    cause,
    is_anonymous,
    is_demo,
    provider,
    status,
    expires_at,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('payment-order:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1)),
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid (
      'corporate-employee:' || (((sequence - 1) % 72) + 1)
    )
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid ('csr-initiative:' || (((sequence - 1) % 12) + 1))
    ELSE NULL
  END,
  'SEED-PAYPAL-ORDER-' || LPAD(sequence::TEXT, 6, '0'),
  (50000 + (sequence % 40) * 25000)::BIGINT,
  'USD',
  (600 + (sequence % 40) * 300)::BIGINT,
  83.25,
  (
    ARRAY[
      'education',
      'hunger',
      'healthcare',
      'disaster',
      'general'
    ]
  ) [((sequence - 1) % 5) + 1],
  sequence % 11 = 0,
  sequence % 10 = 0,
  'paypal',
  (
    ARRAY[
      'created',
      'authorized',
      'captured',
      'captured',
      'captured',
      'failed',
      'expired'
    ]
  ) [((sequence - 1) % 7) + 1],
  NOW() + CASE
    WHEN sequence % 7 = 0 THEN INTERVAL '-1 day'
    ELSE INTERVAL '3 hours'
  END,
  NOW() - ((sequence % 180) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 600) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.subscriptions (
    id,
    donor_id,
    campaign_id,
    amount_paise,
    interval,
    gateway_plan_id,
    gateway_subscription_id,
    status,
    current_start,
    current_end,
    cancelled_at,
    provider,
    settlement_currency,
    settlement_amount_minor,
    exchange_rate,
    cause,
    is_anonymous,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('subscription:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 150) + 1)),
  pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1)),
  (75000 + (sequence % 12) * 25000)::BIGINT,
  (ARRAY['monthly', 'quarterly', 'yearly']) [((sequence - 1) % 3) + 1],
  'SEED-PAYPAL-PLAN-' || LPAD(sequence::TEXT, 4, '0'),
  'SEED-PAYPAL-SUB-' || LPAD(sequence::TEXT, 5, '0'),
  (
    ARRAY[
      'active',
      'active',
      'active',
      'created',
      'authenticated',
      'paused',
      'cancelled',
      'pending',
      'halted',
      'completed',
      'expired'
    ]
  ) [((sequence - 1) % 11) + 1],
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '15 days',
  CASE
    WHEN sequence % 11 = 7 THEN NOW() - INTERVAL '4 days'
    ELSE NULL
  END,
  'paypal',
  'USD',
  (900 + (sequence % 12) * 300)::BIGINT,
  83.25,
  (
    ARRAY[
      'education',
      'hunger',
      'healthcare',
      'disaster',
      'general'
    ]
  ) [((sequence - 1) % 5) + 1],
  sequence % 13 = 0,
  NOW() - ((sequence % 365) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 110) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  current_start = EXCLUDED.current_start,
  current_end = EXCLUDED.current_end,
  updated_at = NOW();

INSERT INTO
  public.subscription_invoices (
    id,
    subscription_id,
    gateway_invoice_id,
    gateway_payment_id,
    amount_paise,
    status,
    issued_at,
    paid_at
  )
SELECT
  pg_temp.seed_uuid ('subscription-invoice:' || sequence),
  pg_temp.seed_uuid ('subscription:' || (((sequence - 1) % 110) + 1)),
  'SEED-PAYPAL-INVOICE-' || LPAD(sequence::TEXT, 6, '0'),
  CASE
    WHEN sequence % 4 <> 0 THEN 'SEED-PAYPAL-INVOICE-PAYMENT-' || LPAD(sequence::TEXT, 6, '0')
    ELSE NULL
  END,
  (75000 + (sequence % 12) * 25000)::BIGINT,
  (
    ARRAY[
      'paid',
      'paid',
      'paid',
      'pending',
      'failed',
      'refunded'
    ]
  ) [((sequence - 1) % 6) + 1],
  NOW() - ((sequence % 360) || ' days')::INTERVAL,
  CASE
    WHEN sequence % 6 IN (1, 2, 3, 0) THEN NOW() - ((sequence % 360) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 220) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.donations (
    id,
    user_id,
    ngo_id,
    campaign_id,
    corporate_id,
    corporate_campaign_id,
    corporate_employee_id,
    csr_initiative_id,
    subscription_id,
    amount_paise,
    provider,
    gateway_order_id,
    gateway_payment_id,
    payment_method,
    status,
    refunded_paise,
    is_anonymous,
    is_recurring,
    is_demo,
    is_csr_match,
    cause,
    receipt_number,
    metadata,
    captured_at,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('donation:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1)),
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1))
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid (
      'corporate-campaign:' || (((sequence - 1) % 36) + 1)
    )
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid (
      'corporate-employee:' || (((sequence - 1) % 72) + 1)
    )
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid ('csr-initiative:' || (((sequence - 1) % 12) + 1))
    ELSE NULL
  END,
  CASE
    WHEN sequence % 7 = 0 THEN pg_temp.seed_uuid ('subscription:' || (((sequence - 1) % 110) + 1))
    ELSE NULL
  END,
  (50000 + (sequence % 40) * 25000)::BIGINT,
  'paypal',
  'SEED-PAYPAL-ORDER-' || LPAD(sequence::TEXT, 6, '0'),
  CASE
    WHEN sequence % 12 IN (6, 7) THEN NULL
    ELSE 'SEED-PAYPAL-CAPTURE-' || LPAD(sequence::TEXT, 6, '0')
  END,
  (ARRAY['paypal_balance', 'card', 'bank', 'upi']) [((sequence - 1) % 4) + 1],
  (
    ARRAY[
      'captured',
      'captured',
      'captured',
      'captured',
      'captured',
      'partially_refunded',
      'refunded',
      'authorized',
      'pending',
      'failed',
      'reversed',
      'captured'
    ]
  ) [((sequence - 1) % 12) + 1],
  CASE
    WHEN sequence % 12 = 6 THEN ((50000 + (sequence % 40) * 25000) / 2)::BIGINT
    WHEN sequence % 12 = 7 THEN (50000 + (sequence % 40) * 25000)::BIGINT
    ELSE 0
  END,
  sequence % 17 = 0,
  sequence % 7 = 0,
  sequence % 20 = 0,
  FALSE,
  (
    ARRAY[
      'education',
      'hunger',
      'healthcare',
      'disaster',
      'general'
    ]
  ) [((sequence - 1) % 5) + 1],
  CASE
    WHEN sequence % 12 IN (1, 2, 3, 4, 5, 6, 7, 11, 0) THEN 'DS-DEMO-' || LPAD(sequence::TEXT, 7, '0')
    ELSE NULL
  END,
  JSONB_BUILD_OBJECT(
    'seed_data',
    TRUE,
    'synthetic',
    TRUE,
    'demo_project_record',
    TRUE,
    'payment_order_id',
    pg_temp.seed_uuid ('payment-order:' || (((sequence - 1) % 600) + 1))
  ),
  CASE
    WHEN sequence % 12 IN (1, 2, 3, 4, 5, 6, 7, 11, 0) THEN NOW() - ((sequence % 365) || ' days')::INTERVAL
    ELSE NULL
  END,
  NOW() - ((sequence % 365) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1200) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  refunded_paise = EXCLUDED.refunded_paise,
  metadata = EXCLUDED.metadata;

INSERT INTO
  public.csr_match_pledges (
    id,
    initiative_id,
    donation_id,
    employee_id,
    matched_paise,
    status
  )
SELECT
  pg_temp.seed_uuid ('csr-pledge:' || sequence),
  pg_temp.seed_uuid ('csr-initiative:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid ('donation:' || (sequence * 5)),
  pg_temp.seed_uuid (
    'corporate-employee:' || ((((sequence * 5) - 1) % 72) + 1)
  ),
  (50000 + ((sequence * 5) % 40) * 25000)::BIGINT,
  (
    ARRAY[
      'outstanding',
      'batched',
      'settled',
      'settled',
      'cancelled',
      'reversed'
    ]
  ) [((sequence - 1) % 6) + 1]
FROM
  GENERATE_SERIES(1, 180) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.donations (
    id,
    user_id,
    ngo_id,
    campaign_id,
    corporate_id,
    corporate_employee_id,
    csr_initiative_id,
    amount_paise,
    provider,
    gateway_order_id,
    gateway_payment_id,
    payment_method,
    status,
    is_demo,
    is_csr_match,
    cause,
    receipt_number,
    metadata,
    captured_at,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('csr-match-donation:' || sequence),
  pg_temp.seed_uuid ('corporate-owner:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1)),
  pg_temp.seed_uuid ('corporate:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid (
    'corporate-employee:' || ((((sequence * 5) - 1) % 72) + 1)
  ),
  pg_temp.seed_uuid ('csr-initiative:' || (((sequence - 1) % 12) + 1)),
  (50000 + ((sequence * 5) % 40) * 25000)::BIGINT,
  'paypal',
  'SEED-CSR-ALLOCATION-' || LPAD(sequence::TEXT, 5, '0'),
  'SEED-CSR-CAPTURE-' || LPAD(sequence::TEXT, 5, '0'),
  'corporate_match',
  CASE
    WHEN sequence % 6 IN (3, 4) THEN 'captured'
    ELSE 'pending'
  END,
  FALSE,
  TRUE,
  'general',
  CASE
    WHEN sequence % 6 IN (3, 4) THEN 'DS-CSR-' || LPAD(sequence::TEXT, 6, '0')
    ELSE NULL
  END,
  JSONB_BUILD_OBJECT(
    'seed_data',
    TRUE,
    'synthetic',
    TRUE,
    'pledge_id',
    pg_temp.seed_uuid ('csr-pledge:' || sequence)
  ),
  CASE
    WHEN sequence % 6 IN (3, 4) THEN NOW() - ((sequence % 90) || ' days')::INTERVAL
    ELSE NULL
  END,
  NOW() - ((sequence % 90) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 180) AS sequence
ON CONFLICT (id) DO NOTHING;

UPDATE public.csr_match_pledges AS pledge
SET
  allocated_donation_id = donation.id,
  updated_at = NOW()
FROM
  GENERATE_SERIES(1, 180) AS sequence
  JOIN public.donations AS donation ON donation.id = pg_temp.seed_uuid ('csr-match-donation:' || sequence)
WHERE
  pledge.id = pg_temp.seed_uuid ('csr-pledge:' || sequence)
  AND pledge.status IN ('settled', 'reversed');

INSERT INTO
  public.csr_settlements (
    id,
    corporate_id,
    amount_paise,
    provider,
    provider_amount_cents,
    gateway_order_id,
    gateway_payment_id,
    status,
    settled_at
  )
SELECT
  pg_temp.seed_uuid ('csr-settlement:' || sequence),
  pg_temp.seed_uuid ('corporate:' || sequence),
  (1500000 + sequence * 175000)::BIGINT,
  'paypal',
  (18000 + sequence * 2100)::BIGINT,
  'SEED-PAYPAL-CSR-ORDER-' || LPAD(sequence::TEXT, 3, '0'),
  CASE
    WHEN sequence % 5 <> 1 THEN 'SEED-PAYPAL-CSR-CAPTURE-' || LPAD(sequence::TEXT, 3, '0')
    ELSE NULL
  END,
  (
    ARRAY[
      'created',
      'captured',
      'captured',
      'failed',
      'refunded',
      'reversed'
    ]
  ) [((sequence - 1) % 6) + 1],
  CASE
    WHEN sequence % 6 IN (2, 3, 5, 0) THEN NOW() - ((sequence * 3) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 12) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.csr_settlement_pledges (settlement_id, pledge_id)
SELECT
  pg_temp.seed_uuid ('csr-settlement:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid ('csr-pledge:' || sequence)
FROM
  GENERATE_SERIES(1, 120) AS sequence
ON CONFLICT (pledge_id) DO NOTHING;

INSERT INTO
  public.payment_transfers (
    id,
    donation_id,
    payout_account_id,
    amount_paise,
    settlement_currency,
    settlement_amount_minor,
    gateway_transfer_id,
    provider_batch_id,
    provider_item_id,
    sender_batch_id,
    sender_item_id,
    status,
    failure_reason,
    settled_at,
    reversed_at
  )
SELECT
  pg_temp.seed_uuid ('payment-transfer:' || sequence),
  pg_temp.seed_uuid ('donation:' || sequence),
  pg_temp.seed_uuid ('ngo-payout:' || (((sequence - 1) % 24) + 1)),
  (45000 + (sequence % 40) * 22000)::BIGINT,
  'USD',
  (540 + (sequence % 40) * 264)::BIGINT,
  CASE
    WHEN sequence % 9 NOT IN (1, 6) THEN 'SEED-PAYPAL-PAYOUT-' || LPAD(sequence::TEXT, 6, '0')
    ELSE NULL
  END,
  'SEED-PAYOUT-BATCH-' || CEIL(sequence / 25.0)::INT,
  'SEED-PAYOUT-ITEM-' || sequence,
  'DAANSETU-BATCH-ITEM-' || sequence,
  'DAANSETU-ITEM-' || sequence,
  (
    ARRAY[
      'pending',
      'claimed',
      'created',
      'processing',
      'settled',
      'failed',
      'held',
      'unclaimed',
      'reversed'
    ]
  ) [((sequence - 1) % 9) + 1],
  CASE
    WHEN sequence % 9 = 6 THEN 'Recipient account could not accept the payout.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 9 = 5 THEN NOW() - ((sequence % 45) || ' days')::INTERVAL
    ELSE NULL
  END,
  CASE
    WHEN sequence % 9 = 0 THEN NOW() - ((sequence % 30) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 360) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.refund_requests (
    id,
    donation_id,
    requester_id,
    amount_paise,
    reason,
    status,
    gateway_refund_id,
    reviewed_by,
    review_note,
    reviewed_at
  )
SELECT
  pg_temp.seed_uuid ('refund:' || sequence),
  pg_temp.seed_uuid ('donation:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  (25000 + (sequence % 20) * 12500)::BIGINT,
  (
    ARRAY[
      'Duplicate contribution',
      'Campaign circumstances changed',
      'Payment made in error',
      'Requested after donor support review'
    ]
  ) [((sequence - 1) % 4) + 1],
  (
    ARRAY[
      'submitted',
      'approved',
      'rejected',
      'processing',
      'processed',
      'failed',
      'reversed'
    ]
  ) [((sequence - 1) % 7) + 1],
  CASE
    WHEN sequence % 7 IN (2, 4, 5, 6, 0) THEN 'SEED-PAYPAL-REFUND-' || LPAD(sequence::TEXT, 5, '0')
    ELSE NULL
  END,
  CASE
    WHEN sequence % 7 <> 1 THEN pg_temp.seed_uuid ('admin:' || (((sequence - 1) % 4) + 1))
    ELSE NULL
  END,
  CASE
    WHEN sequence % 7 = 3 THEN 'Request is outside the eligible refund policy.'
    ELSE 'Reviewed using the fictional demo workflow.'
  END,
  CASE
    WHEN sequence % 7 <> 1 THEN NOW() - ((sequence % 35) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  GENERATE_SERIES(1, 140) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO
  public.donor_tax_profiles (
    user_id,
    id_code,
    identifier_ciphertext,
    address_ciphertext,
    consented_at
  )
SELECT
  pg_temp.seed_uuid ('supporter:' || sequence),
  (
    ARRAY[
      'PAN',
      'AADHAAR',
      'PASSPORT',
      'VOTER_ID',
      'FOREIGN_TIN'
    ]
  ) [((sequence - 1) % 5) + 1],
  'v1.seed-demo-identifier-' || sequence,
  'v1.seed-demo-address-' || sequence,
  NOW() - ((sequence % 180) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 80) AS sequence
ON CONFLICT (user_id) DO UPDATE
SET
  id_code = EXCLUDED.id_code,
  identifier_ciphertext = EXCLUDED.identifier_ciphertext,
  address_ciphertext = EXCLUDED.address_ciphertext,
  consented_at = EXCLUDED.consented_at,
  updated_at = NOW();

INSERT INTO
  public.tax_certificates (
    id,
    ngo_id,
    donation_id,
    financial_year,
    certificate_number,
    storage_path,
    issued_at,
    uploaded_by,
    encryption_version,
    encrypted_at
  )
SELECT
  pg_temp.seed_uuid ('tax-certificate:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 12) + 1)),
  pg_temp.seed_uuid ('donation:' || sequence),
  CASE
    WHEN sequence <= 24 THEN '2025-26'
    ELSE '2026-27'
  END,
  'FORM10BE-DEMO-' || LPAD(sequence::TEXT, 5, '0'),
  'demo/tax/form-10be-' || LPAD(sequence::TEXT, 3, '0') || '.encrypted',
  CURRENT_DATE - (sequence % 180)::INT,
  pg_temp.seed_uuid ('ngo-owner:' || (((sequence - 1) % 12) + 1)),
  1,
  NOW() - ((sequence % 180) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 48) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.payment_events (
    id,
    gateway_event_id,
    event_type,
    payload,
    status,
    error_message,
    processed_at,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('payment-event:' || sequence),
  'SEED-PAYPAL-WEBHOOK-' || LPAD(sequence::TEXT, 6, '0'),
  (
    ARRAY[
      'CHECKOUT.ORDER.APPROVED',
      'PAYMENT.CAPTURE.COMPLETED',
      'PAYMENT.CAPTURE.DENIED',
      'PAYMENT.CAPTURE.REFUNDED',
      'BILLING.SUBSCRIPTION.ACTIVATED',
      'BILLING.SUBSCRIPTION.SUSPENDED',
      'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
      'PAYMENT.PAYOUTS-ITEM.FAILED'
    ]
  ) [((sequence - 1) % 8) + 1],
  JSONB_BUILD_OBJECT(
    'id',
    'SEED-PAYPAL-WEBHOOK-' || LPAD(sequence::TEXT, 6, '0'),
    'resource',
    JSONB_BUILD_OBJECT('seed_data', TRUE, 'sequence', sequence)
  ),
  (
    ARRAY[
      'received',
      'processed',
      'processed',
      'ignored',
      'failed'
    ]
  ) [((sequence - 1) % 5) + 1],
  CASE
    WHEN sequence % 5 = 0 THEN 'Synthetic handler failure used to test recovery UI.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 IN (2, 3, 4) THEN NOW() - ((sequence % 40) || ' days')::INTERVAL
    ELSE NULL
  END,
  NOW() - ((sequence % 120) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 160) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  error_message = EXCLUDED.error_message,
  processed_at = EXCLUDED.processed_at;

-- Recalculate campaign and corporate totals from captured, non-demo records so
-- every displayed amount is derived from the seeded transaction ledger.
UPDATE public.campaigns AS campaign
SET
  raised_paise = totals.raised_paise,
  updated_at = NOW()
FROM
  (
    SELECT
      campaign_id,
      SUM(amount_paise - refunded_paise)::BIGINT AS raised_paise
    FROM
      public.donations
    WHERE
      campaign_id IS NOT NULL
      AND is_demo = FALSE
      AND status IN ('captured', 'partially_refunded')
    GROUP BY
      campaign_id
  ) AS totals
WHERE
  campaign.id = totals.campaign_id;

UPDATE public.corporate_campaigns AS campaign
SET
  raised_paise = totals.raised_paise,
  updated_at = NOW()
FROM
  (
    SELECT
      corporate_campaign_id,
      SUM(amount_paise - refunded_paise)::BIGINT AS raised_paise
    FROM
      public.donations
    WHERE
      corporate_campaign_id IS NOT NULL
      AND is_demo = FALSE
      AND status IN ('captured', 'partially_refunded')
    GROUP BY
      corporate_campaign_id
  ) AS totals
WHERE
  campaign.id = totals.corporate_campaign_id;

-- ---------------------------------------------------------------------------
-- Skill-based volunteering: profiles, matching inputs, applications, reviewed
-- hours, verified skills, and certificates.
-- ---------------------------------------------------------------------------
INSERT INTO
  public.volunteer_profiles (
    id,
    user_id,
    bio,
    city,
    skills,
    verified_skills,
    availability,
    total_hours
  )
SELECT
  pg_temp.seed_uuid ('volunteer-profile:' || sequence),
  pg_temp.seed_uuid ('supporter:' || sequence),
  'I volunteer practical skills through structured assignments and document completed service for transparent NGO review.',
  (
    ARRAY[
      'Bengaluru',
      'Mumbai',
      'New Delhi',
      'Kolkata',
      'Chennai',
      'Pune',
      'Hyderabad',
      'Jaipur',
      'Kochi',
      'Bhubaneswar',
      'Ahmedabad',
      'Lucknow'
    ]
  ) [((sequence - 1) % 12) + 1],
  ARRAY[
    (
      ARRAY[
        'Teaching',
        'Graphic Design',
        'Data Analysis',
        'Fundraising',
        'Social Media',
        'Healthcare',
        'Legal Support',
        'Photography'
      ]
    ) [((sequence - 1) % 8) + 1],
    (
      ARRAY[
        'Project Management',
        'Translation',
        'Content Writing',
        'Field Research'
      ]
    ) [((sequence - 1) % 4) + 1]
  ],
  CASE
    WHEN sequence % 3 = 0 THEN ARRAY[
      (
        ARRAY[
          'Teaching',
          'Graphic Design',
          'Data Analysis',
          'Fundraising'
        ]
      ) [((sequence - 1) % 4) + 1]
    ]
    ELSE ARRAY[]::TEXT[]
  END,
  CASE
    WHEN sequence % 3 = 0 THEN ARRAY['Weekdays', 'Flexible']
    WHEN sequence % 3 = 1 THEN ARRAY['Weekends']
    ELSE ARRAY['Flexible']
  END,
  (sequence % 90) * 2.5
FROM
  GENERATE_SERIES(1, 160) AS sequence
ON CONFLICT (user_id) DO UPDATE
SET
  skills = EXCLUDED.skills,
  availability = EXCLUDED.availability,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO
  public.volunteer_opportunities (
    id,
    ngo_id,
    title,
    description,
    city,
    required_skills,
    availability,
    date,
    total_needed,
    status
  )
SELECT
  pg_temp.seed_uuid ('volunteer-opportunity:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY[
      'Teach a Weekend Learning Lab',
      'Design an Impact Report',
      'Analyze Program Survey Data',
      'Support a Fundraising Sprint',
      'Document a Community Field Day',
      'Translate Learning Materials',
      'Coordinate a Health Camp',
      'Mentor a Local Enterprise Cohort'
    ]
  ) [((sequence - 1) % 8) + 1] || ' ' || CEIL(sequence / 24.0)::INT,
  'A structured fictional assignment with a clear scope, required skills, schedule, NGO review, approved-hour workflow, and certificate eligibility.',
  (
    ARRAY[
      'Bengaluru',
      'Mumbai',
      'New Delhi',
      'Kolkata',
      'Chennai',
      'Pune',
      'Hyderabad',
      'Jaipur',
      'Kochi',
      'Bhubaneswar',
      'Ahmedabad',
      'Lucknow'
    ]
  ) [((sequence - 1) % 12) + 1],
  ARRAY[
    (
      ARRAY[
        'Teaching',
        'Graphic Design',
        'Data Analysis',
        'Fundraising',
        'Photography',
        'Translation',
        'Healthcare',
        'Project Management'
      ]
    ) [((sequence - 1) % 8) + 1]
  ],
  CASE
    WHEN sequence % 4 = 1 THEN ARRAY['Weekdays']
    WHEN sequence % 4 = 2 THEN ARRAY['Weekends']
    WHEN sequence % 4 = 3 THEN ARRAY['Flexible']
    ELSE ARRAY['Weekdays', 'Flexible']
  END,
  NOW() + ((sequence % 240 - 40) || ' days')::INTERVAL,
  3 + (sequence % 18),
  (
    ARRAY[
      'active',
      'active',
      'active',
      'closed',
      'cancelled'
    ]
  ) [((sequence - 1) % 5) + 1]
FROM
  GENERATE_SERIES(1, 120) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

WITH
  application_pairs AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          opportunity_number,
          user_number
      ) AS sequence,
      opportunity_number,
      user_number
    FROM
      GENERATE_SERIES(1, 120) AS opportunity_number
      CROSS JOIN GENERATE_SERIES(1, 160) AS user_number
    WHERE
      (opportunity_number * 7 + user_number * 11) % 23 = 0
    ORDER BY
      opportunity_number,
      user_number
    LIMIT
      720
  )
INSERT INTO
  public.volunteer_applications (
    id,
    opportunity_id,
    user_id,
    message,
    status,
    applied_at
  )
SELECT
  pg_temp.seed_uuid (
    'volunteer-application:' || opportunity_number || ':' || user_number
  ),
  pg_temp.seed_uuid ('volunteer-opportunity:' || opportunity_number),
  pg_temp.seed_uuid ('supporter:' || user_number),
  'I can contribute the requested skills and commit to the listed schedule. I would be glad to support this fictional assignment.',
  (
    ARRAY[
      'submitted',
      'shortlisted',
      'accepted',
      'accepted',
      'rejected',
      'withdrawn'
    ]
  ) [((sequence - 1) % 6) + 1],
  NOW() - ((sequence % 120) || ' days')::INTERVAL
FROM
  application_pairs
ON CONFLICT (opportunity_id, user_id) DO UPDATE
SET
  status = EXCLUDED.status,
  updated_at = NOW();

WITH
  service_pairs AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          opportunity_number,
          user_number
      ) AS sequence,
      opportunity_number,
      user_number
    FROM
      GENERATE_SERIES(1, 120) AS opportunity_number
      CROSS JOIN GENERATE_SERIES(1, 160) AS user_number
    WHERE
      (opportunity_number * 7 + user_number * 11) % 23 = 0
    ORDER BY
      opportunity_number,
      user_number
    LIMIT
      420
  )
INSERT INTO
  public.volunteer_hours (
    id,
    user_id,
    opportunity_id,
    ngo_id,
    hours,
    date,
    description,
    verified,
    verified_by,
    verified_at,
    status,
    reviewer_id,
    review_note,
    reviewed_at
  )
SELECT
  pg_temp.seed_uuid (
    'volunteer-hours:' || opportunity_number || ':' || user_number
  ),
  pg_temp.seed_uuid ('supporter:' || user_number),
  pg_temp.seed_uuid ('volunteer-opportunity:' || opportunity_number),
  pg_temp.seed_uuid ('ngo:' || (((opportunity_number - 1) % 24) + 1)),
  1.5 + (sequence % 16),
  CURRENT_DATE - (sequence % 180)::INT,
  'Completed the assigned fictional service activities and submitted the required outcome notes.',
  sequence % 3 = 2,
  CASE
    WHEN sequence % 3 = 2 THEN pg_temp.seed_uuid (
      'ngo-owner:' || (((opportunity_number - 1) % 24) + 1)
    )
    ELSE NULL
  END,
  CASE
    WHEN sequence % 3 = 2 THEN NOW() - ((sequence % 90) || ' days')::INTERVAL
    ELSE NULL
  END,
  (ARRAY['pending', 'approved', 'rejected']) [((sequence - 1) % 3) + 1],
  CASE
    WHEN sequence % 3 <> 1 THEN pg_temp.seed_uuid (
      'ngo-owner:' || (((opportunity_number - 1) % 24) + 1)
    )
    ELSE NULL
  END,
  CASE
    WHEN sequence % 3 = 0 THEN 'The submitted evidence did not match the claimed hours.'
    ELSE 'Hours reviewed against the activity record.'
  END,
  CASE
    WHEN sequence % 3 <> 1 THEN NOW() - ((sequence % 90) || ' days')::INTERVAL
    ELSE NULL
  END
FROM
  service_pairs
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  verified = EXCLUDED.verified,
  reviewed_at = EXCLUDED.reviewed_at;

WITH
  certificate_pairs AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          opportunity_number,
          user_number
      ) AS sequence,
      opportunity_number,
      user_number
    FROM
      GENERATE_SERIES(1, 120) AS opportunity_number
      CROSS JOIN GENERATE_SERIES(1, 160) AS user_number
    WHERE
      (opportunity_number * 7 + user_number * 11) % 23 = 0
    ORDER BY
      opportunity_number,
      user_number
    LIMIT
      140
  )
INSERT INTO
  public.volunteer_certificates (
    id,
    user_id,
    opportunity_id,
    ngo_id,
    certificate_number,
    hours_completed,
    issue_date,
    pdf_url,
    verified_by
  )
SELECT
  pg_temp.seed_uuid (
    'volunteer-certificate:' || opportunity_number || ':' || user_number
  ),
  pg_temp.seed_uuid ('supporter:' || user_number),
  pg_temp.seed_uuid ('volunteer-opportunity:' || opportunity_number),
  pg_temp.seed_uuid ('ngo:' || (((opportunity_number - 1) % 24) + 1)),
  'DS-VOL-DEMO-' || LPAD(sequence::TEXT, 6, '0'),
  4 + (sequence % 24),
  CURRENT_DATE - (sequence % 180)::INT,
  '/demo/volunteer-certificate-' || (((sequence - 1) % 3) + 1) || '.pdf',
  pg_temp.seed_uuid (
    'ngo-owner:' || (((opportunity_number - 1) % 24) + 1)
  )
FROM
  certificate_pairs
ON CONFLICT (user_id, opportunity_id) DO NOTHING;

INSERT INTO
  public.skill_verifications (
    id,
    user_id,
    skill,
    verified_by,
    verification_type,
    evidence_url,
    verified_at
  )
SELECT
  pg_temp.seed_uuid ('skill-verification:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 160) + 1)),
  (
    ARRAY[
      'Teaching',
      'Graphic Design',
      'Data Analysis',
      'Fundraising',
      'Translation',
      'Healthcare'
    ]
  ) [((sequence - 1) % 6) + 1],
  pg_temp.seed_uuid ('ngo-owner:' || (((sequence - 1) % 24) + 1)),
  (
    ARRAY['ngo_endorsement', 'certificate', 'peer_review']
  ) [((sequence - 1) % 3) + 1],
  '/demo/skill-evidence-' || (((sequence - 1) % 3) + 1) || '.pdf',
  NOW() - ((sequence % 300) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 240) AS sequence
ON CONFLICT (user_id, skill, verified_by) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Community publishing, impact stories, reviews, reactions, follows, reports,
-- moderation decisions, notifications, badges, and operational event history.
-- ---------------------------------------------------------------------------
INSERT INTO
  public.posts (
    id,
    author_id,
    author_role,
    title,
    content,
    category,
    status,
    image_url,
    media,
    is_impact_story,
    is_featured,
    approved_at,
    featured_at,
    hidden_at,
    hidden_reason,
    view_count,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('post:' || sequence),
  CASE
    WHEN sequence <= 300 THEN pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1))
    WHEN sequence <= 372 THEN pg_temp.seed_uuid ('ngo-owner:' || (((sequence - 301) % 24) + 1))
    WHEN sequence <= 408 THEN pg_temp.seed_uuid (
      'corporate-owner:' || (((sequence - 373) % 12) + 1)
    )
    ELSE pg_temp.seed_uuid ('admin:' || (((sequence - 409) % 4) + 1))
  END,
  CASE
    WHEN sequence <= 300 THEN 'supporter'
    WHEN sequence <= 372 THEN 'ngo'
    WHEN sequence <= 408 THEN 'corporate'
    ELSE 'admin'
  END,
  (
    ARRAY[
      'A small act with visible impact',
      'What we learned in the field',
      'A volunteer story worth sharing',
      'Community milestone update',
      'Behind the numbers this month',
      'Partnership in action'
    ]
  ) [((sequence - 1) % 6) + 1] || ' #' || sequence,
  'This fictional community post shares a specific experience, an accountable outcome, and a constructive next step. It is seeded to exercise realistic feeds, profiles, detail pages, moderation, and engagement states.',
  (ARRAY['update', 'story', 'announcement']) [((sequence - 1) % 3) + 1],
  CASE
    WHEN sequence % 17 = 0 THEN 'hidden'
    WHEN sequence % 11 = 0 THEN 'draft'
    ELSE 'published'
  END,
  CASE
    WHEN sequence % 4 <> 0 THEN '/landing_page_images/' || (
      ARRAY[
        'before_image.png',
        'after_image.png',
        'hero_image.png'
      ]
    ) [((sequence - 1) % 3) + 1]
    ELSE NULL
  END,
  CASE
    WHEN sequence % 4 <> 0 THEN JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT(
        'type',
        'image',
        'url',
        '/landing_page_images/after_image.png'
      )
    )
    ELSE '[]'::JSONB
  END,
  sequence % 5 = 0,
  sequence % 25 = 0,
  CASE
    WHEN sequence % 5 = 0
    AND sequence % 17 <> 0 THEN NOW() - ((sequence % 120) || ' days')::INTERVAL
    ELSE NULL
  END,
  CASE
    WHEN sequence % 25 = 0 THEN NOW() - ((sequence % 90) || ' days')::INTERVAL
    ELSE NULL
  END,
  CASE
    WHEN sequence % 17 = 0 THEN NOW() - ((sequence % 45) || ' days')::INTERVAL
    ELSE NULL
  END,
  CASE
    WHEN sequence % 17 = 0 THEN 'Hidden in the demo dataset to exercise moderation states.'
    ELSE NULL
  END,
  35 + ((sequence * 47) % 4800),
  NOW() - ((sequence % 240) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 420) AS sequence
ON CONFLICT (id) DO NOTHING;

WITH
  like_pairs AS (
    SELECT
      post_number,
      user_number
    FROM
      GENERATE_SERIES(1, 420) AS post_number
      CROSS JOIN GENERATE_SERIES(1, 180) AS user_number
    WHERE
      (post_number * 13 + user_number * 17) % 19 = 0
    ORDER BY
      post_number,
      user_number
    LIMIT
      3600
  )
INSERT INTO
  public.post_likes (id, post_id, user_id, created_at)
SELECT
  pg_temp.seed_uuid ('post-like:' || post_number || ':' || user_number),
  pg_temp.seed_uuid ('post:' || post_number),
  pg_temp.seed_uuid ('supporter:' || user_number),
  NOW() - (((post_number + user_number) % 120) || ' days')::INTERVAL
FROM
  like_pairs
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO
  public.post_comments (id, post_id, user_id, content, created_at)
SELECT
  pg_temp.seed_uuid ('post-comment:' || sequence),
  pg_temp.seed_uuid ('post:' || (((sequence * 7 - 1) % 420) + 1)),
  pg_temp.seed_uuid ('supporter:' || (((sequence * 11 - 1) % 180) + 1)),
  (
    ARRAY[
      'Thank you for sharing the outcome so clearly.',
      'I would like to volunteer for the next activity.',
      'The milestone breakdown makes this easy to understand.',
      'This is a thoughtful example of community-led impact.',
      'Could you share another update after the next field visit?'
    ]
  ) [((sequence - 1) % 5) + 1],
  NOW() - ((sequence % 120) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1400) AS sequence
ON CONFLICT (id) DO NOTHING;

WITH
  bookmark_pairs AS (
    SELECT
      post_number,
      user_number
    FROM
      GENERATE_SERIES(1, 420) AS post_number
      CROSS JOIN GENERATE_SERIES(1, 180) AS user_number
    WHERE
      (post_number * 5 + user_number * 7) % 101 = 0
    ORDER BY
      post_number,
      user_number
    LIMIT
      700
  )
INSERT INTO
  public.post_bookmarks (id, post_id, user_id, created_at)
SELECT
  pg_temp.seed_uuid (
    'post-bookmark:' || post_number || ':' || user_number
  ),
  pg_temp.seed_uuid ('post:' || post_number),
  pg_temp.seed_uuid ('supporter:' || user_number),
  NOW() - (((post_number + user_number) % 90) || ' days')::INTERVAL
FROM
  bookmark_pairs
ON CONFLICT (user_id, post_id) DO NOTHING;

INSERT INTO
  public.post_views (id, post_id, user_id, ip_address, created_at)
SELECT
  pg_temp.seed_uuid ('post-view:' || sequence),
  pg_temp.seed_uuid ('post:' || (((sequence * 7 - 1) % 420) + 1)),
  CASE
    WHEN sequence % 9 = 0 THEN NULL
    ELSE pg_temp.seed_uuid ('supporter:' || (((sequence * 11 - 1) % 180) + 1))
  END,
  (
    '10.42.' || ((sequence / 255) % 255) || '.' || (sequence % 255)
  )::INET,
  NOW() - ((sequence % 180) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 4800) AS sequence
ON CONFLICT (id) DO NOTHING;

WITH
  eligible_reviews AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          donation_number
      ) AS sequence,
      donation_number
    FROM
      GENERATE_SERIES(1, 360) AS donation_number
    WHERE
      donation_number % 12 IN (0, 1, 2, 3, 4, 5, 6)
    LIMIT
      240
  )
INSERT INTO
  public.ngo_reviews (
    id,
    ngo_id,
    user_id,
    donation_id,
    rating,
    review_text,
    is_verified_donor,
    helpful_count,
    hidden_at,
    hidden_reason,
    moderated_by,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-review:' || sequence),
  pg_temp.seed_uuid ('ngo:' || (((donation_number - 1) % 24) + 1)),
  pg_temp.seed_uuid (
    'supporter:' || (((donation_number - 1) % 180) + 1)
  ),
  pg_temp.seed_uuid ('donation:' || donation_number),
  (ARRAY[5, 5, 4, 5, 4, 3, 5, 4, 5, 2]) [((sequence - 1) % 10) + 1],
  (
    ARRAY[
      'The campaign updates were specific and the receipt arrived immediately.',
      'I appreciated the clear milestones and transparent use-of-funds reporting.',
      'The volunteer team answered my questions and shared a useful outcome update.',
      'A credible experience with enough detail to understand the program''s progress.',
      'The work is meaningful; I would like to see updates published more frequently.'
    ]
  ) [((sequence - 1) % 5) + 1],
  TRUE,
  sequence % 34,
  CASE
    WHEN sequence % 31 = 0 THEN NOW() - INTERVAL '8 days'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 31 = 0 THEN 'Hidden after a fictional moderation review.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 31 = 0 THEN pg_temp.seed_uuid ('admin:1')
    ELSE NULL
  END,
  NOW() - ((sequence % 300) || ' days')::INTERVAL
FROM
  eligible_reviews
ON CONFLICT (ngo_id, user_id) DO NOTHING;

UPDATE public.ngos AS ngo
SET
  average_rating = review_totals.average_rating,
  total_reviews = review_totals.total_reviews,
  updated_at = NOW()
FROM
  (
    SELECT
      ngo_id,
      ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
      COUNT(*)::INT AS total_reviews
    FROM
      public.ngo_reviews
    WHERE
      hidden_at IS NULL
    GROUP BY
      ngo_id
  ) AS review_totals
WHERE
  ngo.id = review_totals.ngo_id;

INSERT INTO
  public.follows (
    id,
    follower_id,
    following_id,
    following_type,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('ngo-follow:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  pg_temp.seed_uuid ('ngo:' || (((sequence * 7 - 1) % 24) + 1)),
  'ngo',
  NOW() - ((sequence % 365) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1440) AS sequence
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

INSERT INTO
  public.follows (
    id,
    follower_id,
    following_id,
    following_type,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('corporate-follow:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  pg_temp.seed_uuid ('corporate:' || (((sequence * 5 - 1) % 12) + 1)),
  'corporate',
  NOW() - ((sequence % 240) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 480) AS sequence
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

INSERT INTO
  public.follows (
    id,
    follower_id,
    following_id,
    following_type,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('user-follow:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  pg_temp.seed_uuid ('supporter:' || (((sequence * 13 - 1) % 180) + 1)),
  'user',
  NOW() - ((sequence % 180) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 720) AS sequence
WHERE
  ((sequence - 1) % 180) + 1 <> ((sequence * 13 - 1) % 180) + 1
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

INSERT INTO
  public.content_reports (
    id,
    reported_by,
    entity_type,
    entity_id,
    reason,
    description,
    status,
    reviewed_by,
    resolution_notes,
    resolved_at,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('content-report:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence * 7 - 1) % 180) + 1)),
  CASE
    WHEN sequence % 5 = 0 THEN 'ngo_review'
    ELSE 'post'
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid ('ngo-review:' || (((sequence - 1) % 240) + 1))
    ELSE pg_temp.seed_uuid ('post:' || (((sequence * 11 - 1) % 420) + 1))
  END,
  (
    ARRAY[
      'spam',
      'inappropriate',
      'fraud',
      'harassment',
      'other'
    ]
  ) [((sequence - 1) % 5) + 1],
  'A fictional report included to exercise the complete moderation queue and audit history.',
  (
    ARRAY['pending', 'reviewing', 'resolved', 'dismissed']
  ) [((sequence - 1) % 4) + 1],
  CASE
    WHEN sequence % 4 IN (0, 2, 3) THEN pg_temp.seed_uuid ('admin:' || (((sequence - 1) % 4) + 1))
    ELSE NULL
  END,
  CASE
    WHEN sequence % 4 IN (0, 2, 3) THEN 'Reviewed under the demo moderation policy.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 4 IN (0, 2, 3) THEN NOW() - ((sequence % 30) || ' days')::INTERVAL
    ELSE NULL
  END,
  NOW() - ((sequence % 90) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 100) AS sequence
ON CONFLICT (reported_by, entity_type, entity_id) DO NOTHING;

INSERT INTO
  public.moderation_actions (
    id,
    moderator_id,
    report_id,
    entity_type,
    entity_id,
    action,
    reason,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('moderation-action:' || sequence),
  pg_temp.seed_uuid ('admin:' || (((sequence - 1) % 4) + 1)),
  pg_temp.seed_uuid ('content-report:' || sequence),
  CASE
    WHEN sequence % 5 = 0 THEN 'ngo_review'
    ELSE 'post'
  END,
  CASE
    WHEN sequence % 5 = 0 THEN pg_temp.seed_uuid ('ngo-review:' || (((sequence - 1) % 240) + 1))
    ELSE pg_temp.seed_uuid ('post:' || (((sequence * 11 - 1) % 420) + 1))
  END,
  (
    ARRAY[
      'hide',
      'restore',
      'dismiss',
      'feature',
      'unfeature'
    ]
  ) [((sequence - 1) % 5) + 1],
  'Fictional moderation decision retained for audit and UI testing.',
  NOW() - ((sequence % 60) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 80) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.notifications (
    id,
    user_id,
    type,
    title,
    message,
    link,
    is_read,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('notification:' || sequence),
  CASE
    WHEN sequence % 10 = 0 THEN pg_temp.seed_uuid ('ngo-owner:' || (((sequence - 1) % 24) + 1))
    WHEN sequence % 15 = 0 THEN pg_temp.seed_uuid ('corporate-owner:' || (((sequence - 1) % 12) + 1))
    ELSE pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1))
  END,
  (
    ARRAY[
      'campaign_milestone',
      'volunteer_accepted',
      'volunteer_application',
      'volunteer_hours',
      'volunteer_certificate',
      'badge_unlocked',
      'post_liked',
      'post_commented',
      'partnership_accepted',
      'partnership_changed',
      'donation_captured',
      'subscription_changed',
      'refund_changed',
      'payout_changed',
      'campaign_decision',
      'moderation_decision',
      'csr_invitation',
      'ngo_verification'
    ]
  ) [((sequence - 1) % 18) + 1],
  (
    ARRAY[
      'New activity',
      'Status updated',
      'Milestone reached',
      'Action required'
    ]
  ) [((sequence - 1) % 4) + 1],
  'A fictional notification was generated to exercise read, unread, navigation, and delivery states.',
  (
    ARRAY[
      '/dashboard',
      '/notifications',
      '/community',
      '/campaigns',
      '/volunteer/dashboard'
    ]
  ) [((sequence - 1) % 5) + 1],
  sequence % 3 = 0,
  NOW() - ((sequence % 120) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1400) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.user_badges (
    id,
    user_id,
    badge_type,
    tier,
    progress,
    earned_at
  )
SELECT
  pg_temp.seed_uuid ('user-badge:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  (
    ARRAY[
      'donor_hero',
      'volunteer_champ',
      'community_builder'
    ]
  ) [((sequence - 1) / 180) + 1],
  (ARRAY['bronze', 'silver', 'gold', 'platinum']) [((sequence - 1) % 4) + 1],
  (sequence * 17) % 101,
  NOW() - ((sequence % 500) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 540) AS sequence
ON CONFLICT (user_id, badge_type) DO UPDATE
SET
  tier = EXCLUDED.tier,
  progress = EXCLUDED.progress,
  earned_at = EXCLUDED.earned_at;

-- Operational and audit tables receive representative high-cardinality records
-- without inflating storage with large payloads.
INSERT INTO
  public.activity_logs (
    id,
    user_id,
    activity_type,
    entity_id,
    entity_type,
    metadata,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('activity-log:' || sequence),
  pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1)),
  (
    ARRAY[
      'donation',
      'volunteer_application',
      'post_created',
      'post_liked',
      'post_commented',
      'campaign_created',
      'badge_earned',
      'follow'
    ]
  ) [((sequence - 1) % 8) + 1],
  pg_temp.seed_uuid ('post:' || (((sequence - 1) % 420) + 1)),
  (
    ARRAY[
      'donation',
      'volunteer_opportunity',
      'post',
      'post',
      'post',
      'campaign',
      'badge',
      'ngo'
    ]
  ) [((sequence - 1) % 8) + 1],
  JSONB_BUILD_OBJECT('seed_data', TRUE, 'sequence', sequence),
  NOW() - ((sequence % 365) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1600) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.analytics_logs (id, event_type, user_id, metadata, created_at)
SELECT
  pg_temp.seed_uuid ('analytics-log:' || sequence),
  (
    ARRAY[
      'page_view',
      'search',
      'campaign_view',
      'donation_started',
      'volunteer_match',
      'dashboard_view'
    ]
  ) [((sequence - 1) % 6) + 1],
  CASE
    WHEN sequence % 9 = 0 THEN NULL
    ELSE pg_temp.seed_uuid ('supporter:' || (((sequence - 1) % 180) + 1))
  END,
  JSONB_BUILD_OBJECT(
    'seed_data',
    TRUE,
    'route',
    (
      ARRAY[
        '/ngos',
        '/campaigns',
        '/community',
        '/volunteer/opportunities',
        '/dashboard'
      ]
    ) [((sequence - 1) % 5) + 1],
    'sequence',
    sequence
  ),
  NOW() - ((sequence % 365) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 1800) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.audit_logs (
    id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('audit-log:' || sequence),
  pg_temp.seed_uuid ('admin:' || (((sequence - 1) % 4) + 1)),
  (
    ARRAY[
      'verification.reviewed',
      'campaign.reviewed',
      'refund.reviewed',
      'payout.reviewed',
      'content.moderated'
    ]
  ) [((sequence - 1) % 5) + 1],
  (
    ARRAY[
      'ngo_verification',
      'campaign',
      'refund_request',
      'payout_account',
      'post'
    ]
  ) [((sequence - 1) % 5) + 1],
  pg_temp.seed_uuid ('post:' || (((sequence - 1) % 420) + 1)),
  JSONB_BUILD_OBJECT(
    'seed_data',
    TRUE,
    'before',
    'pending',
    'after',
    'reviewed'
  ),
  ('10.99.0.' || ((sequence % 250) + 1))::INET,
  'DaanSetu Demo Admin Browser',
  NOW() - ((sequence % 240) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 320) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.ai_flags (
    id,
    content_type,
    content_id,
    reason,
    confidence,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('ai-flag:' || sequence),
  CASE
    WHEN sequence % 3 = 0 THEN 'campaign'
    ELSE 'post'
  END,
  CASE
    WHEN sequence % 3 = 0 THEN pg_temp.seed_uuid ('ngo-campaign:' || (((sequence - 1) % 96) + 1))
    ELSE pg_temp.seed_uuid ('post:' || (((sequence - 1) % 420) + 1))
  END,
  '[SEED] ' || (
    ARRAY[
      'Possible duplicate content',
      'Needs human context review',
      'Potentially sensitive claim',
      'Low-confidence category match'
    ]
  ) [((sequence - 1) % 4) + 1],
  ROUND((0.55 + (sequence % 40) / 100.0)::NUMERIC, 2),
  NOW() - ((sequence % 90) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 60) AS sequence
ON CONFLICT (id) DO NOTHING;

INSERT INTO
  public.action_rate_limits (user_id, action, window_started_at, hits)
SELECT
  pg_temp.seed_uuid ('supporter:' || sequence),
  (
    ARRAY[
      'community.create',
      'comment.create',
      'payment.order',
      'follow.toggle'
    ]
  ) [((sequence - 1) % 4) + 1],
  DATE_TRUNC('minute', NOW()) - ((sequence % 20) || ' minutes')::INTERVAL,
  1 + (sequence % 8)
FROM
  GENERATE_SERIES(1, 40) AS sequence
ON CONFLICT (user_id, action, window_started_at) DO UPDATE
SET
  hits = EXCLUDED.hits;

INSERT INTO
  public.email_queue (
    id,
    recipient_email,
    recipient_name,
    subject,
    html_body,
    text_body,
    template_id,
    status,
    attempts,
    max_attempts,
    error_message,
    sent_at,
    metadata,
    created_at
  )
SELECT
  pg_temp.seed_uuid ('email-queue:' || sequence),
  'supporter' || LPAD((((sequence - 1) % 180) + 1)::TEXT, 3, '0') || '@demo.daansetu.local',
  'Demo Supporter ' || (((sequence - 1) % 180) + 1),
  (
    ARRAY[
      'Your donation receipt',
      'Volunteer application update',
      'Corporate invitation',
      'Campaign milestone reached',
      'Account notification'
    ]
  ) [((sequence - 1) % 5) + 1],
  '<p>This is a fictional DaanSetu development email.</p>',
  'This is a fictional DaanSetu development email.',
  (
    ARRAY[
      'receipt',
      'volunteer-status',
      'csr-invitation',
      'campaign-milestone',
      'notification'
    ]
  ) [((sequence - 1) % 5) + 1],
  (
    ARRAY['pending', 'sent', 'sent', 'failed', 'bounced']
  ) [((sequence - 1) % 5) + 1],
  sequence % 4,
  3,
  CASE
    WHEN sequence % 5 IN (4, 0) THEN 'Synthetic delivery failure for UI testing.'
    ELSE NULL
  END,
  CASE
    WHEN sequence % 5 IN (2, 3) THEN NOW() - ((sequence % 60) || ' days')::INTERVAL
    ELSE NULL
  END,
  JSONB_BUILD_OBJECT('seed_data', TRUE, 'sequence', sequence),
  NOW() - ((sequence % 90) || ' days')::INTERVAL
FROM
  GENERATE_SERIES(1, 100) AS sequence
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  attempts = EXCLUDED.attempts,
  error_message = EXCLUDED.error_message;

COMMIT;
