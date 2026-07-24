import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { readJSON, writeJSON } from '../services/dataHelper.js';

const router = Router();

// GET /api/students — list all, with optional filters
router.get('/', authenticateToken, (req, res) => {
  try {
    let students = readJSON('students.json');
    const { search, class: cls, route } = req.query;

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }
    if (cls) {
      students = students.filter(s => s.class === cls);
    }
    if (route) {
      students = students.filter(s => s.route === route);
    }

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read students data.' });
  }
});

// GET /api/students/classes — get distinct class values
router.get('/classes', authenticateToken, (req, res) => {
  try {
    const students = readJSON('students.json');
    const classes = [...new Set(students.map(s => s.class))].sort();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read students data.' });
  }
});

// POST /api/students — add new student
router.post('/', authenticateToken, (req, res) => {
  try {
    const students = readJSON('students.json');
    const { name, class: cls, route, place, phone } = req.body;

    if (!name || !cls || !route || !place) {
      return res.status(400).json({ error: 'Name, class, route, and place are required.' });
    }

    const routes = readJSON('routes.json');
    const validRoute = routes.find(r => r.routeNumber === route || r.routeName === route);
    if (!validRoute) {
      return res.status(400).json({ error: 'Invalid route.' });
    }
    if (!validRoute.stops.includes(place)) {
      return res.status(400).json({ error: 'Invalid place for the specified route.' });
    }

    const canonicalRoute = validRoute.routeNumber;

    const newStudent = {
      id: uuidv4(),
      slNo: students.length + 1,
      name,
      class: cls,
      place,
      route: canonicalRoute,
      phone: phone || ''
    };

    students.push(newStudent);
    writeJSON('students.json', students);

    // Also create a fee record for the new student
    const fees = readJSON('fee.json');
    fees.push({
      studentId: newStudent.id,
      feeDue: 0,
      status: 'paid',
      lastUpdated: ''
    });
    writeJSON('fee.json', fees);

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add student.' });
  }
});

// PUT /api/students/:id — update student
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const students = readJSON('students.json');
    const idx = students.findIndex(s => s.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const { name, class: cls, route, place, phone } = req.body;
    
    let targetRoute = route !== undefined ? route : students[idx].route;
    let targetPlace = place !== undefined ? place : students[idx].place;

    const routes = readJSON('routes.json');
    const validRoute = routes.find(r => r.routeNumber === targetRoute || r.routeName === targetRoute);
    if (!validRoute) {
      return res.status(400).json({ error: 'Invalid route.' });
    }
    if (!validRoute.stops.includes(targetPlace)) {
      return res.status(400).json({ error: 'Invalid place for the specified route.' });
    }

    if (name !== undefined) students[idx].name = name;
    if (cls !== undefined) students[idx].class = cls;
    students[idx].route = validRoute.routeNumber;
    students[idx].place = targetPlace;
    if (phone !== undefined) students[idx].phone = phone;

    writeJSON('students.json', students);
    res.json(students[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

// DELETE /api/students/:id — delete student
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    let students = readJSON('students.json');
    const idx = students.findIndex(s => s.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    students.splice(idx, 1);
    // Re-number
    students.forEach((s, i) => { s.slNo = i + 1; });
    writeJSON('students.json', students);

    // Also remove fee record
    let fees = readJSON('fee.json');
    fees = fees.filter(f => f.studentId !== req.params.id);
    writeJSON('fee.json', fees);

    res.json({ message: 'Student deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

export default router;
