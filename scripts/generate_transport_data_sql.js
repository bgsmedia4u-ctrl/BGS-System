const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../client/Transporation/server/data');

const routesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'routes.json'), 'utf-8'));
const studentsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'students.json'), 'utf-8'));
const feeData = JSON.parse(fs.readFileSync(path.join(dataDir, 'fee.json'), 'utf-8'));

let sql = `-- Auto-generated migration script for transportation data\n\n`;

// We need an institution_id to attach these records to. 
// We'll use a placeholder UUID that needs to be replaced, or we can fetch the first institution from DB if this was a live script.
// For now, we'll declare a variable block in Postgres.
sql += `DO $$\nDECLARE\n`;
sql += `  default_inst_id UUID;\n`;
sql += `  route_uuid UUID;\n`;
sql += `  person_uuid UUID;\n`;
sql += `  student_uuid UUID;\n`;
sql += `  route_stop_uuid UUID;\n`;
sql += `BEGIN\n`;
sql += `  -- Get the first institution as default\n`;
sql += `  SELECT id INTO default_inst_id FROM public.institutions LIMIT 1;\n\n`;
sql += `  IF default_inst_id IS NULL THEN\n`;
sql += `    RAISE EXCEPTION 'No institution found. Please create one first.';\n`;
sql += `  END IF;\n\n`;

for (const route of routesData) {
    sql += `  -- Route: ${route.routeName}\n`;
    sql += `  route_uuid := gen_random_uuid();\n`;
    sql += `  INSERT INTO public.routes (id, institution_id, route_number, route_name, legacy_id) \n`;
    sql += `  VALUES (route_uuid, default_inst_id, '${route.routeNumber}', '${route.routeName}', '${route.id}');\n\n`;

    let stopOrder = 1;
    for (const stop of route.stops) {
        sql += `  INSERT INTO public.route_stops (route_id, stop_name, stop_order)\n`;
        sql += `  VALUES (route_uuid, '${stop.replace(/'/g, "''")}', ${stopOrder});\n`;
        stopOrder++;
    }
    sql += `\n`;
}

sql += `  -- Migrate Students and their Transport Fees\n`;
for (const student of studentsData) {
    const fee = feeData.find(f => f.studentId === student.id);
    
    // We create a Person and a Student record for them so they exist in the monolith
    sql += `  person_uuid := gen_random_uuid();\n`;
    sql += `  student_uuid := gen_random_uuid();\n`;
    
    // Create Person
    // Splitting name to first/last naively
    const nameParts = student.name.split(' ');
    const firstName = nameParts[0].replace(/'/g, "''");
    const lastName = (nameParts.slice(1).join(' ') || 'Student').replace(/'/g, "''");
    
    sql += `  INSERT INTO public.persons (id, first_name, last_name, phone)\n`;
    sql += `  VALUES (person_uuid, '${firstName}', '${lastName}', '${student.phone || ''}');\n`;
    
    // Create Student
    sql += `  INSERT INTO public.students (id, person_id, institution_id, enrollment_number)\n`;
    sql += `  VALUES (student_uuid, person_uuid, default_inst_id, 'LEGACY-${student.id}');\n`;
    
    // Link to Route Stop (We need to find the route stop ID)
    sql += `  SELECT id INTO route_stop_uuid FROM public.route_stops \n`;
    sql += `  WHERE stop_name = '${student.place.replace(/'/g, "''")}' \n`;
    sql += `  AND route_id = (SELECT id FROM public.routes WHERE legacy_id = '${student.route}' LIMIT 1) LIMIT 1;\n`;
    
    sql += `  IF route_stop_uuid IS NOT NULL THEN\n`;
    sql += `    INSERT INTO public.student_transport_assignments (student_id, route_stop_id, institution_id)\n`;
    sql += `    VALUES (student_uuid, route_stop_uuid, default_inst_id);\n`;
    sql += `  END IF;\n`;

    // Transport Fees
    if (fee) {
        const status = fee.status || 'pending';
        const feeDue = fee.feeDue || 0;
        sql += `  INSERT INTO public.transport_fees (student_id, institution_id, fee_due, status)\n`;
        sql += `  VALUES (student_uuid, default_inst_id, ${feeDue}, '${status}');\n`;
    }
    sql += `\n`;
}

sql += `END $$;\n`;

fs.writeFileSync(path.join(__dirname, 'data_migration.sql'), sql);
console.log('Migration SQL generated at scripts/data_migration.sql');
