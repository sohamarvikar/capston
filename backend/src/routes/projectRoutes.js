const express = require('express');
const router = express.Router();
const c = require('../controllers/projectController');

router.route('/').get(c.getProjects).post(c.createProject);
router.route('/:key').get(c.getProject).put(c.updateProject).delete(c.deleteProject);
router.post('/:key/tasks', c.addTask);
router.patch('/:key/tasks/:issueKey/assign', c.assignTask);

module.exports = router;
