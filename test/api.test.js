/**
 * Automated Test Suite for Student Management REST API & Serverless Summary
 * Tests all CRUD endpoints, Vercel Serverless Function, and error scenarios.
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import http from 'http';
import app from '../server.js';
import connectDB from '../config/db.js';
import Student from '../models/Student.js';

const TEST_PORT = 5005;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Test State
let server;
let createdStudentId = null;
let testPassed = 0;
let testFailed = 0;

// Helper: HTTP request using native fetch (supported in Node 18+)
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('\n=======================================================');
  console.log('🧪 Starting Automated API Test Suite');
  console.log('=======================================================\n');

  try {
    // 1. Initialize MongoDB connection
    console.log('Connecting to database for test runner...');
    await connectDB();

    // 2. Start HTTP server on isolated test port
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`Test server started at ${BASE_URL}\n`);
        resolve();
      });
    });

    // Clean up any old test data with test email
    await Student.deleteMany({ email: /@testrunner\.com$/ });

    // -------------------------------------------------------------------------
    // TEST 1: Create a Student (POST /api/students)
    // -------------------------------------------------------------------------
    console.log('📌 Test 1: POST /api/students (Valid Creation)');
    const studentPayload = {
      name: 'Alice Johnson',
      email: 'alice.johnson@testrunner.com',
      course: 'Computer Science',
      marks: 92.5,
    };
    const res1 = await request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentPayload),
    });

    assert(res1.status === 201, `Status code is 201 Created (got ${res1.status})`);
    assert(res1.data?.success === true, 'Response indicates success');
    assert(res1.data?.data?.name === 'Alice Johnson', 'Student name matches payload');
    assert(res1.data?.data?.marks === 92.5, 'Student marks match payload');
    assert(res1.data?.data?._id !== undefined, 'Returns generated MongoDB _id');

    createdStudentId = res1.data?.data?._id;

    // -------------------------------------------------------------------------
    // TEST 2: Validation Error - Marks > 100 (POST /api/students)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 2: POST /api/students (Invalid Marks > 100)');
    const res2 = await request('/api/students', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bob Error',
        email: 'bob.invalid@testrunner.com',
        course: 'Physics',
        marks: 150, // Invalid: must be <= 100
      }),
    });

    assert(res2.status === 400, `Status code is 400 Bad Request (got ${res2.status})`);
    assert(res2.data?.success === false, 'Response indicates validation error');
    assert(res2.data?.errors?.marks !== undefined, 'Contains marks validation error message');

    // -------------------------------------------------------------------------
    // TEST 3: Duplicate Email Check (POST /api/students)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 3: POST /api/students (Duplicate Email Rejection)');
    const res3 = await request('/api/students', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Duplicate',
        email: 'alice.johnson@testrunner.com', // Duplicate!
        course: 'Information Technology',
        marks: 85,
      }),
    });

    assert(res3.status === 409, `Status code is 409 Conflict (got ${res3.status})`);
    assert(res3.data?.success === false, 'Duplicate email request rejected');
    assert(res3.data?.message?.includes('already exists'), 'Informative duplicate error message');

    // -------------------------------------------------------------------------
    // TEST 4: Get All Students (GET /api/students)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 4: GET /api/students (Retrieve All Students)');
    const res4 = await request('/api/students');

    assert(res4.status === 200, `Status code is 200 OK (got ${res4.status})`);
    assert(Array.isArray(res4.data?.data), 'Response data is an array');
    assert(res4.data?.count >= 1, `Count indicates at least 1 record (count = ${res4.data?.count})`);

    // -------------------------------------------------------------------------
    // TEST 5: Get One Student by ID (GET /api/students/:id)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 5: GET /api/students/:id (Valid ID)');
    const res5 = await request(`/api/students/${createdStudentId}`);

    assert(res5.status === 200, `Status code is 200 OK (got ${res5.status})`);
    assert(res5.data?.data?._id === createdStudentId, 'Fetched record ID matches requested ID');

    // -------------------------------------------------------------------------
    // TEST 6: Invalid ObjectId Format (GET /api/students/invalid-id)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 6: GET /api/students/:id (Malformed ObjectId)');
    const res6 = await request('/api/students/not-a-valid-hex-id');

    assert(res6.status === 400, `Status code is 400 Bad Request (got ${res6.status})`);
    assert(res6.data?.message?.includes('Invalid Student ID format'), 'Clear error on invalid ID format');

    // -------------------------------------------------------------------------
    // TEST 7: Non-existent ObjectId (GET /api/students/507f1f77bcf86cd799439011)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 7: GET /api/students/:id (Document Not Found)');
    const res7 = await request('/api/students/507f1f77bcf86cd799439011');

    assert(res7.status === 404, `Status code is 404 Not Found (got ${res7.status})`);
    assert(res7.data?.success === false, 'Reports missing student with 404');

    // -------------------------------------------------------------------------
    // TEST 8: Update Student (PUT /api/students/:id)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 8: PUT /api/students/:id (Update Marks)');
    const res8 = await request(`/api/students/${createdStudentId}`, {
      method: 'PUT',
      body: JSON.stringify({ marks: 98.0 }),
    });

    assert(res8.status === 200, `Status code is 200 OK (got ${res8.status})`);
    assert(res8.data?.data?.marks === 98.0, 'Marks updated successfully to 98.0');

    // -------------------------------------------------------------------------
    // TEST 9: Student Summary Serverless Endpoint (GET /api/summary)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 9: GET /api/summary (Serverless Summary Function)');
    const res9 = await request('/api/summary');

    assert(res9.status === 200, `Status code is 200 OK (got ${res9.status})`);
    assert(typeof res9.data?.summary?.totalStudents === 'number', 'totalStudents is a valid number');
    assert(typeof res9.data?.summary?.averageMarks === 'number', 'averageMarks is a valid number');
    assert(Array.isArray(res9.data?.summary?.topStudents), 'topStudents is an array');
    assert(res9.data?.summary?.topStudents?.length <= 5, 'topStudents contains at most 5 items');

    // -------------------------------------------------------------------------
    // TEST 10: Delete Student (DELETE /api/students/:id)
    // -------------------------------------------------------------------------
    console.log('\n📌 Test 10: DELETE /api/students/:id (Delete Record)');
    const res10 = await request(`/api/students/${createdStudentId}`, {
      method: 'DELETE',
    });

    assert(res10.status === 200, `Status code is 200 OK (got ${res10.status})`);
    assert(res10.data?.success === true, 'Student record removed');

    // Verify it is actually deleted
    const verifyDel = await request(`/api/students/${createdStudentId}`);
    assert(verifyDel.status === 404, 'Record is confirmed removed from database (404 on fetch)');

  } catch (error) {
    console.error('Test Suite encountered an unexpected runtime exception:', error);
    testFailed++;
  } finally {
    // Clean up test data
    try {
      await Student.deleteMany({ email: /@testrunner\.com$/ });
    } catch (_) {}

    if (server) {
      server.close();
    }

    console.log('\n=======================================================');
    console.log(`📊 Test Results: ${testPassed} Passed | ${testFailed} Failed`);
    console.log('=======================================================\n');

    process.exit(testFailed > 0 ? 1 : 0);
  }
}

runTests();
