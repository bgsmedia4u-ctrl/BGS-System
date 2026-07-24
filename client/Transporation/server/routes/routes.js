import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { readJSON, writeJSON } from '../services/dataHelper.js';

const router = Router();

// GET /api/routes — list all routes
router.get('/', authenticateToken, (req, res) => {
  try {
    const routes = readJSON('routes.json');
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read routes data.' });
  }
});

// GET /api/routes/:id — get single route
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const routes = readJSON('routes.json');
    const route = routes.find(r => r.id === req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read route data.' });
  }
});

// POST /api/routes — add new route
router.post('/', authenticateToken, (req, res) => {
  try {
    const routes = readJSON('routes.json');
    const { routeNumber, routeName, stops } = req.body;

    if (!routeNumber || !routeName) {
      return res.status(400).json({ error: 'Route number and name are required.' });
    }

    // Check duplicate route number
    if (routes.some(r => r.routeNumber === routeNumber)) {
      return res.status(409).json({ error: 'Route number already exists.' });
    }

    const newRoute = {
      id: uuidv4(),
      routeNumber,
      routeName,
      stops: stops || []
    };

    routes.push(newRoute);
    writeJSON('routes.json', routes);
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add route.' });
  }
});

// PUT /api/routes/:id — update route
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const routes = readJSON('routes.json');
    const idx = routes.findIndex(r => r.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    const { routeNumber, routeName, stops } = req.body;
    if (routeNumber !== undefined) routes[idx].routeNumber = routeNumber;
    if (routeName !== undefined) routes[idx].routeName = routeName;
    if (stops !== undefined) routes[idx].stops = stops;

    writeJSON('routes.json', routes);
    res.json(routes[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update route.' });
  }
});

// DELETE /api/routes/:id — delete route
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    let routes = readJSON('routes.json');
    const idx = routes.findIndex(r => r.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    routes.splice(idx, 1);
    writeJSON('routes.json', routes);
    res.json({ message: 'Route deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete route.' });
  }
});

export default router;
