-- =========================================================================
-- NEXTDOORCLINIC — COMPLETE SUPABASE DATABASE SETUP & SEED SCRIPT
-- Copy-paste this ENTIRE script into Supabase SQL Editor and click RUN
-- =========================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('super_admin', 'platform_admin', 'pharmacy', 'staff', 'patient');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'ESSENTIALS', 'PRO', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS "super_admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "platform_admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'platform_admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "service_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SERVICE',
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pharmacies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "postcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "gphc_number" TEXT,
    "ods_code" TEXT,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "brand_color" TEXT,
    "is_nhs_accredited" BOOLEAN NOT NULL DEFAULT true,
    "is_cqc_registered" BOOLEAN NOT NULL DEFAULT true,
    "cqc_rating" TEXT DEFAULT 'Good',
    "provider_type" TEXT DEFAULT 'PHARMACY',
    "features" TEXT[] DEFAULT ARRAY['Wheelchair Access', 'Consultation Room', 'Free Parking']::TEXT[],
    "provider_category_id" UUID,
    "healthcare_category_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pharmacy_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "service_slug" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "deposit_type" TEXT NOT NULL DEFAULT 'NONE',
    "deposit_value" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "preparation_notes" TEXT,
    "eligibility_rules" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pharmacy_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_working" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pharmacy_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "address" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'patient',
    "email_verified" TIMESTAMP(3),
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pharmacy_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "cancel_reason" TEXT,
    "rescheduled_from" TIMESTAMP(3),
    "booking_channel" TEXT NOT NULL DEFAULT 'WEB',
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "payment_method" TEXT,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "is_maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "trust_ticker_title" TEXT DEFAULT 'Trust Verification:',
    "trust_ticker" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- 3. Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "super_admins_email_key" ON "super_admins"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "pharmacies_slug_key" ON "pharmacies"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "pharmacies_email_key" ON "pharmacies"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_slug_key" ON "service_categories"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "availability_pharmacy_id_day_of_week_key" ON "availability"("pharmacy_id", "day_of_week");

-- 4. Foreign Keys
ALTER TABLE "pharmacies" DROP CONSTRAINT IF EXISTS "pharmacies_provider_category_id_fkey";
ALTER TABLE "pharmacies" ADD CONSTRAINT "pharmacies_provider_category_id_fkey" FOREIGN KEY ("provider_category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_pharmacy_id_fkey";
ALTER TABLE "services" ADD CONSTRAINT "services_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_category_id_fkey";
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "availability" DROP CONSTRAINT IF EXISTS "availability_pharmacy_id_fkey";
ALTER TABLE "availability" ADD CONSTRAINT "availability_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. SEED DATA

-- Insert Top 5 Categories
INSERT INTO "service_categories" ("id", "name", "slug", "type", "description", "display_order", "status", "created_at", "updated_at")
VALUES 
('11111111-1111-1111-1111-111111111111', 'Travel Health', 'travel-health', 'SERVICE', 'Vaccinations and clinical health advice for international travelers.', 1, 'ACTIVE', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Vaccinations', 'vaccinations', 'SERVICE', 'Protect yourself and your family with regular immunizations.', 2, 'ACTIVE', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Men''s Health', 'mens-health', 'SERVICE', 'Clinical consultations and treatments for male health conditions.', 3, 'ACTIVE', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Women''s Health', 'womens-health', 'SERVICE', 'Clinical treatments, contraception, and checks for female health.', 4, 'ACTIVE', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Minor Ailments', 'minor-ailments', 'SERVICE', 'NHS Pharmacy First treatments for minor health conditions.', 5, 'ACTIVE', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name";

-- Insert Top 5 Pharmacies
INSERT INTO "pharmacies" ("id", "name", "slug", "email", "phone", "address", "city", "postcode", "status", "gphc_number", "ods_code", "password_hash", "display_name", "description", "is_nhs_accredited", "is_cqc_registered", "cqc_rating", "provider_type", "created_at", "updated_at")
VALUES
('a1111111-1111-1111-1111-111111111111', 'West End Pharmacy', 'west-end-pharmacy', 'westend@nextdoorclinic.co.uk', '+442079460912', '142 Oxford Street, London, W1D 1NB', 'London', 'W1D 1NB', 'APPROVED', '1038492', 'FA912', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'West End Healthcare & Travel Clinic', 'Premier central London pharmacy providing travel vaccines, ear wax removal, and NHS Pharmacy First services.', true, true, 'Outstanding', 'PHARMACY', NOW(), NOW()),
('a2222222-2222-2222-2222-222222222222', 'Central Health Pharmacy', 'central-health-pharmacy', 'central@nextdoorclinic.co.uk', '+441614960182', '58 Deansgate, Manchester, M3 2BW', 'Manchester', 'M3 2BW', 'APPROVED', '1094820', 'FM820', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'Central Health Pharmacy Manchester', 'Full-service clinical pharmacy located in the heart of Manchester city center.', true, true, 'Good', 'PHARMACY', NOW(), NOW()),
('a3333333-3333-3333-3333-333333333333', 'St Jude Pharmacy', 'st-jude-pharmacy', 'stjude@nextdoorclinic.co.uk', '+441214960293', '24 New Street, Birmingham, B2 4BF', 'Birmingham', 'B2 4BF', 'APPROVED', '1058291', 'FB291', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'St Jude Pharmacy & Clinic', 'Verified GPhC clinical hub in Birmingham providing blood tests, consultations, and immunizations.', true, true, 'Good', 'PHARMACY', NOW(), NOW()),
('a4444444-4444-4444-4444-444444444444', 'Riverfront Pharmacy', 'riverfront-pharmacy', 'riverfront@nextdoorclinic.co.uk', '+441134960812', '12 Briggate, Leeds, LS1 6ER', 'Leeds', 'LS1 6ER', 'APPROVED', '1073918', 'FL812', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'Riverfront Pharmacy Leeds', 'Independent community pharmacy and private health clinic serving Leeds.', true, true, 'Good', 'PHARMACY', NOW(), NOW()),
('a5555555-5555-5555-5555-555555555555', 'Northside Health', 'northside-health', 'northside@nextdoorclinic.co.uk', '+441414960412', '89 Buchanan Street, Glasgow, G1 3HF', 'Glasgow', 'G1 3HF', 'APPROVED', '1029481', 'FG412', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'Northside Health Glasgow', 'Top-rated healthcare provider in Glasgow specializing in travel vaccinations & wellness checks.', true, true, 'Good', 'CLINIC', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET "status" = EXCLUDED."status";

-- Insert Clinical Services
INSERT INTO "services" ("id", "pharmacy_id", "category_id", "name", "service_slug", "description", "duration", "price", "is_active", "display_order", "status", "created_at", "updated_at")
VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Travel Vaccination Consultation', 'travel-vaccination-consultation', 'Comprehensive travel risk assessment and yellow fever, typhoid & rabies vaccinations.', 30, 45.00, true, 1, 'ACTIVE', NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Flu Vaccination', 'flu-vaccination', 'Annual quadrivalent influenza vaccination for adults and children.', 15, 20.00, true, 2, 'ACTIVE', NOW(), NOW()),
('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Ear Wax Removal (Microsuction)', 'ear-wax-removal-microsuction', 'Gentle, safe microsuction ear wax removal performed by trained clinicians.', 30, 60.00, true, 3, 'ACTIVE', NOW(), NOW()),
('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Travel Health Consultation', 'travel-health-consultation', 'Expert advice on malaria prevention and travel vaccines.', 20, 35.00, true, 1, 'ACTIVE', NOW(), NOW()),
('b5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Blood Pressure Check & Screening', 'blood-pressure-check-screening', 'Clinical blood pressure reading, pulse check, and cardiovascular health advice.', 15, 15.00, true, 2, 'ACTIVE', NOW(), NOW()),
('b6666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Well Woman Health Check', 'well-woman-health-check', 'Comprehensive health checkup, blood pressure, cholesterol & consultation.', 45, 95.00, true, 1, 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET "is_active" = true;

-- Insert Weekly Availability Schedule for Pharmacies
INSERT INTO "availability" ("pharmacy_id", "day_of_week", "start_time", "end_time", "is_working")
VALUES
('a1111111-1111-1111-1111-111111111111', 1, '09:00', '18:00', true),
('a1111111-1111-1111-1111-111111111111', 2, '09:00', '18:00', true),
('a1111111-1111-1111-1111-111111111111', 3, '09:00', '18:00', true),
('a1111111-1111-1111-1111-111111111111', 4, '09:00', '18:00', true),
('a1111111-1111-1111-1111-111111111111', 5, '09:00', '18:00', true),
('a1111111-1111-1111-1111-111111111111', 6, '10:00', '16:00', true),
('a2222222-2222-2222-2222-222222222222', 1, '09:00', '17:30', true),
('a2222222-2222-2222-2222-222222222222', 2, '09:00', '17:30', true),
('a2222222-2222-2222-2222-222222222222', 3, '09:00', '17:30', true),
('a2222222-2222-2222-2222-222222222222', 4, '09:00', '17:30', true),
('a2222222-2222-2222-2222-222222222222', 5, '09:00', '17:30', true)
ON CONFLICT ("pharmacy_id", "day_of_week") DO NOTHING;

-- Insert Super Admin Account
INSERT INTO "super_admins" ("id", "email", "password_hash", "name", "created_at", "updated_at")
VALUES ('f1111111-1111-1111-1111-111111111111', 'admin@nextdoorclinic.co.uk', '$2b$10$tmXm0fkWniSG5eqaUdWWl.8P5b0KnoqNM7YXGij5M6vRh1CRszUqe', 'Super Admin', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "password_hash" = EXCLUDED."password_hash";

-- =========================================================================
-- SUCCESS! All tables created & mock data inserted into Supabase.
-- =========================================================================
