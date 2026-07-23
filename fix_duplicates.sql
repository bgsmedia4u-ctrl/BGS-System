-- 1. Remove duplicate students (keeps the oldest entry for each stream, year, class, and roll_number)
DELETE FROM public.students
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY stream, year, class, roll_number 
             ORDER BY created_at ASC
           ) as rnum
    FROM public.students
  ) t
  WHERE t.rnum > 1
);

-- 2. Add a UNIQUE constraint to prevent this from happening again in the future
ALTER TABLE public.students 
ADD CONSTRAINT unique_student_batch UNIQUE (stream, year, class, roll_number);
