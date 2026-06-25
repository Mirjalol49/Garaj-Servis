import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const initMigration = readFileSync(join(root, 'supabase/migrations/00000_init.sql'), 'utf8')
const photoStorageMigration = readFileSync(
  join(root, 'supabase/migrations/00001_job_photos_storage.sql'),
  'utf8'
)
const rlsCleanupMigration = readFileSync(
  join(root, 'supabase/migrations/20260623125850_phase_9_rls_policy_cleanup.sql'),
  'utf8'
)
const constraintMigration = readFileSync(
  join(root, 'supabase/migrations/20260623131821_section_13_database_constraints.sql'),
  'utf8'
)
const optionalCarProfileMigration = readFileSync(
  join(root, 'supabase/migrations/20260623143816_optional_car_profile_fields.sql'),
  'utf8'
)
const allSql = `${initMigration}\n${photoStorageMigration}\n${rlsCleanupMigration}\n${constraintMigration}\n${optionalCarProfileMigration}`

describe('database schema contract', () => {
  test('car plates are optional but still unique when present', () => {
    expect(initMigration).toMatch(/plate_number text not null unique/)
    expect(optionalCarProfileMigration).toContain('alter column plate_number drop not null')
  })

  test('cars support optional profile fields', () => {
    expect(optionalCarProfileMigration).toContain('add column if not exists car_name text')
    expect(optionalCarProfileMigration).toContain('add column if not exists owner_phone text')
    expect(optionalCarProfileMigration).toContain('add column if not exists notes text')
    expect(optionalCarProfileMigration).toContain('add column if not exists profile_image_path text')
  })

  test('jobs must reference a car', () => {
    expect(initMigration).toMatch(/car_id uuid not null references cars\(id\)/)
  })

  test('job step prices cannot be negative by database contract', () => {
    expect(constraintMigration).toContain('job_steps_customer_price_nonnegative')
    expect(constraintMigration).toContain('check (customer_price >= 0)')
    expect(constraintMigration).toContain('job_steps_master_cost_nonnegative')
    expect(constraintMigration).toContain('check (master_cost >= 0)')
  })

  test('job expense quantity and unit cost are constrained', () => {
    expect(constraintMigration).toContain('job_expenses_quantity_positive')
    expect(constraintMigration).toContain('check (quantity > 0)')
    expect(constraintMigration).toContain('job_expenses_unit_cost_nonnegative')
    expect(constraintMigration).toContain('check (unit_cost >= 0)')
  })

  test('ledger amounts cannot be negative', () => {
    expect(initMigration).toMatch(/amount numeric\(12,2\) not null check \(amount >= 0\)/)
  })

  test('all public app tables have RLS enabled', () => {
    const tables = [
      'profiles',
      'customer_companies',
      'cars',
      'masters',
      'service_categories',
      'service_catalog',
      'job_orders',
      'job_issues',
      'job_photos',
      'job_steps',
      'job_expenses',
      'ledger_entries',
    ]

    tables.forEach((table) => {
      expect(allSql).toContain(`alter table public.${table} enable row level security`)
    })
  })

  test('storage policies keep job photos private and authenticated', () => {
    expect(initMigration).toContain("values ('job-photos', 'job-photos', false)")
    expect(allSql).toContain('Allow authenticated job photo uploads')
    expect(allSql).toContain('Allow authenticated job photo reads')
    expect(allSql).toContain('Allow authenticated job photo deletes')
  })

  test('storage policies keep car photos private and authenticated', () => {
    expect(optionalCarProfileMigration).toContain("values ('car-photos', 'car-photos', false)")
    expect(optionalCarProfileMigration).toContain('Allow authenticated car photo uploads')
    expect(optionalCarProfileMigration).toContain('Allow authenticated car photo reads')
    expect(optionalCarProfileMigration).toContain('Allow authenticated car photo deletes')
  })
})
