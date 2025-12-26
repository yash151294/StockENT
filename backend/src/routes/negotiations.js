const express = require('express');
const router = express.Router();
const negotiationController = require('../controllers/negotiationController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Apply authentication to all negotiation routes
router.use(authenticateToken);

// Negotiation routes
router.post('/', validate, negotiationController.createNegotiation);

router.get('/', negotiationController.getNegotiations);

router.get('/:id', negotiationController.getNegotiation);

router.post('/:id/counter-offer', validate, negotiationController.sendCounterOffer);

router.post('/:id/accept', negotiationController.acceptCounterOffer);

router.post('/:id/decline', negotiationController.declineCounterOffer);

router.delete('/:id', negotiationController.cancelNegotiation);

module.exports = router;
