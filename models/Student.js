import mongoose from 'mongoose';

/**
 * Student Mongoose Schema
 * Defines the structure, data types, constraints, and custom validation rules
 * for student records in MongoDB.
 */
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address (e.g., student@example.com)',
      ],
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      minlength: [2, 'Course must be at least 2 characters long'],
      maxlength: [50, 'Course cannot exceed 50 characters'],
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks cannot be less than 0'],
      max: [100, 'Marks cannot exceed 100'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false, // Omit the __v field for cleaner API responses
    timestamps: false, // We explicitly handle createdAt
  }
);

// Prevent Mongoose OverwriteModelError in hot-reloading / serverless execution
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;
