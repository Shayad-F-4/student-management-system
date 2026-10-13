import express from 'express';
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';

const router = express.Router();

// Route for collection operations
router.route('/')
  .get(getAllStudents)
  .post(createStudent);

// Route for specific document operations
router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

export default router;
