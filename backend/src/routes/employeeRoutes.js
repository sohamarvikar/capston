const express = require('express');
const router = express.Router();
const c = require('../controllers/employeeController');

router.route('/').get(c.getEmployees).post(c.createEmployee);
router.route('/:id').get(c.getEmployee).put(c.updateEmployee).delete(c.deleteEmployee);
router.patch('/:id/skills', c.updateSkills);

module.exports = router;
