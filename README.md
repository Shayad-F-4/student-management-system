# Connecting Node.js Backend to MongoDB Using Mongoose

> **Web Development Technology Lab — Practical Assignment**  
> Complete Full-Stack Implementation: Node.js, Express.js, MongoDB Atlas / Local, Mongoose, and Vercel Serverless Functions.

---

## 1. Aim
To design, implement, and test a full-stack Student Management System using a Node.js and Express.js backend connected to a MongoDB database through Mongoose ODM, implement full CRUD REST APIs, compute an aggregated class summary using a Vercel-compatible serverless function, and interact with the system via a clean, responsive web frontend.

---

## 2. Objectives
1. Set up an asynchronous backend web server with **Node.js** and **Express.js** using modern ECMAScript (ES) modules.
2. Establish a reliable, serverless-safe connection to **MongoDB Atlas** (cloud) and **Local MongoDB** using **Mongoose**.
3. Define a structured **Mongoose Schema and Model** (`Student`) with schema validation rules, unique indexes, and error handlers.
4. Implement complete **CRUD (Create, Read, Update, Delete) REST APIs** adhering to standard HTTP methods and status codes.
5. Create an independent, serverless-compatible summary endpoint (`api/summary.js`) utilizing the **Mongoose Aggregation Pipeline**.
6. Develop a responsive, interactive frontend dashboard using HTML5, CSS3, and Vanilla JavaScript with live CRUD and search capabilities.
7. Prepare the application for one-click deployment on **Vercel** with connection pooling and caching.

---

## 3. Theory

### What is Node.js?
Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine. It uses an **event-driven, non-blocking I/O model**, making it lightweight and efficient for building data-intensive real-time web APIs.

### What is Express.js?
Express.js is a minimalist web application framework for Node.js. It simplifies routing, middleware integration, request handling, and sending JSON responses for RESTful web services.

### What is MongoDB?
MongoDB is a NoSQL, document-oriented database. Instead of storing data in relational tables with fixed columns, MongoDB stores records as flexible **BSON (Binary JSON) documents**. This provides high scalability, rapid prototyping, and natural compatibility with JavaScript.

### What is Mongoose?
Mongoose is an **Object Data Modeling (ODM)** library for MongoDB and Node.js. It provides:
- **Schema definitions**: Enforces structure over schema-less MongoDB collections.
- **Type casting & validation**: Validates input types, required fields, regex patterns, and range constraints (`min`, `max`).
- **Query building**: Simplifies complex queries, updates, and aggregation pipelines.
- **Connection management**: Handles connection pooling and lifecycle events.

### Serverless Architecture & Connection Reuse
In serverless platforms like Vercel (running on AWS Lambda), stateless functions spin up and spin down on demand. Opening a brand-new MongoDB connection on every request causes database connection exhaustion. By caching the Mongoose connection in `global.mongoose`, subsequent function invocations within the same container execution context reuse existing sockets, ensuring low latency and stability.

---

## 4. Software and Hardware Requirements

### Hardware Requirements
- **Processor**: Intel Core i3 / AMD Ryzen 3 or higher
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 500 MB free storage
- **Network**: Internet connection (for MongoDB Atlas and npm packages)

### Software Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: v18.0.0 or higher (`node -v`)
- **Package Manager**: npm v9.0.0 or higher (`npm -v`)
- **Database**: MongoDB Community Edition (local) OR MongoDB Atlas (free cloud tier)
- **Browser**: Google Chrome, Mozilla Firefox, or Microsoft Edge
- **API Testing Tool**: Postman, Thunder Client, or `curl`

---

## 5. Technologies Used

| Technology | Category | Role in Project |
| :--- | :--- | :--- |
| **Node.js (ES Modules)** | Runtime Environment | Executes server-side JavaScript asynchronously |
| **Express.js** | Web Framework | Manages routing, middleware, and HTTP request/response flow |
| **MongoDB / Atlas** | NoSQL Database | Persistent storage of student BSON documents |
| **Mongoose** | ODM (Object Data Modeling) | Schema enforcement, document validation, aggregation |
| **dotenv** | Configuration | Manages sensitive environment variables (`MONGODB_URI`, `PORT`) |
| **cors** | Middleware | Cross-Origin Resource Sharing configuration |
| **Vercel Serverless** | Cloud Functions | Independent, on-demand execution for `/api/summary` |
| **HTML5 / CSS3 / JS** | Client-Side Frontend | User dashboard with live CRUD forms, metrics, and modals |

---

## 6. Project Folder Structure

```text
student-management/
├── api/
│   ├── index.js              # Serverless entry point routing Express to Vercel
│   └── summary.js            # Independent Vercel serverless function (Aggregations)
├── config/
│   └── db.js                 # Serverless-safe MongoDB connection module with pooling
├── controllers/
│   └── studentController.js  # CRUD controller business logic and error handling
├── models/
│   └── Student.js            # Mongoose Schema & Model with validation rules
├── public/
│   ├── index.html            # Frontend dashboard layout
│   ├── style.css             # Responsive styling, design tokens, and components
│   └── script.js             # Client-side API fetch logic, DOM manipulation, toasts
├── routes/
│   └── studentRoutes.js      # RESTful route definitions for /api/students
├── test/
│   └── api.test.js           # Automated end-to-end API test runner (30 tests)
├── .env                      # Local environment variables (do not commit)
├── .env.example              # Template with connection string examples
├── .gitignore                # Files excluded from Git version control
├── package.json              # Project dependencies and npm scripts
├── server.js                 # Main Express server configuration and local startup
├── vercel.json               # Vercel deployment routes and serverless rewrites
└── README.md                 # Lab documentation and practical viva guide
```

---

## 7. MongoDB Connection Steps

### Option A: Local MongoDB (Default for Lab Machines)
1. Ensure the MongoDB service is active:
   ```powershell
   Get-Service -Name *mongo*
   ```
2. In your `.env` file, configure:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/student_management_db
   ```

### Option B: MongoDB Atlas (Cloud Database)
1. Navigate to [mongodb.com/atlas](https://www.mongodb.com/atlas) and log in or create a free account.
2. Create a free shared cluster (M0 Sandbox).
3. Under **Security > Database Access**:
   - Create a database user (e.g., username `admin`, password `yourpassword123`).
   - Grant **Read and write to any database** privilege.
4. Under **Security > Network Access**:
   - Click **Add IP Address** -> Select **Allow Access From Anywhere (`0.0.0.0/0`)** -> Confirm.
5. Under **Database > Deployment > Clusters**:
   - Click **Connect** -> Choose **Drivers** (Node.js).
   - Copy the SRV connection URI:
     ```text
     mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/student_management_db?retryWrites=true&w=majority
     ```
6. Paste the URI into your `.env` file, replacing `<password>` with your database user password.

---

## 8. Installation Commands

Clone or navigate to the project directory and install the necessary dependencies:

```bash
# 1. Navigate to the project root
cd "STUDENT MANAGEMENT SYSTEM"

# 2. Install all dependencies defined in package.json
npm install
```

---

## 9. How to Run the Project

### Running in Development Mode
```bash
# Start server with Nodemon (auto-reloads on file changes)
npm run dev
```

### Running in Production / Standard Mode
```bash
# Start server using standard Node.js runtime
npm start
```

### Running Automated Test Suite
```bash
# Runs the automated test runner verifying all 10 scenarios (30 assertions)
npm test
```

Once started, open your web browser and visit:
👉 **`http://localhost:5000`**

---

## 10. REST API Endpoint Table

| HTTP Method | Endpoint URL | Description | Request Body Format | Success Status | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/students` | Creates a new student record | JSON: `{ name, email, course, marks }` | `201 Created` | `400` (Validation), `409` (Duplicate Email) |
| **GET** | `/api/students` | Retrieves all registered students | None | `200 OK` | `500` (Server Error) |
| **GET** | `/api/students/:id` | Retrieves a single student by ID | None | `200 OK` | `400` (Invalid ID), `404` (Not Found) |
| **PUT** | `/api/students/:id` | Updates an existing student record | JSON: `{ name, email, course, marks }` | `200 OK` | `400` (Validation), `404` (Not Found), `409` (Duplicate) |
| **DELETE** | `/api/students/:id` | Deletes a student record permanently | None | `200 OK` | `400` (Invalid ID), `404` (Not Found) |
| **GET** | `/api/summary` | Returns class analytics & top 5 scorers | None | `200 OK` | `405` (Method Not Allowed), `500` |
| **GET** | `/api/health` | Checks server and MongoDB live status | None | `200 OK` | `500` |

---

## 11. Postman & curl Testing Procedure

### 1. Create a Student
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/students`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@college.edu",
    "course": "Computer Science & Engineering",
    "marks": 94.5
  }
  ```
- **curl Command**:
  ```bash
  curl -X POST http://localhost:5000/api/students \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Aarav Sharma\",\"email\":\"aarav.sharma@college.edu\",\"course\":\"Computer Science & Engineering\",\"marks\":94.5}"
  ```
- **Expected Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Student record created successfully",
    "data": {
      "_id": "6ace244f1e17826c438ea62c",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@college.edu",
      "course": "Computer Science & Engineering",
      "marks": 94.5,
      "createdAt": "2026-10-13T12:30:07.519Z"
    }
  }
  ```

---

### 2. Retrieve All Students
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/students`
- **curl Command**:
  ```bash
  curl http://localhost:5000/api/students
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "6ace244f1e17826c438ea62c",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@college.edu",
        "course": "Computer Science & Engineering",
        "marks": 94.5,
        "createdAt": "2026-10-13T12:30:07.519Z"
      }
    ]
  }
  ```

---

### 3. Retrieve Student by ID
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/students/6ace244f1e17826c438ea62c`
- **curl Command**:
  ```bash
  curl http://localhost:5000/api/students/6ace244f1e17826c438ea62c
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ace244f1e17826c438ea62c",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@college.edu",
      "course": "Computer Science & Engineering",
      "marks": 94.5,
      "createdAt": "2026-10-13T12:30:07.519Z"
    }
  }
  ```

---

### 4. Update Student Marks
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/students/6ace244f1e17826c438ea62c`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "marks": 98.0
  }
  ```
- **curl Command**:
  ```bash
  curl -X PUT http://localhost:5000/api/students/6ace244f1e17826c438ea62c \
    -H "Content-Type: application/json" \
    -d "{\"marks\": 98.0}"
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student record updated successfully",
    "data": {
      "_id": "6ace244f1e17826c438ea62c",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@college.edu",
      "course": "Computer Science & Engineering",
      "marks": 98,
      "createdAt": "2026-10-13T12:30:07.519Z"
    }
  }
  ```

---

### 5. Retrieve Student Summary (Serverless Endpoint)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/summary`
- **curl Command**:
  ```bash
  curl http://localhost:5000/api/summary
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "summary": {
      "totalStudents": 1,
      "averageMarks": 98,
      "topStudents": [
        {
          "_id": "6ace244f1e17826c438ea62c",
          "name": "Aarav Sharma",
          "email": "aarav.sharma@college.edu",
          "course": "Computer Science & Engineering",
          "marks": 98,
          "createdAt": "2026-10-13T12:30:07.519Z"
        }
      ]
    }
  }
  ```

---

### 6. Delete a Student
- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/students/6ace244f1e17826c438ea62c`
- **curl Command**:
  ```bash
  curl -X DELETE http://localhost:5000/api/students/6ace244f1e17826c438ea62c
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Student \"Aarav Sharma\" with ID: 6ace244f1e17826c438ea62c deleted successfully",
    "data": { ... }
  }
  ```

---

### 7. Error Handling Test Cases
1. **Invalid Marks Range (> 100)**:
   - Body: `{"name":"Invalid","email":"inv@test.com","course":"CS","marks":120}`
   - Status: `400 Bad Request`
   - Response: `{"success": false, "message": "Validation failed...", "errors": {"marks": "Marks cannot exceed 100"}}`
2. **Duplicate Email Check**:
   - Submitting an existing email returns: `409 Conflict`
   - Response: `{"success": false, "message": "A student with this email already exists..."}`
3. **Malformed Student ID**:
   - `GET /api/students/xyz123` returns: `400 Bad Request`
   - Response: `{"success": false, "message": "Invalid Student ID format: \"xyz123\". Must be a 24-character hexadecimal string."}`
4. **Non-Existent Student ID**:
   - `GET /api/students/507f1f77bcf86cd799439011` returns: `404 Not Found`

---

## 12. Serverless Function Explanation (`api/summary.js`)

The student summary is implemented as a standalone **Vercel Serverless Function** in `api/summary.js`.
Unlike a continuously running Express server, this function executes on demand when an HTTP GET request hits `/api/summary`.

### Key Technical Aspects:
1. **Serverless Connection Caching**:
   Mongoose uses a global caching object (`cached.conn = global.mongoose`). When a serverless container stays "warm" between calls, it avoids repeatedly performing SSL handshakes and socket negotiations with MongoDB.
2. **Mongoose Aggregation Pipeline**:
   The average marks are computed on the database server using `$group` and the `$avg` accumulator:
   ```javascript
   const aggregateResult = await Student.aggregate([
     { $group: { _id: null, avgMarks: { $avg: '$marks' } } }
   ]);
   ```
   This offloads heavy computations directly to the database engine rather than fetching all records into Node.js memory.
3. **Empty Collection Safety**:
   If `totalStudents === 0`, the function immediately returns `{ totalStudents: 0, averageMarks: 0, topStudents: [] }`, preventing `NullPointer` or division-by-zero errors.
4. **Top 5 Leaderboard**:
   Uses `.sort({ marks: -1, createdAt: 1 }).limit(5)` to extract the top five performing students.

---

## 13. Deployment Procedure (Vercel)

1. **Install Vercel CLI (Optional)**:
   ```bash
   npm install -g vercel
   ```
2. **Push Project to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complete Student Management System"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
3. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
   - Import your GitHub repository.
   - Framework Preset: **Other**.
   - Root Directory: `./`.
4. **Configure Environment Variables in Vercel**:
   - In the Vercel project configuration, add:
     - **Name**: `MONGODB_URI`
     - **Value**: Your MongoDB Atlas connection string (`mongodb+srv://admin:pass@cluster0.../student_management_db`)
5. **Deploy**:
   - Click **Deploy**. Vercel will build the project using `vercel.json` rewrites.
   - All static files in `/public` will be served globally at edge CDN nodes.
   - `/api/summary` will execute as a standalone Serverless Function.
   - `/api/students` will be routed to Express via `api/index.js`.

---

## 14. Expected Output
- **Console Output on Server Start**:
  ```text
  🔄 Attempting connection to MongoDB...
  ✅ MongoDB Connected Successfully: Host=127.0.0.1 | Database=student_management_db
  =======================================================
  🚀 Student Management System is running!
  🌐 Local Web UI:         http://localhost:5000
  🎓 CRUD REST Endpoints:  http://localhost:5000/api/students
  📊 Summary Endpoint:     http://localhost:5000/api/summary
  🩺 Health Endpoint:      http://localhost:5000/api/health
  =======================================================
  ```
- **Automated Test Results**:
  ```text
  =======================================================
  📊 Test Results: 30 Passed | 0 Failed
  =======================================================
  ```
- **Browser User Interface**:
  - Live indicator badge displaying `MongoDB Connected` in green.
  - Interactive cards showing Total Students, Class Average Marks, and Top Performer.
  - Live registration form with real-time feedback and validation alerts.
  - Responsive directory table with grade badges (Distinction, First Class, Pass, Fail).
  - Edit modal loading student data, and a secure delete confirmation dialog.

---

## 15. Result
The full-stack Student Management System was successfully developed using Node.js, Express.js, MongoDB, and Mongoose. All CRUD RESTful API endpoints were implemented, validated, and thoroughly tested against edge cases. The read-only student summary serverless function was constructed with Mongoose aggregation pipelines and connection pooling. The web client dashboard successfully manages student records in real time.

---

## 16. Conclusion
By completing this practical lab assignment:
1. Demonstrated understanding of the asynchronous Node.js event loop and Express middleware architecture.
2. Learned how to create schema-backed data models and enforce database constraints using Mongoose ODM.
3. Mastered the implementation of standard RESTful API conventions and HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`).
4. Understood how serverless functions differ from traditional long-running server processes, including connection reuse techniques.
5. Successfully connected a modern client-side frontend to a real-time cloud/local NoSQL database.
