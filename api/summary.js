import connectDB from '../config/db.js';
import Student from '../models/Student.js';

/**
 * Vercel Serverless Function: GET /api/summary
 * Provides an aggregated summary of student metrics.
 * 
 * In a serverless architecture, this function is deployed independently,
 * reuses the cached Mongoose connection pool, and executes on-demand.
 * It is also mounted directly into the Express application for seamless local development.
 *
 * @param {import('express').Request} req - HTTP Request object
 * @param {import('express').Response} res - HTTP Response object
 */
export default async function handler(req, res) {
  // Enforce GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed. This serverless function only accepts GET requests.`,
    });
  }

  try {
    // Connect to database using cached, serverless-safe connection
    await connectDB();

    // 1. Calculate total number of student records
    const totalStudents = await Student.countDocuments();

    // 2. Handle empty database scenario gracefully
    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalStudents: 0,
          averageMarks: 0,
          topStudents: [],
        },
      });
    }

    // 3. Compute average marks using Mongoose Aggregation Pipeline
    const aggregateResult = await Student.aggregate([
      {
        $group: {
          _id: null,
          avgMarks: { $avg: '$marks' },
        },
      },
    ]);

    const rawAvg = aggregateResult.length > 0 && aggregateResult[0].avgMarks !== null
      ? aggregateResult[0].avgMarks
      : 0;

    // Round average marks to exactly two decimal places
    const averageMarks = Number(Math.round(rawAvg * 100) / 100);

    // 4. Retrieve the top five highest-scoring students (ordered descending by marks)
    const topStudents = await Student.find()
      .sort({ marks: -1, createdAt: 1 })
      .limit(5)
      .select('name email course marks createdAt');

    return res.status(200).json({
      success: true,
      summary: {
        totalStudents,
        averageMarks,
        topStudents,
      },
    });
  } catch (error) {
    console.error('Serverless Summary Function Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute student summary',
      error: error.message,
    });
  }
}
