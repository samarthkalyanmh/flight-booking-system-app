const express = require('express');
const { flightController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', flightController.getFlights);
router.get('/:id', flightController.getFlight);

// Admin routes
router.post('/', authenticate, authorize(['admin']), flightController.createFlight);
router.put('/:id', authenticate, authorize(['admin']), flightController.updateFlight);
router.delete('/:id', authenticate, authorize(['admin']), flightController.deleteFlight);

module.exports = router;
