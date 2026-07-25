-- Auto-generated migration script for transportation data

DO $$
DECLARE
  default_inst_id UUID;
  route_uuid UUID;
  person_uuid UUID;
  student_uuid UUID;
  route_stop_uuid UUID;
BEGIN
  -- Get the first institution as default
  SELECT id INTO default_inst_id FROM public.institutions LIMIT 1;

  IF default_inst_id IS NULL THEN
    RAISE EXCEPTION 'No institution found. Please create one first.';
  END IF;

  -- Route: Route 01
  route_uuid := gen_random_uuid();
  INSERT INTO public.routes (id, institution_id, route_number, route_name, legacy_id) 
  VALUES (route_uuid, default_inst_id, 'Route 01', 'Route 01', 'r001');

  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Varadanayakanahalli', 1);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Haralahalli', 2);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Ramachandrahosur', 3);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Parasdinne', 4);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Gidnahalli', 5);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'L.Muthukadahalli', 6);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Pylahalli', 7);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Lakkahalli', 8);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Muthukadahalli', 9);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Gidmallai', 10);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Keshvara', 11);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Keshwara', 12);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Nelamakanahalli', 13);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Pailahalli', 14);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Nallamaknahalli', 15);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Lakkahalli Gate', 16);
  INSERT INTO public.route_stops (route_id, stop_name, stop_order)
  VALUES (route_uuid, 'Parasadinne', 17);

  -- Migrate Students and their Transport Fees
  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '1', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s001');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 6000, 'due');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '2', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s002');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 846, 'due');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '3', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s003');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '4', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s004');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '5', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s005');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '6', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s006');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '7', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s007');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '8', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s008');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 8' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '9', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s009');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '10', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s010');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '11', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s011');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '12', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s012');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '13', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s013');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '14', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s014');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '15', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s015');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '16', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s016');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '17', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s017');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '18', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s018');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 8' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '19', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s019');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '20', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s020');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '21', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s021');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '22', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s022');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '23', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s023');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '24', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s024');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '25', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s025');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '26', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s026');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '27', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s027');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '29', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s029');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '30', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s030');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '31', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s031');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '32', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s032');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '33', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s033');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '34', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s034');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '35', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s035');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '36', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s036');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '37', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s037');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '38', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s038');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 8' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '39', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s039');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '40', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s040');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '41', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s041');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '42', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s042');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '43', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s043');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '44', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s044');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '45', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s045');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '46', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s046');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '47', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s047');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '48', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s048');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 8' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '49', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s049');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '50', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s050');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '51', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s051');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 1' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '52', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s052');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 2' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '53', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s053');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 3' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '54', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s054');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 4' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '55', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s055');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 5' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '56', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s056');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 6' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '57', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s057');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 7' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '58', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s058');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 8' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '59', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s059');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 9' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

  person_uuid := gen_random_uuid();
  student_uuid := gen_random_uuid();
  INSERT INTO public.persons (id, first_name, last_name, phone)
  VALUES (person_uuid, 'Student', '60', '555-0000');
  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)
  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-s060');
  SELECT id INTO route_stop_uuid FROM public.route_stops 
  WHERE stop_name = 'Stop 0' 
  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = 'Route 01' LIMIT 1) LIMIT 1;
  IF route_stop_uuid IS NOT NULL THEN
    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)
    VALUES (student_uuid, route_stop_uuid, default_inst_id);
  END IF;
  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)
  VALUES (student_uuid, default_inst_id, 0, 'pending');

END $$;
