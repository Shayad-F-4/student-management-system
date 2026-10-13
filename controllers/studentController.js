import mongoose from 'mongoose';
import Student from '../models/Student.js';
import connectDB from '../config/db.js';

/**
 * Utility helper to format Mongoose validation errors into a user-friendly object.
 */
const formatValidationErrors = (err) => {
  const errors = {};
  for (const field in err.errors) {
    errors[field] = err.errors[field].message;
  }
  return errors;
};

/**
 * @desc    Create a new student record
 * @route   POST /api/students
 * @access  Public
 */
export const createStudent = async (req, res) => {
  try {
    await connectDB();

    const { name, email, course, marks } = req.body;

    // Check for empty body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty. Please provide student details.',
      });
    }

    const newStudent = new Student({
      name,
      email,
      course,
      marks,
    });

    const savedStudent = await newStudent.save();

    return res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: savedStudent,
    });
  } catch (error) {
    // Handle duplicate key error (MongoDB E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(409).json({
        success: false,
        message: `A student with this ${field} already exists. ${field.charAt(0).toUpperCase() + field.slice(1)} must be unique.`,
        error: { [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered` },
      });
    }

    // Handle Mongoose schema validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please verify the supplied inputs.',
        errors: formatValidationErrors(error),
      });
    }

    console.error('Error creating student:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating student record',
      error: error.message,
    });
  }
};

/**
 * @desc    Retrieve all student records
 * @route   GET /api/students
 * @access  Public
 */
export const getAllStudents = async (req, res) => {
  try {
    await connectDB();

    // Sort by most recently created first
    const students = await Student.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving students',
      error: error.message,
    });
  }
};

/**
 * @desc    Retrieve a single student record by ID
 * @route   GET /api/students/:id
 * @access  Public
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Student ID format: "${id}". Must be a 24-character hexadecimal string.`,
      });
    }

    await connectDB();

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(`Error fetching student ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving student record',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing student record by ID
 * @route   PUT /api/students/:id
 * @access  Public
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Student ID format: "${id}". Must be a 24-character hexadecimal string.`,
      });
    }

    // Check for empty body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty. Please provide fields to update.',
      });
    }

    await connectDB();

    const { name, email, course, marks } = req.body;
    const updatePayload = {};

    if (name !== undefined) updatePayload.name = name;
    if (email !== undefined) updatePayload.email = email;
    if (course !== undefined) updatePayload.course = course;
    if (marks !== undefined) updatePayload.marks = marks;

    // findByIdAndUpdate with runValidators: true to enforce schema rules on updates
    const updatedStudent = await Student.findByIdAndUpdate(id, updatePayload, {
      new: true, // Return modified document
      runValidators: true, // Run schema validation on update
      context: 'query',
    });

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: `Student not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    // Handle duplicate key error (MongoDB E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(409).json({
        success: false,
        message: `A student with this ${field} already exists. ${field.charAt(0).toUpperCase() + field.slice(1)} must be unique.`,
        error: { [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered` },
      });
    }

    // Handle Mongoose schema validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please verify the supplied inputs.',
        errors: formatValidationErrors(error),
      });
    }

    console.error(`Error updating student ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating student record',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a student record by ID
 * @route   DELETE /api/students/:id
 * @access  Public
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Student ID format: "${id}". Must be a 24-character hexadecimal string.`,
      });
    }

    await connectDB();

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: `Student not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student "${deletedStudent.name}" with ID: ${id} deleted successfully`,
      data: deletedStudent,
    });
  } catch (error) {
    console.error(`Error deleting student ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting student record',
      error: error.message,
    });
  }
};
