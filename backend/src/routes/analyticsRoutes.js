const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');

router.get('/dashboard', c.getDashboard);
router.get('/departments', c.getDepartmentStats);
router.get('/top-performers', c.getTopPerformers);
router.get('/skill-distribution', c.getSkillDistribution);

module.exports = router;
