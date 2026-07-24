import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { readJSON, writeJSON } from '../services/dataHelper.js';
import { syncToSheet } from '../services/googleSheets.js';

const router = Router();

// GET /api/fee — list all fee records with student details, with optional filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const fees = readJSON('fee.json');
    const students = readJSON('students.json');
    const { route, class: cls, status } = req.query;

    let result = fees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      if (!student) return null;
      return {
        ...f,
        name: student.name,
        class: student.class,
        route: student.route,
        place: student.place,
        phone: student.phone
      };
    }).filter(Boolean);

    if (route) {
      result = result.filter(r => r.route === route);
    }
    if (cls) {
      result = result.filter(r => r.class === cls);
    }
    if (status) {
      result = result.filter(r => r.status === status);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read fee data.' });
  }
});

// GET /api/fee/summary — dashboard stats
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const fees = readJSON('fee.json');
    const students = readJSON('students.json');

    const totalStudents = students.length;
    const totalPaid = fees.filter(f => f.status === 'paid').length;
    const totalDue = fees.filter(f => f.status === 'due' || f.status === 'partial').length;
    const totalAmount = fees.reduce((sum, f) => sum + (f.feeDue || 0), 0);

    res.json({ totalStudents, totalPaid, totalDue, totalAmount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read summary.' });
  }
});

// GET /api/fee/chart — per-route fee-due counts for bar chart
router.get('/chart', authenticateToken, (req, res) => {
  try {
    const fees = readJSON('fee.json');
    const students = readJSON('students.json');

    const dueStudents = fees.filter(f => f.status === 'due' || f.status === 'partial');
    const routeCounts = {};

    dueStudents.forEach(f => {
      const student = students.find(s => s.id === f.studentId);
      if (student) {
        const route = student.route;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      }
    });

    // Also include routes with 0 due students
    const routes = readJSON('routes.json');
    routes.forEach(r => {
      const key = r.routeNumber;
      if (!routeCounts[key]) {
        routeCounts[key] = 0;
      }
    });

    const chartData = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate chart data.' });
  }
});

// PUT /api/fee/:studentId — update single fee record
router.put('/:studentId', authenticateToken, async (req, res) => {
  try {
    const fees = readJSON('fee.json');
    const idx = fees.findIndex(f => f.studentId === req.params.studentId);

    if (idx === -1) {
      return res.status(404).json({ error: 'Fee record not found.' });
    }

    const { feeDue } = req.body;
    const amount = parseFloat(feeDue) || 0;

    fees[idx].feeDue = amount;
    fees[idx].status = amount > 0 ? 'due' : 'paid';
    fees[idx].lastUpdated = new Date().toISOString();

    writeJSON('fee.json', fees);

    // Sync to Google Sheets
    try {
      const students = readJSON('students.json');
      await syncToSheet(students, fees);
    } catch (sheetErr) {
      console.warn('Google Sheets sync failed:', sheetErr.message);
    }

    res.json(fees[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update fee.' });
  }
});

// PUT /api/fee/bulk/update — bulk update fee records (for route sheet)
router.put('/bulk/update', authenticateToken, async (req, res) => {
  try {
    const { updates } = req.body; // array of { studentId, feeDue }
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array is required.' });
    }

    const fees = readJSON('fee.json');
    const now = new Date().toISOString();

    updates.forEach(({ studentId, feeDue }) => {
      const idx = fees.findIndex(f => f.studentId === studentId);
      if (idx !== -1) {
        const amount = parseFloat(feeDue) || 0;
        fees[idx].feeDue = amount;
        fees[idx].status = amount > 0 ? 'due' : 'paid';
        fees[idx].lastUpdated = now;
      }
    });

    writeJSON('fee.json', fees);

    // Sync to Google Sheets
    try {
      const students = readJSON('students.json');
      await syncToSheet(students, fees);
    } catch (sheetErr) {
      console.warn('Google Sheets sync failed:', sheetErr.message);
    }

    res.json({ message: 'Fee records updated.', count: updates.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk update fees.' });
  }
});

export default router;
