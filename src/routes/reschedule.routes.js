const express = require('express');
const { rescheduleController } = require('../controllers');
const {  authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authenticate, rescheduleController.createRescheduleRequest);

console.log('KKKKK', rescheduleController.createRescheduleRequest)

router.get('/', authenticate, rescheduleController.getUserRescheduleRequests);


// Get all reschedule requests (admin only)
router.get('/admin', authenticate, authorize(['admin']), rescheduleController.getAllRescheduleRequests);


router.post('/:id/cancel', authenticate, rescheduleController.cancelRescheduleRequest);

// Check for available seats for pending reschedule requests

router.post('/check-pending', authenticate, authorize(['admin']), rescheduleController.checkPendingRescheduleRequests);

module.exports = router;
