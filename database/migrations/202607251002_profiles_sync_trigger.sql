-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Dual-write Trigger for profiles -> persons & employees sync
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_profile_to_person_and_employee()
RETURNS TRIGGER AS $$
DECLARE
    v_person_id UUID;
BEGIN
    -- 1. Upsert into public.persons
    INSERT INTO public.persons (user_id, first_name, last_name, email, phone, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.name,
        '',
        NEW.email,
        NEW.phone,
        COALESCE(NEW.created_at, now()),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = now()
    RETURNING id INTO v_person_id;

    IF v_person_id IS NULL THEN
        SELECT id INTO v_person_id FROM public.persons WHERE user_id = NEW.id;
    END IF;

    -- 2. Upsert into public.employees
    INSERT INTO public.employees (person_id, role, status, subject, department, staff_type, created_at, updated_at)
    VALUES (
        v_person_id,
        NEW.role,
        NEW.status,
        NEW.subject,
        NEW.department,
        NEW.staff_type,
        COALESCE(NEW.created_at, now()),
        now()
    )
    ON CONFLICT (person_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        subject = EXCLUDED.subject,
        department = EXCLUDED.department,
        staff_type = EXCLUDED.staff_type,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.profiles
DROP TRIGGER IF EXISTS trg_sync_profile_to_person ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_person
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_person_and_employee();
