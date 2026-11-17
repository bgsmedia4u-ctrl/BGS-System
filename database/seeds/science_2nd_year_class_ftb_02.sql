-- Seed script for Science 2nd Year FTB - 2 (FTB 02) Students
-- Total: 37 students (Roll No 1 to 37)
-- Parent name and phone numbers will be added in upcoming updates.

INSERT INTO public.students (name, roll_number, stream, year, class, parent_name, parent_phone) VALUES
('Bhargav B.V', 1, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Chaithanya N', 2, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Sneha K', 3, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Deeraj B.M', 4, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Spoorthi V', 5, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Tejushree H', 6, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Divya D.M', 7, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Hemashree', 8, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Akshitha', 9, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Thoshitha C', 10, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Bharath S.M', 11, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Vennela T.A', 12, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Suchitra K', 13, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Architha M', 14, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Sanjana Y.J', 15, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Naveen N', 16, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Mohan Gowda M', 17, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Govardhan T.M', 18, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Divya T.G', 19, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Nithyashree J.M', 20, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Nikitha D', 21, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Dhruthi S.M', 22, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Panchami M', 23, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Hemanth B.C', 24, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Likith Gowda', 25, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Prakyath A.R', 26, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Manyashree', 27, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Poorvi S', 28, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Preetham Reddy A.V', 29, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Sri Hari S', 30, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Lavanya K.G', 31, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Preetham Gowda D.P', 32, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Ajay Kumar M', 33, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Bhavani B.M', 34, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Rakshitha B', 35, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Madan Kumar B', 36, 'Science', '2nd Year', 'FTB - 2', NULL, NULL),
('Chethan A', 37, 'Science', '2nd Year', 'FTB - 2', NULL, NULL)
ON CONFLICT (stream, year, class, roll_number) 
DO UPDATE SET 
  name = EXCLUDED.name,
  parent_name = COALESCE(EXCLUDED.parent_name, public.students.parent_name),
  parent_phone = COALESCE(EXCLUDED.parent_phone, public.students.parent_phone);
