/**
 * Student Management System - Frontend Client Logic
 * Interacts directly with the REST API endpoints and Vercel Serverless Function.
 */

// State Management
let studentsState = [];
let editingStudentId = null;
let deletingStudentId = null;

// DOM Elements
const elements = {
  // Database status & banner
  dbStatusBadge: document.getElementById('db-status-badge'),
  dbErrorBanner: document.getElementById('db-error-banner'),
  dbErrorMessage: document.getElementById('db-error-message'),
  btnRetryDb: document.getElementById('btn-retry-db'),
  btnRefreshAll: document.getElementById('btn-refresh-all'),

  // Metrics
  metricTotalStudents: document.getElementById('metric-total-students'),
  metricAverageMarks: document.getElementById('metric-average-marks'),
  metricTopScore: document.getElementById('metric-top-score'),
  metricTopName: document.getElementById('metric-top-name'),

  // Student Form
  form: document.getElementById('student-form'),
  formCardTitle: document.getElementById('form-card-title'),
  formModeBadge: document.getElementById('form-mode-badge'),
  studentIdInput: document.getElementById('student-id'),
  nameInput: document.getElementById('student-name'),
  emailInput: document.getElementById('student-email'),
  courseInput: document.getElementById('student-course'),
  marksInput: document.getElementById('student-marks'),
  btnSubmitForm: document.getElementById('btn-submit-form'),
  btnSubmitText: document.getElementById('btn-submit-text'),
  btnCancelEdit: document.getElementById('btn-cancel-edit'),

  // Form Field Errors
  errorName: document.getElementById('error-name'),
  errorEmail: document.getElementById('error-email'),
  errorCourse: document.getElementById('error-course'),
  errorMarks: document.getElementById('error-marks'),

  // Top 5 Scorers
  topStudentsList: document.getElementById('top-students-list'),

  // Table & Search
  tableBody: document.getElementById('students-table-body'),
  searchInput: document.getElementById('search-input'),
  studentsCountBadge: document.getElementById('students-count-badge'),
  tableInfoText: document.getElementById('table-info-text'),

  // Delete Modal
  deleteModal: document.getElementById('delete-modal'),
  deleteStudentName: document.getElementById('delete-student-name'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),

  // Toast Container
  toastContainer: document.getElementById('toast-container'),
};

// ============================================================================
// Toast Notification Utility
// ============================================================================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconHtml = '<i class="fa-solid fa-circle-info toast-icon"></i>';
  if (type === 'success') {
    iconHtml = '<i class="fa-solid fa-circle-check toast-icon"></i>';
  } else if (type === 'error') {
    iconHtml = '<i class="fa-solid fa-circle-xmark toast-icon"></i>';
  } else if (type === 'warning') {
    iconHtml = '<i class="fa-solid fa-triangle-exclamation toast-icon"></i>';
  }

  toast.innerHTML = `
    ${iconHtml}
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// API Communication Helpers
// ============================================================================
async function checkDatabaseHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    if (data.database === 'connected') {
      elements.dbStatusBadge.className = 'status-badge connected';
      elements.dbStatusBadge.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">MongoDB Connected</span>
      `;
      elements.dbErrorBanner.classList.add('hidden');
      return true;
    } else {
      setDbDisconnected('MongoDB is disconnected. Check MONGODB_URI.');
      return false;
    }
  } catch (err) {
    setDbDisconnected('Backend server is unreachable. Check local console.');
    return false;
  }
}

function setDbDisconnected(customMessage) {
  elements.dbStatusBadge.className = 'status-badge disconnected';
  elements.dbStatusBadge.innerHTML = `
    <span class="status-dot"></span>
    <span class="status-text">Database Disconnected</span>
  `;
  elements.dbErrorBanner.classList.remove('hidden');
  if (customMessage) {
    elements.dbErrorMessage.textContent = customMessage;
  }
}

// ============================================================================
// Fetch & Render Summary (Vercel Serverless Function: GET /api/summary)
// ============================================================================
async function fetchSummary() {
  try {
    const res = await fetch('/api/summary');
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load summary');
    }

    const { totalStudents, averageMarks, topStudents } = data.summary;

    // Update Metric Cards
    elements.metricTotalStudents.textContent = totalStudents;
    elements.metricAverageMarks.textContent = `${averageMarks}%`;

    if (topStudents && topStudents.length > 0) {
      elements.metricTopScore.textContent = `${topStudents[0].marks}%`;
      elements.metricTopName.textContent = `${topStudents[0].name} (${topStudents[0].course})`;
    } else {
      elements.metricTopScore.textContent = '0%';
      elements.metricTopName.textContent = 'No records available';
    }

    // Render Top 5 Scorers Card
    renderTopStudents(topStudents || []);
  } catch (err) {
    console.error('Error fetching summary:', err);
    elements.metricTotalStudents.textContent = '0';
    elements.metricAverageMarks.textContent = '0%';
    elements.metricTopScore.textContent = '0%';
    elements.metricTopName.textContent = 'Summary unavailable';
    elements.topStudentsList.innerHTML = `
      <div class="empty-state-sm">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Summary error: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderTopStudents(topStudents) {
  if (topStudents.length === 0) {
    elements.topStudentsList.innerHTML = `
      <div class="empty-state-sm">
        <i class="fa-regular fa-folder-open"></i>
        <p>No student scores recorded yet</p>
      </div>
    `;
    return;
  }

  elements.topStudentsList.innerHTML = topStudents
    .map((student, idx) => {
      const rank = idx + 1;
      let rankClass = 'rank-other';
      if (rank === 1) rankClass = 'rank-1';
      else if (rank === 2) rankClass = 'rank-2';
      else if (rank === 3) rankClass = 'rank-3';

      return `
      <div class="top-student-item">
        <div class="top-student-details">
          <div class="top-rank-badge ${rankClass}">#${rank}</div>
          <div style="overflow: hidden;">
            <div class="top-student-name" title="${escapeHtml(student.name)}">${escapeHtml(student.name)}</div>
            <div class="top-student-course">${escapeHtml(student.course)}</div>
          </div>
        </div>
        <div class="top-student-score">${student.marks}%</div>
      </div>
    `;
    })
    .join('');
}

// ============================================================================
// Fetch & Render Students Directory (REST API: GET /api/students)
// ============================================================================
async function fetchStudents() {
  try {
    elements.tableBody.innerHTML = `
      <tr id="table-loading-row">
        <td colspan="8" class="text-center py-4">
          <div class="spinner"></div>
          <p class="loading-text">Loading student records from MongoDB...</p>
        </td>
      </tr>
    `;

    const res = await fetch('/api/students');
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch students');
    }

    studentsState = data.data || [];
    renderStudentsTable(studentsState);
    elements.studentsCountBadge.textContent = `${studentsState.length} Record${studentsState.length === 1 ? '' : 's'}`;
  } catch (err) {
    console.error('Error fetching students:', err);
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4">
          <div class="empty-state">
            <i class="fa-solid fa-circle-exclamation text-danger"></i>
            <h4>Failed to load student records</h4>
            <p class="text-muted">${escapeHtml(err.message)}</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function getGradeBadge(marks) {
  if (marks >= 75) {
    return `<span class="badge badge-success"><span class="badge-dot badge-success"></span>Distinction</span>`;
  } else if (marks >= 60) {
    return `<span class="badge badge-info"><span class="badge-dot badge-info"></span>First Class</span>`;
  } else if (marks >= 40) {
    return `<span class="badge badge-warning"><span class="badge-dot badge-warning"></span>Pass</span>`;
  } else {
    return `<span class="badge badge-danger"><span class="badge-dot badge-danger"></span>Fail</span>`;
  }
}

function renderStudentsTable(students) {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const filtered = students.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm) ||
      s.course.toLowerCase().includes(searchTerm)
    );
  });

  if (filtered.length === 0) {
    const isSearching = searchTerm.length > 0;
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4">
          <div class="empty-state">
            <i class="fa-solid fa-folder-open"></i>
            <h4>${isSearching ? 'No Matching Students Found' : 'No Students Registered Yet'}</h4>
            <p class="text-muted">${isSearching ? 'Try adjusting your search filter keywords.' : 'Fill out the form on the left to add your first student record.'}</p>
          </div>
        </td>
      </tr>
    `;
    elements.tableInfoText.textContent = isSearching
      ? `No records found matching "${searchTerm}"`
      : 'Showing 0 records';
    return;
  }

  elements.tableInfoText.textContent = `Showing ${filtered.length} of ${studentsState.length} student records`;

  elements.tableBody.innerHTML = filtered
    .map((student, index) => {
      const createdDate = student.createdAt
        ? new Date(student.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A';

      return `
      <tr data-id="${student._id}">
        <td><span class="text-muted">${index + 1}</span></td>
        <td>
          <div class="student-name-cell">${escapeHtml(student.name)}</div>
        </td>
        <td>
          <div class="student-email-cell">
            <i class="fa-regular fa-envelope"></i> ${escapeHtml(student.email)}
          </div>
        </td>
        <td>
          <span class="badge badge-secondary">${escapeHtml(student.course)}</span>
        </td>
        <td>
          <strong>${student.marks}</strong> / 100
        </td>
        <td>
          ${getGradeBadge(student.marks)}
        </td>
        <td>
          <span class="text-muted" style="font-size: 0.8125rem;">${createdDate}</span>
        </td>
        <td class="text-right">
          <div class="table-actions">
            <button
              class="btn btn-icon text-primary btn-edit"
              data-id="${student._id}"
              title="Edit student"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              class="btn btn-icon text-danger btn-delete"
              data-id="${student._id}"
              data-name="${escapeHtml(student.name)}"
              title="Delete student"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  // Attach event listeners to edit and delete action buttons
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => handleStartEdit(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => handleOpenDeleteModal(btn.dataset.id, btn.dataset.name));
  });
}

// ============================================================================
// Form Validation & Submission (POST /api/students & PUT /api/students/:id)
// ============================================================================
function clearErrors() {
  elements.errorName.textContent = '';
  elements.errorEmail.textContent = '';
  elements.errorCourse.textContent = '';
  elements.errorMarks.textContent = '';
  [elements.nameInput, elements.emailInput, elements.courseInput, elements.marksInput].forEach((input) => {
    input.classList.remove('input-invalid');
  });
}

function validateClientInputs() {
  clearErrors();
  let isValid = true;

  const name = elements.nameInput.value.trim();
  const email = elements.emailInput.value.trim();
  const course = elements.courseInput.value.trim();
  const marks = elements.marksInput.value.trim();

  if (!name || name.length < 2) {
    elements.errorName.textContent = 'Name must be at least 2 characters long';
    elements.nameInput.classList.add('input-invalid');
    isValid = false;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    elements.errorEmail.textContent = 'Please enter a valid email address';
    elements.emailInput.classList.add('input-invalid');
    isValid = false;
  }

  if (!course || course.length < 2) {
    elements.errorCourse.textContent = 'Course must be at least 2 characters long';
    elements.courseInput.classList.add('input-invalid');
    isValid = false;
  }

  const numMarks = parseFloat(marks);
  if (marks === '' || isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
    elements.errorMarks.textContent = 'Marks must be a number between 0 and 100';
    elements.marksInput.classList.add('input-invalid');
    isValid = false;
  }

  return isValid;
}

elements.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateClientInputs()) {
    showToast('Please fix the validation errors in the form.', 'warning');
    return;
  }

  const payload = {
    name: elements.nameInput.value.trim(),
    email: elements.emailInput.value.trim(),
    course: elements.courseInput.value.trim(),
    marks: parseFloat(elements.marksInput.value),
  };

  const isEditing = Boolean(editingStudentId);
  const endpoint = isEditing ? `/api/students/${editingStudentId}` : '/api/students';
  const method = isEditing ? 'PUT' : 'POST';

  elements.btnSubmitForm.disabled = true;
  elements.btnSubmitText.textContent = isEditing ? 'Updating...' : 'Saving...';

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle Server Validation / Duplicate Email Errors
      if (res.status === 409) {
        elements.errorEmail.textContent = data.message || 'Duplicate email error';
        elements.emailInput.classList.add('input-invalid');
        showToast(data.message, 'error');
      } else if (data.errors) {
        Object.keys(data.errors).forEach((field) => {
          const errEl = document.getElementById(`error-${field}`);
          const inputEl = document.getElementById(`student-${field}`);
          if (errEl) errEl.textContent = data.errors[field];
          if (inputEl) inputEl.classList.add('input-invalid');
        });
        showToast(data.message || 'Validation error from server', 'error');
      } else {
        showToast(data.message || 'An error occurred', 'error');
      }
      return;
    }

    // Success!
    showToast(data.message || (isEditing ? 'Student updated!' : 'Student created!'), 'success');
    resetForm();
    await Promise.all([fetchStudents(), fetchSummary()]);
  } catch (err) {
    console.error('Form submission error:', err);
    showToast('Failed to communicate with server: ' + err.message, 'error');
  } finally {
    elements.btnSubmitForm.disabled = false;
    elements.btnSubmitText.textContent = editingStudentId ? 'Update Student' : 'Save Student';
  }
});

// ============================================================================
// Edit Mode Handling (GET /api/students/:id & prepare PUT)
// ============================================================================
async function handleStartEdit(studentId) {
  try {
    // Optionally fetch directly from API to test GET /api/students/:id
    const res = await fetch(`/api/students/${studentId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Student not found');
    }

    const student = data.data;
    editingStudentId = student._id;

    elements.studentIdInput.value = student._id;
    elements.nameInput.value = student.name;
    elements.emailInput.value = student.email;
    elements.courseInput.value = student.course;
    elements.marksInput.value = student.marks;

    clearErrors();

    // Update UI to Edit Mode
    elements.formCardTitle.innerHTML = `<i class="fa-solid fa-user-pen text-primary"></i> Edit Student`;
    elements.formModeBadge.textContent = 'Edit Mode';
    elements.formModeBadge.className = 'badge badge-warning';
    elements.btnSubmitText.textContent = 'Update Student';
    elements.btnCancelEdit.classList.remove('hidden');

    // Scroll smoothly to form
    elements.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.nameInput.focus();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function resetForm() {
  elements.form.reset();
  editingStudentId = null;
  elements.studentIdInput.value = '';
  clearErrors();

  elements.formCardTitle.innerHTML = `<i class="fa-solid fa-user-plus text-primary"></i> Add New Student`;
  elements.formModeBadge.textContent = 'Create Mode';
  elements.formModeBadge.className = 'badge badge-primary';
  elements.btnSubmitText.textContent = 'Save Student';
  elements.btnCancelEdit.classList.add('hidden');
}

elements.btnCancelEdit.addEventListener('click', resetForm);

// ============================================================================
// Delete Confirmation Modal Handling (DELETE /api/students/:id)
// ============================================================================
function handleOpenDeleteModal(studentId, studentName) {
  deletingStudentId = studentId;
  elements.deleteStudentName.textContent = `"${studentName}"`;
  elements.deleteModal.classList.remove('hidden');
}

function handleCloseDeleteModal() {
  deletingStudentId = null;
  elements.deleteModal.classList.add('hidden');
}

elements.btnCancelDelete.addEventListener('click', handleCloseDeleteModal);

// Close modal when clicking outside backdrop
elements.deleteModal.addEventListener('click', (e) => {
  if (e.target === elements.deleteModal) {
    handleCloseDeleteModal();
  }
});

elements.btnConfirmDelete.addEventListener('click', async () => {
  if (!deletingStudentId) return;

  const id = deletingStudentId;
  elements.btnConfirmDelete.disabled = true;
  elements.btnConfirmDelete.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;

  try {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete student');
    }

    showToast(data.message || 'Student deleted successfully', 'success');
    handleCloseDeleteModal();

    // If currently editing the deleted student, reset form
    if (editingStudentId === id) {
      resetForm();
    }

    await Promise.all([fetchStudents(), fetchSummary()]);
  } catch (err) {
    console.error('Delete error:', err);
    showToast(err.message, 'error');
  } finally {
    elements.btnConfirmDelete.disabled = false;
    elements.btnConfirmDelete.innerHTML = `<i class="fa-solid fa-trash-can"></i> Delete Permanently`;
  }
});

// ============================================================================
// Search Filter & Refresh Actions
// ============================================================================
elements.searchInput.addEventListener('input', () => {
  renderStudentsTable(studentsState);
});

async function reloadAllData() {
  elements.btnRefreshAll.disabled = true;
  const originalHtml = elements.btnRefreshAll.innerHTML;
  elements.btnRefreshAll.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> Refreshing...`;

  try {
    await checkDatabaseHealth();
    await Promise.all([fetchStudents(), fetchSummary()]);
    showToast('Data refreshed successfully', 'info', 2000);
  } finally {
    elements.btnRefreshAll.disabled = false;
    elements.btnRefreshAll.innerHTML = originalHtml;
  }
}

elements.btnRefreshAll.addEventListener('click', reloadAllData);
elements.btnRetryDb.addEventListener('click', reloadAllData);

// ============================================================================
// Initialization on Page Load
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkDatabaseHealth();
  await Promise.all([fetchStudents(), fetchSummary()]);
});
