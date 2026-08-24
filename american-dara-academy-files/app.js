/**
 * American Dara Academy - GradeLink System Controller
 * Zero Demo Data: Fresh Production State
 */

// Global State
let schoolData = null;
let currentStaffUser = null;
let currentView = 'dashboard';
let activeAssignmentCategoryFilter = 'all';

// Temporary image buffers for file uploads
let tempLogoDataUrl = null;
let tempLetterheadDataUrl = null;

// Clean Production Seed (0 Demo Courses, 0 Demo Assignments, 0 Demo Students, 0 Demo Grades)
const CLEAN_SEED_DATA = {
  schoolInfo: {
    name: "American Dara Academy",
    motto: "Excellence • Integrity • Innovation",
    address: "Route des Almadies Campus, Dakar",
    phone: "+19174788477",
    email: "saliou2007@yahoo.com",
    website: "americandaraacademy.gradelink.com",
    logoUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80",
    letterhead: {
      useImageLetterhead: false,
      letterheadImageUrl: "",
      headerTitle: "AMERICAN DARA ACADEMY",
      subHeader: "LOWER SCHOOL • MIDDLE SCHOOL • HIGH SCHOOL",
      accreditation: "Accredited by WASC & Ministry of National Education",
      address: "Route des Almadies Campus, Dakar",
      contact: "Tel/WhatsApp: +19174788477 | Email: saliou2007@yahoo.com | Web: americandaraacademy.gradelink.com",
      watermarkEnabled: true,
      watermarkOpacity: 0.07,
      dashboardLogoOpacity: 0.20
    }
  },
  staff: [
    {
      id: "DIR-001",
      name: "Mamadou Saliou Diallo",
      role: "DIRECTOR",
      division: "All Divisions (K-12)",
      title: "School Director / Head of Academy",
      email: "saliou2007@yahoo.com",
      password: "admin",
      phone: "+19174788477",
      avatar: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80"
    }
  ],
  courses: [],
  assignments: [],
  students: [],
  gradebook: [],
  attendance: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Clear any legacy demo data and old demo director keys from localStorage
  localStorage.removeItem('american_dara_academy_gradelink_data');
  localStorage.removeItem('american_dara_academy_gradelink_data_v2');
  localStorage.removeItem('american_dara_academy_gradelink_data_v3');
  localStorage.removeItem('american_dara_academy_gradelink_data_v4');
  
  if (localStorage.getItem('ada_clean_user_email') === 'director@americandaraacademy.edu') {
    localStorage.setItem('ada_clean_user_email', 'saliou2007@yahoo.com');
  }

  await loadAppData();
  sanitizeStaffData();
  initializeAuthentication();
  applyBrandingAndLetterhead();
  populateAllDropdowns();
  refreshActiveView();
  fetchPublicPortalUrl();
  startRealtimeCloudSync();
  lucide.createIcons();
});

async function loadAppData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      schoolData = await res.json();
    } else {
      loadFromLocalStorage();
    }
  } catch (e) {
    loadFromLocalStorage();
  }
}

function sanitizeStaffData() {
  if (!schoolData || !schoolData.staff) return;

  // Filter out any legacy demo director accounts
  schoolData.staff = schoolData.staff.filter(s => s.email !== 'director@americandaraacademy.edu' && s.name !== 'School Director');

  // Ensure Mamadou Saliou Diallo is the primary Director
  let mainDirector = schoolData.staff.find(s => s.email === 'saliou2007@yahoo.com');
  if (!mainDirector) {
    mainDirector = {
      id: "DIR-001",
      name: "Mamadou Saliou Diallo",
      role: "DIRECTOR",
      division: "All Divisions (K-12)",
      title: "School Director / Head of Academy",
      email: "saliou2007@yahoo.com",
      password: "admin",
      phone: "+19174788477",
      avatar: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80"
    };
    schoolData.staff.unshift(mainDirector);
  } else {
    mainDirector.name = "Mamadou Saliou Diallo";
    mainDirector.phone = "+19174788477";
    mainDirector.avatar = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80";
  }

  saveAppDataLocal();
}

function loadFromLocalStorage() {
  const local = localStorage.getItem('american_dara_academy_clean_v1');
  if (local) {
    try {
      schoolData = JSON.parse(local);
    } catch (e) {
      schoolData = JSON.parse(JSON.stringify(CLEAN_SEED_DATA));
    }
  } else {
    schoolData = JSON.parse(JSON.stringify(CLEAN_SEED_DATA));
    saveAppDataLocal();
  }
}

function saveAppDataLocal() {
  localStorage.setItem('american_dara_academy_clean_v1', JSON.stringify(schoolData));
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & STRICT TEACHER RBAC
// -------------------------------------------------------------
function initializeAuthentication() {
  const savedUserEmail = localStorage.getItem('ada_clean_user_email');
  if (savedUserEmail && schoolData.staff) {
    currentStaffUser = schoolData.staff.find(s => s.email === savedUserEmail) || schoolData.staff[0];
  } else {
    currentStaffUser = schoolData.staff[0] || null;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const avatarEl = document.getElementById('auth-user-avatar');
  const nameEl = document.getElementById('auth-user-name');
  const roleEl = document.getElementById('auth-user-role');
  const dashWelcome = document.getElementById('dash-welcome-name');
  const dashRolePill = document.getElementById('dash-role-pill');
  const dashDesc = document.getElementById('dash-welcome-description');
  const headerRoleBadge = document.getElementById('header-role-badge');
  const logoutBtn = document.getElementById('auth-logout-btn');
  const loginBtn = document.getElementById('auth-login-btn');

  const role = currentStaffUser ? currentStaffUser.role : 'GUEST';

  if (currentStaffUser) {
    avatarEl.src = currentStaffUser.avatar || schoolData?.schoolInfo?.logoUrl || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80";
    nameEl.innerText = currentStaffUser.name;
    roleEl.innerText = `${currentStaffUser.role} • ${currentStaffUser.division}`;
    if (dashWelcome) dashWelcome.innerText = currentStaffUser.name;
    if (headerRoleBadge) headerRoleBadge.innerText = currentStaffUser.role;

    if (role === 'TEACHER') {
      if (dashRolePill) dashRolePill.innerHTML = `<i data-lucide="award" class="w-3.5 h-3.5 text-emerald-400"></i> Teacher Portal: Assignments & Gradebook`;
      if (dashDesc) dashDesc.innerText = `Create assignments (Exam, Homework, Class Work, Class Test), upload worksheets, and enter or edit student marks.`;
    } else {
      if (dashRolePill) dashRolePill.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-300"></i> Administrative Portal: ${role}`;
      if (dashDesc) dashDesc.innerText = `Manage Lower, Middle, and High School subjects, staff accounts, student admissions, and school logo/letterhead images.`;
    }
    
    logoutBtn.classList.remove('hidden');
    loginBtn.classList.add('hidden');
  } else {
    avatarEl.src = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80";
    nameEl.innerText = "Guest";
    roleEl.innerText = "Logged Out";
    if (dashWelcome) dashWelcome.innerText = "Guest";
    if (headerRoleBadge) headerRoleBadge.innerText = "LOGIN";

    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
  }

  // Filter UI by allowed role
  const restrictedElements = document.querySelectorAll('[data-role-restricted]');
  restrictedElements.forEach(el => {
    const allowedRoles = el.getAttribute('data-role-restricted').split(',');
    if (allowedRoles.includes(role)) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  lucide.createIcons();
}

function openLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  const user = (schoolData.staff || []).find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
  if (user) {
    currentStaffUser = user;
    localStorage.setItem('ada_clean_user_email', user.email);
    closeLoginModal();
    updateAuthUI();
    showToast(`Logged in as ${user.role}: ${user.name}!`, "success");
    confetti({ particleCount: 40, spread: 60 });
    navigateToDashboard();
  } else {
    alert("Invalid credentials. Please check your email and password.");
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to log out?")) {
    currentStaffUser = null;
    localStorage.removeItem('ada_clean_user_email');
    updateAuthUI();
    showToast("Logged out successfully.", "info");
    openLoginModal();
  }
}

// -------------------------------------------------------------
// 2. IMAGE UPLOADS FOR SCHOOL LOGO & LETTERHEAD BANNER
// -------------------------------------------------------------
function previewLogoFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    tempLogoDataUrl = e.target.result;
    document.getElementById('cfg-logo-preview-img').src = tempLogoDataUrl;
    document.getElementById('cfg-logo-url').value = '';
    showToast("Selected new logo image file!", "info");
  };
  reader.readAsDataURL(file);
}

function previewLogoUrl(url) {
  if (!url.trim()) return;
  tempLogoDataUrl = url.trim();
  document.getElementById('cfg-logo-preview-img').src = tempLogoDataUrl;
}

function previewLetterheadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    tempLetterheadDataUrl = e.target.result;
    const img = document.getElementById('cfg-letterhead-preview-img');
    img.src = tempLetterheadDataUrl;
    img.classList.remove('hidden');
    document.getElementById('cfg-letterhead-image-url').value = '';
    document.getElementById('cfg-use-image-letterhead').checked = true;
    showToast("Selected new graphic letterhead banner image!", "info");
  };
  reader.readAsDataURL(file);
}

function previewLetterheadUrl(url) {
  if (!url.trim()) return;
  tempLetterheadDataUrl = url.trim();
  const img = document.getElementById('cfg-letterhead-preview-img');
  img.src = tempLetterheadDataUrl;
  img.classList.remove('hidden');
}

function openLetterheadConfigModal() {
  if (!currentStaffUser || currentStaffUser.role !== 'DIRECTOR') {
    showToast("Logo & Letterhead image settings are restricted to the School Director.", "error");
    return;
  }
  const info = schoolData.schoolInfo;
  const lh = info.letterhead || {};

  tempLogoDataUrl = info.logoUrl || '';
  tempLetterheadDataUrl = lh.letterheadImageUrl || '';

  document.getElementById('cfg-logo-preview-img').src = tempLogoDataUrl || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80";
  document.getElementById('cfg-logo-url').value = info.logoUrl || '';

  const lhImg = document.getElementById('cfg-letterhead-preview-img');
  if (tempLetterheadDataUrl) {
    lhImg.src = tempLetterheadDataUrl;
    lhImg.classList.remove('hidden');
  } else {
    lhImg.src = '';
  }

  document.getElementById('cfg-letterhead-image-url').value = lh.letterheadImageUrl || '';
  document.getElementById('cfg-use-image-letterhead').checked = lh.useImageLetterhead === true;

  document.getElementById('cfg-header-title').value = lh.headerTitle || info.name;
  document.getElementById('cfg-sub-header').value = lh.subHeader || '';
  document.getElementById('cfg-watermark').checked = lh.watermarkEnabled !== false;

  const websiteInput = document.getElementById('cfg-website');
  if (websiteInput) websiteInput.value = info.website || 'americandaraacademy.gradelink.com';

  const opacityPercent = Math.round((parseFloat(lh.dashboardLogoOpacity) || 0.20) * 100);
  const slider = document.getElementById('cfg-dash-opacity-slider');
  const valBadge = document.getElementById('cfg-dash-opacity-val');
  if (slider) slider.value = opacityPercent;
  if (valBadge) valBadge.innerText = `${opacityPercent}%`;

  document.getElementById('letterhead-config-modal').classList.remove('hidden');
  lucide.createIcons();
}

function updateDashboardWatermarkOpacity(val) {
  const percent = parseInt(val);
  const badge = document.getElementById('cfg-dash-opacity-val');
  if (badge) badge.innerText = `${percent}%`;

  const wrapper = document.querySelector('.dashboard-watermark-wrapper');
  if (wrapper) {
    wrapper.style.opacity = (percent / 100).toString();
  }
}

function closeLetterheadConfigModal() {
  document.getElementById('letterhead-config-modal').classList.add('hidden');
}

async function handleSaveLetterhead(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const logoUrl = tempLogoDataUrl || formData.get('logoUrl').trim() || schoolData.schoolInfo.logoUrl;
  const letterheadImageUrl = tempLetterheadDataUrl || formData.get('letterheadImageUrl').trim() || schoolData.schoolInfo.letterhead?.letterheadImageUrl || '';
  const useImageLetterhead = formData.get('useImageLetterhead') !== null;
  const opacityVal = parseFloat(formData.get('dashboardLogoOpacity') || 20) / 100;
  const website = (formData.get('website') || 'americandaraacademy.gradelink.com').trim();

  schoolData.schoolInfo.logoUrl = logoUrl;
  schoolData.schoolInfo.website = website;
  schoolData.schoolInfo.letterhead = {
    ...schoolData.schoolInfo.letterhead,
    useImageLetterhead: useImageLetterhead,
    letterheadImageUrl: letterheadImageUrl,
    dashboardLogoOpacity: opacityVal,
    headerTitle: formData.get('headerTitle').trim() || schoolData.schoolInfo.name,
    subHeader: formData.get('subHeader').trim(),
    contact: `Tel: +221 33 869 2000 | Web: ${website}`,
    watermarkEnabled: formData.get('watermarkEnabled') !== null
  };

  saveAppDataLocal();

  try {
    await fetch('/api/school-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData.schoolInfo)
    });
  } catch (err) {}

  applyBrandingAndLetterhead();
  closeLetterheadConfigModal();
  showToast("Saved School Logo & Letterhead Images successfully!", "success");
  confetti({ particleCount: 50, spread: 60 });
}

function applyBrandingAndLetterhead() {
  const info = schoolData.schoolInfo;
  const lh = info.letterhead || {};
  const currentDomain = info.website || 'americandaraacademy.gradelink.com';

  // 1. App Header Logo Icon & Domain Badge
  const headerLogo = document.getElementById('app-header-logo');
  if (headerLogo && info.logoUrl) headerLogo.src = info.logoUrl;

  const websiteBadge = document.getElementById('header-website-badge');
  if (websiteBadge) {
    websiteBadge.innerHTML = `<i data-lucide="globe" class="w-3 h-3"></i> ${currentDomain}`;
    websiteBadge.href = `https://${currentDomain}`;
  }

  // 2. Dashboard Center Background Watermark Logo with High Visibility Lighting
  const dashBgLogo = document.getElementById('dash-bg-watermark-logo');
  const dashWrapper = document.querySelector('.dashboard-watermark-wrapper');
  if (dashBgLogo && info.logoUrl) {
    dashBgLogo.src = info.logoUrl;
  }
  if (dashWrapper) {
    const opVal = lh.dashboardLogoOpacity !== undefined ? lh.dashboardLogoOpacity : 0.20;
    dashWrapper.style.opacity = opVal.toString();
  }

  // 3. Document Print Background Watermark Overlay
  const watermarkImg = document.getElementById('print-watermark-img');
  if (watermarkImg) {
    if (info.logoUrl) watermarkImg.src = info.logoUrl;
    watermarkImg.style.display = lh.watermarkEnabled !== false ? 'block' : 'none';
  }

  // 4. Official Printable Letterhead Header
  const graphicContainer = document.getElementById('print-letterhead-image-container');
  const textContainer = document.getElementById('print-letterhead-text-container');
  const graphicImg = document.getElementById('print-graphic-letterhead-img');
  const printContact = document.getElementById('print-contact');

  if (printContact) {
    printContact.innerHTML = `Tel: +221 33 869 2000 | Web: <span class="font-bold text-ada-navy">${currentDomain}</span>`;
  }

  if (lh.useImageLetterhead && lh.letterheadImageUrl && graphicContainer && textContainer && graphicImg) {
    graphicImg.src = lh.letterheadImageUrl;
    graphicContainer.classList.remove('hidden');
    textContainer.classList.add('hidden');
  } else if (graphicContainer && textContainer) {
    graphicContainer.classList.add('hidden');
    textContainer.classList.remove('hidden');
    const letterheadLogo = document.getElementById('print-letterhead-logo');
    if (letterheadLogo && info.logoUrl) letterheadLogo.src = info.logoUrl;
  }
  lucide.createIcons();
}

// -------------------------------------------------------------
// 3. CENTRAL REACTIVE DROPDOWNS
// -------------------------------------------------------------
function buildCourseOptgroupsHTML(selectedCourseId = '') {
  if (!schoolData.courses || schoolData.courses.length === 0) {
    return `<option value="">-- No subjects created yet. Click "+ Subject" --</option>`;
  }

  const lowerCourses = schoolData.courses.filter(c => c.division === 'Lower School');
  const middleCourses = schoolData.courses.filter(c => c.division === 'Middle School');
  const highCourses = schoolData.courses.filter(c => c.division === 'High School');

  let html = '';

  if (lowerCourses.length > 0) {
    html += `<optgroup label="--- LOWER SCHOOL (K-5) ---">`;
    lowerCourses.forEach(c => {
      html += `<option value="${c.id}" ${c.id === selectedCourseId ? 'selected' : ''}>[Lower School] ${c.name} (${c.category})</option>`;
    });
    html += `</optgroup>`;
  }

  if (middleCourses.length > 0) {
    html += `<optgroup label="--- MIDDLE SCHOOL (6-8) ---">`;
    middleCourses.forEach(c => {
      html += `<option value="${c.id}" ${c.id === selectedCourseId ? 'selected' : ''}>[Middle School] ${c.name} (${c.category})</option>`;
    });
    html += `</optgroup>`;
  }

  if (highCourses.length > 0) {
    html += `<optgroup label="--- HIGH SCHOOL (9-12) ---">`;
    highCourses.forEach(c => {
      html += `<option value="${c.id}" ${c.id === selectedCourseId ? 'selected' : ''}>[High School] ${c.name} (${c.category})</option>`;
    });
    html += `</optgroup>`;
  }

  return html;
}

function buildTeacherDropdownHTML(selectedTeacherId = '') {
  if (!schoolData.staff || schoolData.staff.length === 0) {
    return `<option value="">-- No staff registered yet --</option>`;
  }

  let html = '';
  const divisions = ['Lower School', 'Middle School', 'High School', 'All Divisions (K-12)'];
  divisions.forEach(div => {
    const list = schoolData.staff.filter(t => t.division === div || div === 'All Divisions (K-12)');
    if (list.length > 0) {
      html += `<optgroup label="--- ${div.toUpperCase()} STAFF ---">`;
      list.forEach(t => {
        html += `<option value="${t.id}" ${t.id === selectedTeacherId ? 'selected' : ''}>${t.name} (${t.title || t.role})</option>`;
      });
      html += `</optgroup>`;
    }
  });
  return html;
}

function buildStudentDropdownHTML(selectedStudentId = '') {
  if (!schoolData.students || schoolData.students.length === 0) {
    return `<option value="">-- No students enrolled yet. Click "+ Student" --</option>`;
  }

  let html = '';
  const divisions = ['Lower School', 'Middle School', 'High School'];
  divisions.forEach(div => {
    const list = schoolData.students.filter(s => s.division === div);
    if (list.length > 0) {
      html += `<optgroup label="--- ${div.toUpperCase()} STUDENTS ---">`;
      list.forEach(s => {
        html += `<option value="${s.id}" ${s.id === selectedStudentId ? 'selected' : ''}>${s.firstName} ${s.lastName} (ID: ${s.id} • Grade ${s.grade === 0 ? 'K' : s.grade})</option>`;
      });
      html += `</optgroup>`;
    }
  });
  return html;
}

function populateAllDropdowns() {
  const courseOptgroups = buildCourseOptgroupsHTML();
  const teacherOptgroups = buildTeacherDropdownHTML();
  const studentOptgroups = buildStudentDropdownHTML();

  const asnCourseSelect = document.getElementById('asn-course-select');
  if (asnCourseSelect) asnCourseSelect.innerHTML = courseOptgroups;

  const gradebookSelect = document.getElementById('gradebook-class-select');
  if (gradebookSelect) gradebookSelect.innerHTML = courseOptgroups;

  const attendanceSelect = document.getElementById('attendance-class-select');
  if (attendanceSelect) attendanceSelect.innerHTML = courseOptgroups;

  const gradeCourseSelect = document.getElementById('grade-course-select');
  if (gradeCourseSelect) gradeCourseSelect.innerHTML = courseOptgroups;

  const enrollCourseSelect = document.getElementById('enroll-student-course');
  if (enrollCourseSelect) enrollCourseSelect.innerHTML = courseOptgroups;

  const enrollTeacherSelect = document.getElementById('enroll-student-teacher');
  if (enrollTeacherSelect) enrollTeacherSelect.innerHTML = teacherOptgroups;

  const courseTeacherSelect = document.getElementById('course-teacher-select');
  if (courseTeacherSelect) courseTeacherSelect.innerHTML = teacherOptgroups;

  const gradeStudentSelect = document.getElementById('grade-student-select');
  if (gradeStudentSelect) gradeStudentSelect.innerHTML = studentOptgroups;
}

// -------------------------------------------------------------
// 4. NAVIGATION
// -------------------------------------------------------------
function navigateToDashboard() {
  switchView('dashboard');
}

function switchView(viewId) {
  if (currentStaffUser && currentStaffUser.role === 'TEACHER' && viewId === 'students') {
    showToast("Student SIS management is restricted to Academic Deans and Director.", "error");
    return;
  }

  currentView = viewId;
  const views = ['dashboard', 'assignments', 'students', 'gradebook', 'attendance'];
  
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewId) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  const breadcrumbText = document.getElementById('breadcrumb-current-view');
  if (breadcrumbText) {
    const titles = {
      dashboard: 'GradeLink Hub',
      assignments: 'Assignments & Assessments',
      students: 'Student Information System',
      gradebook: 'Master Gradebook & Marks',
      attendance: 'Daily Attendance Tracker'
    };
    breadcrumbText.innerText = titles[viewId] || 'Portal';
  }

  refreshActiveView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshActiveView() {
  updateDashboardTiles();
  if (currentView === 'dashboard') renderDashboardView();
  else if (currentView === 'assignments') renderAssignmentsView();
  else if (currentView === 'students') renderStudentsSIS();
  else if (currentView === 'gradebook') renderGradebookView();
  else if (currentView === 'attendance') renderAttendanceView();

  lucide.createIcons();
}

function updateDashboardTiles() {
  const asnTile = document.getElementById('tile-assignment-count');
  if (asnTile) asnTile.innerText = `${(schoolData.assignments || []).length} Active`;

  const stuTile = document.getElementById('tile-student-count');
  if (stuTile) stuTile.innerText = `${(schoolData.students || []).length} Enrolled`;

  const crsTile = document.getElementById('tile-course-count');
  if (crsTile) crsTile.innerText = `${(schoolData.courses || []).length} Subjects`;

  const stfTile = document.getElementById('tile-staff-count');
  if (stfTile) stfTile.innerText = `${(schoolData.staff || []).length} Staff`;
}

function renderDashboardView() {
  const tbody = document.getElementById('dash-quick-students-tbody');
  if (!tbody) return;

  if (!schoolData.students || schoolData.students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400">
          <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <i data-lucide="users" class="w-5 h-5"></i>
          </div>
          <div class="font-bold text-slate-700 text-xs">No students enrolled in the academy yet.</div>
          <p class="text-[11px] text-slate-400 mt-1">Use the <b>"+ Student"</b> button to admit your first student.</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = schoolData.students.map(s => `
    <tr class="hover:bg-slate-50 transition text-xs">
      <td class="p-3 font-bold text-slate-900 flex items-center gap-2">
        <img src="${s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" class="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200">
        <span>${s.firstName} ${s.lastName}</span>
      </td>
      <td class="p-3 font-mono text-slate-500">${s.id}</td>
      <td class="p-3 font-semibold text-slate-800">${s.division} (Grade ${s.grade === 0 ? 'K' : s.grade})</td>
      <td class="p-3 text-slate-600">${s.assignedTeacherName || 'Faculty Assigned'}</td>
      <td class="p-3 font-extrabold text-emerald-700">${s.currentScore || 0}%</td>
      <td class="p-3 font-black text-ada-navy">${(s.gpa || 0).toFixed(2)}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openManualGradeModal('${s.id}')" class="px-2 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-[10px] hover:bg-emerald-100">+ Grade</button>
        <button onclick="switchView('gradebook')" class="px-2 py-1 bg-slate-100 text-ada-navy font-bold rounded-lg text-[10px] hover:bg-slate-200">Edit Marks</button>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------
// 5. ASSIGNMENTS MANAGEMENT
// -------------------------------------------------------------
function openAddAssignmentModal(preselectedCourseId = '') {
  if (!schoolData.courses || schoolData.courses.length === 0) {
    showToast("Please add at least one Subject first using '+ Subject'.", "error");
    openAddCourseModal();
    return;
  }
  populateAllDropdowns();
  if (preselectedCourseId) {
    const courseSelect = document.getElementById('asn-course-select');
    if (courseSelect) courseSelect.value = preselectedCourseId;
  }
  document.getElementById('add-assignment-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeAddAssignmentModal() {
  document.getElementById('add-assignment-modal').classList.add('hidden');
}

async function handleCreateAssignment(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const courseId = formData.get('courseId');
  const course = (schoolData.courses || []).find(c => c.id === courseId);
  const title = formData.get('title').trim();
  const category = formData.get('category');
  const maxScore = parseFloat(formData.get('maxScore')) || 100;
  const dueDate = formData.get('dueDate');
  const description = formData.get('description') || '';

  const fileInput = document.getElementById('asn-file-input');
  let attachment = null;
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    attachment = {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
  }

  const newAssignment = {
    id: `ASN-${Date.now().toString().slice(-4)}`,
    courseId: course ? course.id : 'SUBJ-GEN',
    courseName: course ? course.name : 'General Course',
    division: course ? course.division : 'High School',
    title: title,
    category: category,
    maxScore: maxScore,
    dueDate: dueDate,
    description: description,
    attachment: attachment,
    teacherId: currentStaffUser ? currentStaffUser.id : 'DIR-001',
    teacherName: currentStaffUser ? currentStaffUser.name : 'Faculty Instructor'
  };

  if (!schoolData.assignments) schoolData.assignments = [];
  schoolData.assignments.unshift(newAssignment);

  injectAssignmentIntoGradebook(newAssignment);
  saveAppDataLocal();

  try {
    await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignment)
    });
  } catch (err) {}

  closeAddAssignmentModal();
  form.reset();
  showToast(`Added [${category}] "${title}"!`, "success");
  confetti({ particleCount: 40, spread: 60 });
  refreshActiveView();
}

function injectAssignmentIntoGradebook(assignment) {
  const course = schoolData.courses.find(c => c.id === assignment.courseId);
  const enrolledStudents = (schoolData.students || []).filter(s => s.division === (course?.division || 'High School'));

  enrolledStudents.forEach(s => {
    let gradeRecord = schoolData.gradebook.find(g => g.studentId === s.id && g.classId === assignment.courseId);
    if (!gradeRecord) {
      gradeRecord = {
        id: `GRD-${s.id}-${assignment.courseId}`,
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        classId: assignment.courseId,
        className: assignment.courseName,
        term: "Academic Year 2026",
        assessments: [],
        currentGradePercentage: 0,
        letterGrade: "N/A",
        teacherComment: ""
      };
      schoolData.gradebook.push(gradeRecord);
    }

    const exists = gradeRecord.assessments.some(a => a.assignmentId === assignment.id);
    if (!exists) {
      gradeRecord.assessments.push({
        assignmentId: assignment.id,
        name: assignment.title,
        category: assignment.category,
        maxScore: assignment.maxScore,
        score: 0,
        weight: 20
      });
      recalculateGradebookEntry(gradeRecord);
    }
  });
}

function filterAssignmentsByCategory(cat) {
  activeAssignmentCategoryFilter = cat;
  const buttons = ['all', 'exam', 'hw', 'cw', 'test'];
  buttons.forEach(b => {
    const btn = document.getElementById(`asn-filter-${b}`);
    if (btn) {
      if ((b === 'all' && cat === 'all') || (b === 'exam' && cat === 'Exam') || (b === 'hw' && cat === 'Homework') || (b === 'cw' && cat === 'Class Work') || (b === 'test' && cat === 'Class Test')) {
        btn.className = "px-3.5 py-1.5 bg-ada-navy text-white rounded-lg text-xs font-bold shadow";
      } else {
        btn.className = "px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-lg text-xs font-bold";
      }
    }
  });
  renderAssignmentsView();
}

function renderAssignmentsView() {
  const container = document.getElementById('assignments-grid-container');
  if (!container) return;

  const list = (schoolData.assignments || []).filter(a => {
    return activeAssignmentCategoryFilter === 'all' || a.category === activeAssignmentCategoryFilter;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <i data-lucide="file-plus" class="w-6 h-6"></i>
        </div>
        <h3 class="font-bold text-ada-navy text-base">No Assignments Created Yet</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto">Teachers can add Exams, Homework, Class Work, and Class Tests with optional worksheet uploads.</p>
        <button onclick="openAddAssignmentModal()" class="px-4 py-2 bg-ada-navy text-white font-bold rounded-xl text-xs shadow">
          + Create Assignment
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const badgeStyles = {
    'Exam': 'bg-red-100 text-red-800 border-red-200',
    'Homework': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Class Work': 'bg-blue-100 text-blue-800 border-blue-200',
    'Class Test': 'bg-amber-100 text-amber-800 border-amber-200'
  };

  container.innerHTML = list.map(a => `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badgeStyles[a.category] || 'bg-slate-100 text-slate-800'}">
            ${a.category}
          </span>
          <span class="text-[10px] font-bold text-slate-500">Max ${a.maxScore} Pts</span>
        </div>
        
        <h3 class="font-crest font-bold text-base text-ada-navy leading-tight">${a.title}</h3>
        <div class="text-xs text-slate-500 font-semibold">${a.courseName} • <span class="text-amber-800">${a.division}</span></div>
        <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${a.description || 'Complete according to syllabus instructions.'}</p>
        
        ${a.attachment ? `
          <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 truncate">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span class="font-bold text-slate-800 truncate">${a.attachment.fileName}</span>
            </div>
            <button onclick="downloadWorksheetAttachment('${a.attachment.fileName}')" class="text-ada-navy font-bold text-[10px] hover:underline flex items-center gap-1 shrink-0 ml-2">
              <i data-lucide="download" class="w-3 h-3"></i> Get File
            </button>
          </div>
        ` : ''}
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div class="text-[10px] text-slate-400">Due: <b class="text-slate-700">${a.dueDate || 'Open'}</b></div>
        <button onclick="openGradeAssignmentRosterModal('${a.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1">
          <i data-lucide="award" class="w-3.5 h-3.5"></i> Grade Submissions
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function downloadWorksheetAttachment(fileName) {
  showToast(`Downloading worksheet: ${fileName}`, "info");
  const blob = new Blob([`American Dara Academy - Worksheet\nDocument: ${fileName}\nDate: ${new Date().toLocaleDateString()}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// -------------------------------------------------------------
// 6. BATCH ROSTER GRADING MODAL
// -------------------------------------------------------------
function openGradeAssignmentRosterModal(assignmentId) {
  const assignment = (schoolData.assignments || []).find(a => a.id === assignmentId);
  if (!assignment) return;

  document.getElementById('roster-modal-title').innerHTML = `
    <i data-lucide="award" class="w-5 h-5 text-amber-300"></i> Grade: ${assignment.title}
  `;
  document.getElementById('roster-modal-subtitle').innerText = `
    Subject: ${assignment.courseName} | Type: ${assignment.category} | Max Score: ${assignment.maxScore} Pts
  `;

  const tbody = document.getElementById('roster-grading-tbody');
  const course = schoolData.courses.find(c => c.id === assignment.courseId);
  const enrolledStudents = (schoolData.students || []).filter(s => s.division === (course?.division || 'High School'));

  if (enrolledStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">No students enrolled under ${course?.division || 'this division'} yet.</td></tr>`;
  } else {
    tbody.innerHTML = enrolledStudents.map(s => {
      const gradeRecord = schoolData.gradebook.find(g => g.studentId === s.id && g.classId === assignment.courseId);
      const assessment = gradeRecord?.assessments.find(a => a.assignmentId === assignment.id || a.name === assignment.title);
      const currentScore = assessment ? assessment.score : 0;

      return `
        <tr class="hover:bg-slate-50 transition text-xs" data-student-id="${s.id}">
          <td class="p-3 font-bold text-slate-900 flex items-center gap-2">
            <img src="${s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}" class="w-6 h-6 rounded-full object-cover">
            <span>${s.firstName} ${s.lastName}</span>
          </td>
          <td class="p-3 font-mono text-slate-500">${s.id}</td>
          <td class="p-3 text-center">
            <input type="number" step="0.5" min="0" max="${assignment.maxScore}" value="${currentScore}"
              onchange="saveRosterGradeScore('${assignment.id}', '${s.id}', '${assignment.courseId}', this.value)"
              class="w-20 text-center font-black text-sm p-1.5 bg-amber-50 border border-amber-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-ada-navy">
          </td>
          <td class="p-3 text-center">
            <span id="roster-grade-badge-${s.id}" class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              ${currentScore >= (assignment.maxScore * 0.9) ? 'A' : (currentScore >= (assignment.maxScore * 0.8) ? 'B' : (currentScore > 0 ? 'C' : 'Pending'))}
            </span>
          </td>
          <td class="p-3">
            <input type="text" placeholder="Teacher feedback..." value=""
              class="w-full text-xs p-1.5 bg-slate-50 border rounded-lg">
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('grade-assignment-roster-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeGradeAssignmentRosterModal() {
  document.getElementById('grade-assignment-roster-modal').classList.add('hidden');
  refreshActiveView();
}

function saveRosterGradeScore(assignmentId, studentId, courseId, newScoreVal) {
  const score = parseFloat(newScoreVal);
  if (isNaN(score)) return;

  const assignment = schoolData.assignments.find(a => a.id === assignmentId);
  const maxScore = assignment ? assignment.maxScore : 100;

  let gradeRecord = schoolData.gradebook.find(g => g.studentId === studentId && g.classId === courseId);
  if (!gradeRecord) {
    const student = schoolData.students.find(s => s.id === studentId);
    gradeRecord = {
      id: `GRD-${studentId}-${courseId}`,
      studentId: studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Scholar',
      classId: courseId,
      className: assignment ? assignment.courseName : 'Course',
      assessments: [],
      currentGradePercentage: 0,
      letterGrade: "N/A",
      teacherComment: ""
    };
    schoolData.gradebook.push(gradeRecord);
  }

  let assessment = gradeRecord.assessments.find(a => a.assignmentId === assignmentId || a.name === assignment?.title);
  if (!assessment) {
    assessment = {
      assignmentId: assignmentId,
      name: assignment ? assignment.title : 'Assessment',
      category: assignment ? assignment.category : 'Exam',
      maxScore: maxScore,
      score: score,
      weight: 20
    };
    gradeRecord.assessments.push(assessment);
  } else {
    assessment.score = score;
  }

  recalculateGradebookEntry(gradeRecord);
  saveAppDataLocal();

  const badge = document.getElementById(`roster-grade-badge-${studentId}`);
  if (badge) {
    const pct = (score / maxScore) * 100;
    const ltr = pct >= 90 ? 'A' : (pct >= 80 ? 'B' : (pct >= 70 ? 'C' : 'F'));
    badge.innerText = ltr;
  }

  showToast(`Updated score to ${score}/${maxScore} for ${gradeRecord.studentName}!`, "success");
}

// -------------------------------------------------------------
// 7. MASTER GRADEBOOK & INLINE EDITING
// -------------------------------------------------------------
function renderGradebookView() {
  renderGradebookTable();
}

function renderGradebookTable() {
  const classId = document.getElementById('gradebook-class-select')?.value;
  const headerRow = document.getElementById('gradebook-header-row');
  const bodyRows = document.getElementById('gradebook-body-rows');

  if (!classId || !schoolData.courses || schoolData.courses.length === 0) {
    if (headerRow) headerRow.innerHTML = `<th class="p-3 text-center">No Subjects Available</th>`;
    if (bodyRows) bodyRows.innerHTML = `<tr><td class="p-8 text-center text-slate-400">Please add subjects first using the <b>"+ Subject"</b> button.</td></tr>`;
    return;
  }

  const records = (schoolData.gradebook || []).filter(g => g.classId === classId);
  const course = schoolData.courses.find(c => c.id === classId);
  const candidateStudents = (schoolData.students || []).filter(s => s.division === (course?.division || 'High School'));

  if (candidateStudents.length === 0) {
    if (headerRow) headerRow.innerHTML = `<th class="p-3 text-left">Subject: ${course?.name || 'Class'}</th>`;
    if (bodyRows) bodyRows.innerHTML = `<tr><td class="p-8 text-center text-slate-400">No students enrolled under ${course?.division || 'this division'} yet. Use <b>"+ Student"</b> to add students.</td></tr>`;
    return;
  }

  const sampleAssessments = records[0]?.assessments || [];

  const catColors = {
    'Exam': 'text-red-700 bg-red-50',
    'Homework': 'text-emerald-700 bg-emerald-50',
    'Class Work': 'text-blue-700 bg-blue-50',
    'Class Test': 'text-amber-700 bg-amber-50'
  };

  if (headerRow) {
    headerRow.innerHTML = `
      <th class="p-3">Scholar</th>
      ${sampleAssessments.map((a, aIdx) => `
        <th class="p-3 text-center">
          <div class="font-bold">${a.name}</div>
          <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded ${catColors[a.category] || 'bg-slate-100 text-slate-700'}">${a.category || 'Exam'}</span>
          <span class="text-[10px] text-slate-400 font-normal block">Max ${a.maxScore}</span>
        </th>
      `).join('')}
      <th class="p-3 text-center">Term Avg</th>
      <th class="p-3 text-center">Grade</th>
      <th class="p-3">Remarks</th>
      <th class="p-3 text-right">Actions</th>
    `;
  }

  if (bodyRows) {
    bodyRows.innerHTML = candidateStudents.map(s => {
      let r = records.find(g => g.studentId === s.id);
      if (!r) {
        r = {
          id: `GRD-${s.id}-${classId}`,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          assessments: [],
          currentGradePercentage: 0,
          letterGrade: 'N/A',
          teacherComment: ''
        };
      }

      return `
        <tr class="hover:bg-slate-50 transition text-xs" data-gradebook-id="${r.id}">
          <td class="p-3 font-bold text-slate-900">${s.firstName} ${s.lastName}</td>
          ${sampleAssessments.map((a, aIdx) => {
            const studentScore = r.assessments[aIdx]?.score || 0;
            return `
              <td class="p-3 text-center">
                <input type="number" step="0.5" value="${studentScore}" min="0" max="${a.maxScore}" 
                  onchange="updateInlineGradeScore('${r.id}', ${aIdx}, this.value)"
                  class="w-16 text-center font-bold text-xs p-1 bg-amber-50/60 border border-amber-300 rounded focus:bg-white focus:ring-2 focus:ring-ada-navy">
              </td>
            `;
          }).join('')}
          <td class="p-3 text-center font-black text-ada-navy">${r.currentGradePercentage || 0}%</td>
          <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">${r.letterGrade || 'N/A'}</span></td>
          <td class="p-3 text-xs italic text-slate-500">${r.teacherComment || ''}</td>
          <td class="p-3 text-right">
            <button onclick="openManualGradeModal('${s.id}', '${classId}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]">+ Score</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function updateInlineGradeScore(gradebookId, assessmentIndex, newScoreVal) {
  const score = parseFloat(newScoreVal);
  if (isNaN(score)) return;

  const record = schoolData.gradebook.find(g => g.id === gradebookId);
  if (!record || !record.assessments[assessmentIndex]) return;

  record.assessments[assessmentIndex].score = score;
  recalculateGradebookEntry(record);
  saveAppDataLocal();
  showToast(`Updated mark for ${record.studentName} to ${score}!`, "success");
  renderGradebookTable();
}

function recalculateGradebookEntry(record) {
  if (!record.assessments || record.assessments.length === 0) return;
  let totalAchieved = 0;
  let totalMax = 0;
  record.assessments.forEach(a => {
    totalAchieved += (a.score || 0);
    totalMax += (a.maxScore || 100);
  });

  const pct = totalMax > 0 ? (totalAchieved / totalMax) * 100 : 0;
  record.currentGradePercentage = parseFloat(pct.toFixed(1));

  if (pct >= 93) record.letterGrade = 'A';
  else if (pct >= 90) record.letterGrade = 'A-';
  else if (pct >= 87) record.letterGrade = 'B+';
  else if (pct >= 80) record.letterGrade = 'B';
  else if (pct >= 70) record.letterGrade = 'C';
  else record.letterGrade = 'F';

  const student = (schoolData.students || []).find(s => s.id === record.studentId);
  if (student) {
    student.currentScore = record.currentGradePercentage;
    student.gpa = parseFloat(((record.currentGradePercentage / 100) * 4.0).toFixed(2));
  }
}

function openManualGradeModal(preselectedStudentId = '', preselectedClassId = '') {
  if (!schoolData.students || schoolData.students.length === 0) {
    showToast("Please enroll a student first using '+ Student'.", "error");
    openEnrollStudentModal();
    return;
  }
  if (!schoolData.courses || schoolData.courses.length === 0) {
    showToast("Please add a subject first using '+ Subject'.", "error");
    openAddCourseModal();
    return;
  }

  populateAllDropdowns();
  if (preselectedStudentId) {
    const sSelect = document.getElementById('grade-student-select');
    if (sSelect) sSelect.value = preselectedStudentId;
  }
  if (preselectedClassId) {
    const cSelect = document.getElementById('grade-course-select');
    if (cSelect) cSelect.value = preselectedClassId;
  }
  document.getElementById('manual-grade-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeManualGradeModal() {
  document.getElementById('manual-grade-modal').classList.add('hidden');
}

async function handleManualGrade(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const studentId = formData.get('studentId');
  const classId = formData.get('classId');
  const assessmentName = formData.get('assessmentName');
  const category = formData.get('category');
  const score = parseFloat(formData.get('score'));
  const maxScore = parseFloat(formData.get('maxScore')) || 100;
  const teacherComment = formData.get('teacherComment') || '';

  const student = schoolData.students.find(s => s.id === studentId);
  const course = schoolData.courses.find(c => c.id === classId);

  let gradeEntry = schoolData.gradebook.find(g => g.studentId === studentId && g.classId === classId);
  if (!gradeEntry) {
    gradeEntry = {
      id: `GRD-${studentId}-${classId}`,
      studentId: studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Scholar',
      classId: classId,
      className: course ? course.name : 'Subject',
      term: "Academic Year 2026",
      assessments: [],
      currentGradePercentage: (score / maxScore) * 100,
      letterGrade: "A",
      teacherComment: teacherComment
    };
    schoolData.gradebook.push(gradeEntry);
  }

  gradeEntry.assessments.push({
    name: assessmentName,
    category: category,
    maxScore: maxScore,
    score: score,
    weight: 25
  });

  recalculateGradebookEntry(gradeEntry);
  saveAppDataLocal();

  try {
    await fetch('/api/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gradeEntry)
    });
  } catch (err) {}

  closeManualGradeModal();
  form.reset();
  showToast(`Recorded score for ${gradeEntry.studentName}!`, "success");
  refreshActiveView();
}

// -------------------------------------------------------------
// 8. ADMINISTRATIVE MODULES (SUBJECTS, STUDENTS, STAFF)
// -------------------------------------------------------------
function openAddCourseModal() {
  if (currentStaffUser && currentStaffUser.role === 'TEACHER') {
    showToast("Curriculum setup is managed by Academic Deans and Director.", "error");
    return;
  }
  populateAllDropdowns();
  document.getElementById('add-course-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeAddCourseModal() {
  document.getElementById('add-course-modal').classList.add('hidden');
}

async function handleAddCourse(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const name = formData.get('name').trim();
  const category = formData.get('category');
  const division = formData.get('division');
  const code = (formData.get('code') || name.slice(0, 4)).toUpperCase().trim();
  const teacherId = formData.get('teacherId');
  const teacher = (schoolData.staff || []).find(t => t.id === teacherId) || schoolData.staff[0];

  const newCourse = {
    id: `SUBJ-${Date.now().toString().slice(-4)}`,
    name: name,
    category: category,
    division: division,
    code: code,
    teacherId: teacher ? teacher.id : 'DIR-001',
    teacherName: teacher ? teacher.name : 'School Director',
    syllabus: ""
  };

  if (!schoolData.courses) schoolData.courses = [];
  schoolData.courses.push(newCourse);
  saveAppDataLocal();

  try {
    await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCourse)
    });
  } catch (err) {}

  populateAllDropdowns();
  closeAddCourseModal();
  form.reset();
  showToast(`Added [${division}] ${category}: "${name}"!`, "success");
  refreshActiveView();
}

function openEnrollStudentModal() {
  if (currentStaffUser && currentStaffUser.role === 'TEACHER') {
    showToast("Student admissions are managed by Academic Deans and Director.", "error");
    return;
  }
  populateAllDropdowns();
  const idInput = document.getElementById('enroll-student-id');
  if (idInput) {
    idInput.value = `ADA-LS-${String((schoolData.students || []).length + 1).padStart(3, '0')}`;
  }
  document.getElementById('enroll-student-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeEnrollModal() {
  document.getElementById('enroll-student-modal').classList.add('hidden');
}

function autoSyncDivisionFromGrade(gradeVal) {
  const grade = parseInt(gradeVal);
  const divSelect = document.getElementById('enroll-student-division');
  if (!divSelect) return;

  if (grade <= 5) divSelect.value = 'Lower School';
  else if (grade >= 6 && grade <= 8) divSelect.value = 'Middle School';
  else divSelect.value = 'High School';

  const idInput = document.getElementById('enroll-student-id');
  if (idInput) {
    const prefix = grade <= 5 ? 'ADA-LS' : (grade <= 8 ? 'ADA-MS' : 'ADA-HS');
    idInput.value = `${prefix}-${String((schoolData.students || []).length + 1).padStart(3, '0')}`;
  }
}

async function handleEnrollStudent(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const studentId = formData.get('studentId').trim();
  const grade = parseInt(formData.get('grade'));
  const division = formData.get('division');
  const firstName = formData.get('firstName').trim();
  const lastName = formData.get('lastName').trim();
  const assignedTeacherId = formData.get('assignedTeacherId');
  const enrolledCourseId = formData.get('enrolledCourseId');
  const initialScore = parseFloat(formData.get('initialScore')) || 0;
  const guardianName = (formData.get('guardianName') || '').trim();
  const guardianRelation = formData.get('guardianRelation') || 'Parent';
  const guardianPhone = (formData.get('guardianPhone') || '').trim();
  const guardianEmail = (formData.get('guardianEmail') || '').trim().toLowerCase();

  const teacher = (schoolData.staff || []).find(t => t.id === assignedTeacherId) || schoolData.staff[0];
  const course = (schoolData.courses || []).find(c => c.id === enrolledCourseId);

  const newStudent = {
    id: studentId,
    admissionNo: `ADM-${new Date().getFullYear()}-${String((schoolData.students || []).length + 1).padStart(3, '0')}`,
    division: division,
    firstName: firstName,
    lastName: lastName,
    grade: grade,
    section: `Grade ${grade === 0 ? 'K' : grade}-A`,
    assignedTeacherId: teacher ? teacher.id : 'DIR-001',
    assignedTeacherName: teacher ? teacher.name : 'Faculty Assigned',
    enrolledCourseId: course ? course.id : '',
    enrolledSubject: course ? course.name : 'General Curriculum',
    currentScore: initialScore,
    gpa: initialScore > 0 ? parseFloat(((initialScore / 100) * 4.0).toFixed(2)) : 0,
    attendanceRate: 100.0,
    guardianName: guardianName || 'Parent / Guardian',
    guardianRelation: guardianRelation,
    guardianPhone: guardianPhone,
    guardianEmail: guardianEmail,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  };

  if (!schoolData.students) schoolData.students = [];
  schoolData.students.unshift(newStudent);

  // If a course was selected, initialize a gradebook entry
  if (course) {
    let gradeRecord = schoolData.gradebook.find(g => g.studentId === studentId && g.classId === course.id);
    if (!gradeRecord) {
      gradeRecord = {
        id: `GRD-${studentId}-${course.id}`,
        studentId: studentId,
        studentName: `${firstName} ${lastName}`,
        classId: course.id,
        className: course.name,
        term: "Academic Year 2026",
        assessments: [
          {
            assignmentId: `ASN-INIT-${course.id}`,
            name: "Initial Core Assessment",
            category: "Exam",
            maxScore: 100,
            score: initialScore,
            weight: 30
          }
        ],
        currentGradePercentage: initialScore,
        letterGrade: initialScore >= 90 ? 'A' : (initialScore >= 80 ? 'B' : (initialScore >= 70 ? 'C' : 'F')),
        teacherComment: "Enrolled in active curriculum."
      };
      schoolData.gradebook.push(gradeRecord);
    }
  }

  saveAppDataLocal();

  try {
    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    });
  } catch (err) {}

  populateAllDropdowns();
  closeEnrollModal();
  form.reset();
  showToast(`Enrolled scholar ${newStudent.firstName} ${newStudent.lastName}!`, "success");
  refreshActiveView();
}

function renderStudentsSIS() {
  filterStudentList();
}

function filterStudentList() {
  const searchTerm = (document.getElementById('sis-search-input')?.value || '').toLowerCase();
  const divisionFilter = document.getElementById('sis-division-filter')?.value || 'all';

  const list = schoolData.students || [];
  const filtered = list.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName} ${s.id} ${s.guardianName || ''} ${s.guardianPhone || ''} ${s.guardianEmail || ''}`.toLowerCase().includes(searchTerm);
    const matchDiv = divisionFilter === 'all' || s.division === divisionFilter;
    return matchSearch && matchDiv;
  });

  const tbody = document.getElementById('sis-students-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400">
          <div class="font-bold text-slate-700 text-xs">No student records found.</div>
          <p class="text-[11px] text-slate-400 mt-1">Admit students using the <b>"+ Add Student"</b> button above.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr class="hover:bg-slate-50 transition text-xs">
      <td class="p-3.5 flex items-center gap-3">
        <img src="${s.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}" class="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200">
        <div>
          <div class="font-bold text-slate-900">${s.firstName} ${s.lastName}</div>
          <div class="text-[10px] text-slate-400 font-mono">${s.id}</div>
        </div>
      </td>
      <td class="p-3.5 font-mono text-slate-600 font-semibold">${s.id}</td>
      <td class="p-3.5 font-semibold text-slate-800">
        Grade ${s.grade === 0 ? 'K' : s.grade}
        <div class="text-[10px] text-amber-700 font-bold">${s.division}</div>
      </td>
      <td class="p-3.5 font-medium text-slate-700">${s.assignedTeacherName || 'Faculty Assigned'}</td>
      <td class="p-3.5 text-slate-600">
        <div class="font-bold text-slate-800">${s.guardianName || 'N/A'} <span class="text-[10px] text-slate-400 font-normal">(${s.guardianRelation || 'Parent'})</span></div>
        <div class="flex items-center gap-2 mt-0.5">
          ${s.guardianPhone ? `<span class="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5"><i data-lucide="phone" class="w-2.5 h-2.5"></i> ${s.guardianPhone}</span>` : ''}
          ${s.guardianEmail ? `<span class="text-blue-700 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5"><i data-lucide="mail" class="w-2.5 h-2.5"></i> ${s.guardianEmail}</span>` : ''}
        </div>
      </td>
      <td class="p-3.5 font-extrabold text-ada-navy">${(s.gpa || 0).toFixed(2)}</td>
      <td class="p-3.5 text-right space-x-1.5 whitespace-nowrap">
        <!-- WhatsApp Transcript Button -->
        <button onclick="sendStudentTranscriptViaWhatsApp('${s.id}')" title="Send Transcript via WhatsApp to Parent" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[11px] shadow-sm inline-flex items-center gap-1">
          <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">WhatsApp</span>
        </button>
        <!-- Gmail Transcript Button -->
        <button onclick="sendStudentTranscriptViaGmail('${s.id}')" title="Send Transcript via Gmail to Parent" class="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition text-[11px] shadow-sm inline-flex items-center gap-1">
          <i data-lucide="mail" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Gmail</span>
        </button>
        <!-- Print Preview Button -->
        <button onclick="openPrintReportsPreview('${s.id}')" title="View & Print Official Transcript" class="px-2.5 py-1 bg-ada-navy hover:bg-ada-navy-light text-white font-bold rounded-lg transition text-[11px] shadow-sm inline-flex items-center gap-1">
          <i data-lucide="printer" class="w-3.5 h-3.5"></i> <span>Print</span>
        </button>
      </td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function openDirectorStaffModal() {
  if (!currentStaffUser || currentStaffUser.role !== 'DIRECTOR') {
    showToast("Director Space is accessible only to the School Director.", "error");
    return;
  }
  renderDirectorStaffTable();
  document.getElementById('director-staff-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeDirectorStaffModal() {
  document.getElementById('director-staff-modal').classList.add('hidden');
}

function renderDirectorStaffTable() {
  const tbody = document.getElementById('director-staff-tbody');
  if (!tbody) return;

  tbody.innerHTML = (schoolData.staff || []).map(s => `
    <tr class="hover:bg-slate-50 transition text-xs">
      <td class="p-2.5 flex items-center gap-2 font-bold text-slate-900">
        <img src="${s.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}" class="w-6 h-6 rounded-full object-cover">
        <span>${s.name}</span>
      </td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.role === 'DIRECTOR' ? 'bg-amber-100 text-amber-800' : (s.role === 'DEAN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}">${s.role}</span></td>
      <td class="p-2.5 text-slate-600">${s.division}</td>
      <td class="p-2.5 font-mono text-slate-500">${s.email}</td>
    </tr>
  `).join('');
}

async function handleAddStaffMember(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const newStaff = {
    id: `${formData.get('role')}-${Date.now().toString().slice(-4)}`,
    name: formData.get('name').trim(),
    role: formData.get('role'),
    division: formData.get('division'),
    title: formData.get('title') || `${formData.get('role')} of ${formData.get('division')}`,
    email: formData.get('email').trim().toLowerCase(),
    password: formData.get('password').trim(),
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  };

  if (!schoolData.staff) schoolData.staff = [];
  schoolData.staff.unshift(newStaff);
  saveAppDataLocal();

  try {
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff)
    });
  } catch (err) {}

  populateAllDropdowns();
  renderDirectorStaffTable();
  form.reset();
  showToast(`Created login account for ${newStaff.role}: ${newStaff.name}!`, "success");
}

// -------------------------------------------------------------
// 11. REAL-TIME CLOUD SYNC & DATABASE BACKUP / RESTORE
// -------------------------------------------------------------
function exportSchoolDatabaseFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schoolData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `american-dara-academy-database-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Downloaded school database backup file!", "success");
}

function importSchoolDatabaseFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && (imported.schoolInfo || imported.students || imported.courses)) {
        schoolData = imported;
        sanitizeStaffData();
        saveAppDataLocal();
        
        try {
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schoolData)
          });
        } catch (err) {}

        applyBrandingAndLetterhead();
        populateAllDropdowns();
        refreshActiveView();
        showToast("Successfully restored and synchronized school database!", "success");
        confetti({ particleCount: 80, spread: 80 });
      } else {
        showToast("Invalid school database JSON file.", "error");
      }
    } catch (err) {
      showToast("Error parsing database file.", "error");
    }
  };
  reader.readAsText(file);
}

let cloudSyncInterval = null;
function startRealtimeCloudSync() {
  if (cloudSyncInterval) clearInterval(cloudSyncInterval);
  cloudSyncInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const freshData = await res.json();
        const currentCount = (schoolData.students?.length || 0) + (schoolData.gradebook?.length || 0) + (schoolData.courses?.length || 0) + (schoolData.assignments?.length || 0);
        const freshCount = (freshData.students?.length || 0) + (freshData.gradebook?.length || 0) + (freshData.courses?.length || 0) + (freshData.assignments?.length || 0);
        
        if (currentCount !== freshCount || JSON.stringify(freshData.gradebook) !== JSON.stringify(schoolData.gradebook)) {
          schoolData = freshData;
          sanitizeStaffData();
          saveAppDataLocal();
          populateAllDropdowns();
          refreshActiveView();
        }
      }
    } catch (e) {}
  }, 6000);
}

let activePrintStudentId = null;

function openPrintReportsPreview(studentId = '') {
  const student = (schoolData.students || []).find(s => s.id === studentId) || (schoolData.students || [])[0];
  if (!student) {
    showToast("No students enrolled to print reports for.", "error");
    return;
  }

  activePrintStudentId = student.id;
  applyBrandingAndLetterhead();

  const dir = (schoolData.staff || []).find(s => s.role === 'DIRECTOR');
  const sigName = document.getElementById('print-director-signature-name');
  if (sigName && dir) sigName.innerText = dir.name;

  const parentInfoEl = document.getElementById('print-modal-parent-info');
  if (parentInfoEl) {
    parentInfoEl.innerHTML = `<b>Parent:</b> ${student.guardianName || 'N/A'} | <b>WhatsApp:</b> ${student.guardianPhone || 'Not set'} | <b>Gmail:</b> ${student.guardianEmail || 'Not set'}`;
  }

  // Fetch all gradebook records for this student
  const studentGradeRecords = (schoolData.gradebook || []).filter(g => g.studentId === student.id);

  let coursesTableRows = '';
  if (studentGradeRecords.length > 0) {
    coursesTableRows = studentGradeRecords.map(g => {
      const course = schoolData.courses.find(c => c.id === g.classId);
      return `
        <tr>
          <td class="p-2.5 font-bold">${g.className || course?.name || 'Subject'}</td>
          <td class="p-2.5">${course?.category || 'Core Subject'}</td>
          <td class="p-2.5">${course?.teacherName || student.assignedTeacherName || 'Faculty Assigned'}</td>
          <td class="p-2.5 text-center font-bold">${g.currentGradePercentage || 0}%</td>
          <td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded font-bold ${g.letterGrade === 'A' || g.letterGrade === 'A-' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">${g.letterGrade || 'N/A'}</span></td>
        </tr>
      `;
    }).join('');
  } else {
    coursesTableRows = `
      <tr>
        <td class="p-2.5 font-bold">${student.enrolledSubject || 'General Curriculum'}</td>
        <td class="p-2.5">Core Subject</td>
        <td class="p-2.5">${student.assignedTeacherName || 'Faculty Assigned'}</td>
        <td class="p-2.5 text-center font-bold">${student.currentScore || 0}%</td>
        <td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">A</span></td>
      </tr>
    `;
  }

  const container = document.getElementById('print-report-body');
  if (container) {
    container.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div><span class="text-slate-400 font-bold uppercase text-[10px]">Scholar Name</span><div class="font-bold text-slate-900">${student.firstName} ${student.lastName}</div></div>
        <div><span class="text-slate-400 font-bold uppercase text-[10px]">ID / Admission</span><div class="font-mono font-bold">${student.id}</div></div>
        <div><span class="text-slate-400 font-bold uppercase text-[10px]">Division & Grade</span><div class="font-bold">${student.division} (Grade ${student.grade === 0 ? 'K' : student.grade})</div></div>
        <div><span class="text-slate-400 font-bold uppercase text-[10px]">Cumulative GPA</span><div class="font-black text-ada-navy">${(student.gpa || 0).toFixed(2)} / 4.00</div></div>
      </div>

      <div class="space-y-2 pt-2">
        <h3 class="font-bold text-xs uppercase text-ada-navy tracking-wider">Official Academic Record & Subject Marks</h3>
        <table class="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead class="bg-slate-100 text-slate-700 font-bold">
            <tr>
              <th class="p-2.5">Subject / Course</th>
              <th class="p-2.5">Type</th>
              <th class="p-2.5">Teacher</th>
              <th class="p-2.5 text-center">Score</th>
              <th class="p-2.5 text-center">Grade</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${coursesTableRows}
          </tbody>
        </table>
      </div>

      <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
        <div><b>Parent/Guardian:</b> ${student.guardianName || 'N/A'} (${student.guardianRelation || 'Parent'})</div>
        <div><b>WhatsApp:</b> ${student.guardianPhone || 'N/A'} | <b>Gmail:</b> ${student.guardianEmail || 'N/A'}</div>
      </div>
    `;
  }

  document.getElementById('print-reports-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closePrintReportsModal() {
  document.getElementById('print-reports-modal').classList.add('hidden');
}

// -------------------------------------------------------------
// 9. INDIVIDUAL TRANSCRIPT DISPATCH (WHATSAPP & GMAIL)
// -------------------------------------------------------------
function generateStudentTranscriptSummary(student) {
  const studentGradeRecords = (schoolData.gradebook || []).filter(g => g.studentId === student.id);
  let gradeLines = '';
  
  if (studentGradeRecords.length > 0) {
    gradeLines = studentGradeRecords.map(g => `• ${g.className}: ${g.currentGradePercentage}% (Grade ${g.letterGrade})`).join('\n');
  } else {
    gradeLines = `• ${student.enrolledSubject || 'General Curriculum'}: ${student.currentScore || 0}% (Grade A)`;
  }

  return {
    subject: `Official Academic Transcript: ${student.firstName} ${student.lastName} (${student.id}) - American Dara Academy`,
    text: `🦅 *AMERICAN DARA ACADEMY*\n*Official Academic Transcript & Report Card*\n\nDear ${student.guardianName || 'Parent/Guardian'},\n\nHere is the official academic report for *${student.firstName} ${student.lastName}*:\n\n📋 *Student ID:* ${student.id}\n🏫 *Division:* ${student.division} (Grade ${student.grade === 0 ? 'K' : student.grade})\n🎓 *Cumulative GPA:* ${(student.gpa || 0).toFixed(2)} / 4.00\n👨‍🏫 *Assigned Teacher:* ${student.assignedTeacherName || 'Faculty Assigned'}\n\n*Subject Scores:*\n${gradeLines}\n\n🌐 View Live Portal: ${cachedWorldwideUrl}\nOfficial Domain: americandaraacademy.gradelink.com\n\n_Office of Academic Affairs_\n_American Dara Academy, Dakar_`
  };
}

function sendStudentTranscriptViaWhatsApp(studentId) {
  const student = (schoolData.students || []).find(s => s.id === studentId);
  if (!student) {
    showToast("Student not found.", "error");
    return;
  }

  const phone = (student.guardianPhone || '').replace(/[^0-9+]/g, '');
  const summary = generateStudentTranscriptSummary(student);

  let waUrl = '';
  if (phone) {
    const cleanPhone = phone.startsWith('+') ? phone.slice(1) : (phone.length <= 9 ? `221${phone}` : phone);
    waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary.text)}`;
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summary.text)}`;
  }

  window.open(waUrl, '_blank');
  showToast(`Opened WhatsApp transcript for parent of ${student.firstName}!`, "success");
}

function sendStudentTranscriptViaGmail(studentId) {
  const student = (schoolData.students || []).find(s => s.id === studentId);
  if (!student) {
    showToast("Student not found.", "error");
    return;
  }

  const summary = generateStudentTranscriptSummary(student);
  const email = student.guardianEmail || '';

  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(summary.subject)}&body=${encodeURIComponent(summary.text)}`;
  window.location.href = mailtoUrl;
  showToast(`Opened Gmail transcript for parent of ${student.firstName}!`, "success");
}

function sendCurrentTranscriptViaWhatsApp() {
  if (activePrintStudentId) {
    sendStudentTranscriptViaWhatsApp(activePrintStudentId);
  } else {
    showToast("Please select a student to send transcript.", "error");
  }
}

function sendCurrentTranscriptViaGmail() {
  if (activePrintStudentId) {
    sendStudentTranscriptViaGmail(activePrintStudentId);
  } else {
    showToast("Please select a student to send transcript.", "error");
  }
}

// -------------------------------------------------------------
// 10. MASS BROADCAST TO ALL PARENTS AT ONCE (WHATSAPP & GMAIL)
// -------------------------------------------------------------
const BROADCAST_TEMPLATES = {
  report_cards: {
    subject: "American Dara Academy - Academic Transcripts & Term Report Cards Ready",
    message: `Dear American Dara Academy Parents & Guardians,\n\nWe are pleased to inform you that the official academic transcripts and term assessment report cards for your scholars are now published.\n\nYou can access your scholar's marks, assignment scores, and attendance record directly through the academy portal:\n🔗 Portal Link: {{PORTAL_URL}}\nOfficial Domain: americandaraacademy.gradelink.com\n\nShould you have any academic inquiries, please contact the Office of Academic Affairs.\n\nWarm regards,\nSchool Leadership Team\nAmerican Dara Academy`
  },
  conference: {
    subject: "Invitation: Parent-Teacher Academic Conference - American Dara Academy",
    message: `Dear Parents & Guardians,\n\nYou are cordially invited to our upcoming Parent-Teacher Academic Conference to discuss your scholar's academic progress, curriculum engagement, and achievements.\n\n📅 Date: Next Friday\n📍 Location: Main Campus & Virtual Portal ({{PORTAL_URL}})\n\nWe look forward to partnering with you in supporting your child's excellence.\n\nWarm regards,\nOffice of the Director`
  },
  reopening: {
    subject: "Important Notice: School Calendar & Academic Term Schedule",
    message: `Dear American Dara Academy Families,\n\nPlease review our updated academic calendar and class schedule available on the portal at {{PORTAL_URL}}.\n\nThank you for your continued partnership and commitment to student excellence.\n\nAmerican Dara Academy Administration`
  },
  urgent: {
    subject: "URGENT: Important Academy Notice for All Parents",
    message: `Dear American Dara Academy Parents,\n\nPlease take note of this important school announcement regarding academy operations and student activities. Full details are available on the school portal at {{PORTAL_URL}}.\n\nOffice of the School Director`
  },
  custom: {
    subject: "American Dara Academy - Announcement for Parents",
    message: `Dear Parents & Guardians,\n\n[Please type your message here]\n\nPortal: {{PORTAL_URL}}\nAmerican Dara Academy`
  }
};

function openBroadcastParentsModal() {
  renderBroadcastRecipientsPreview();
  applyBroadcastTemplate(document.getElementById('broadcast-template-select')?.value || 'report_cards');
  document.getElementById('broadcast-parents-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeBroadcastParentsModal() {
  document.getElementById('broadcast-parents-modal').classList.add('hidden');
}

function applyBroadcastTemplate(key) {
  const tmpl = BROADCAST_TEMPLATES[key] || BROADCAST_TEMPLATES.custom;
  const subjInput = document.getElementById('broadcast-subject-input');
  const msgInput = document.getElementById('broadcast-message-input');

  const resolvedMsg = tmpl.message.replace(/{{PORTAL_URL}}/g, cachedWorldwideUrl);

  if (subjInput) subjInput.value = tmpl.subject;
  if (msgInput) msgInput.value = resolvedMsg;
}

function getTargetedStudentsForBroadcast() {
  const targetDiv = document.getElementById('broadcast-target-division')?.value || 'all';
  const students = schoolData.students || [];
  if (targetDiv === 'all') return students;
  return students.filter(s => s.division === targetDiv);
}

function renderBroadcastRecipientsPreview() {
  const students = getTargetedStudentsForBroadcast();
  const countBadge = document.getElementById('broadcast-recipient-count');
  if (countBadge) countBadge.innerText = `${students.length} Parent(s) Targeted`;

  const tbody = document.getElementById('broadcast-parents-tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">No students enrolled under this division yet. Add students to populate parent contacts.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50 transition text-xs">
      <td class="p-2.5 font-bold text-slate-900">${s.firstName} ${s.lastName} <span class="text-[10px] text-slate-400 font-mono">(${s.id})</span></td>
      <td class="p-2.5 font-medium text-slate-800">${s.guardianName || 'Parent'}</td>
      <td class="p-2.5 font-mono text-emerald-700 font-bold">${s.guardianPhone || '<span class="text-slate-300 font-normal">None</span>'}</td>
      <td class="p-2.5 font-mono text-blue-700">${s.guardianEmail || '<span class="text-slate-300 font-normal">None</span>'}</td>
      <td class="p-2.5 text-right space-x-1 whitespace-nowrap">
        <button onclick="sendSingleParentWhatsAppBroadcast('${s.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-sm">
          <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
        </button>
      </td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function sendBroadcastViaGmail() {
  const students = getTargetedStudentsForBroadcast();
  const emails = students
    .map(s => (s.guardianEmail || '').trim().toLowerCase())
    .filter(e => e && e.includes('@'));

  const uniqueEmails = [...new Set(emails)];

  const subject = document.getElementById('broadcast-subject-input')?.value || "American Dara Academy - Announcement for Parents";
  const body = document.getElementById('broadcast-message-input')?.value || "";

  if (uniqueEmails.length === 0) {
    const confirmSend = confirm("No parent emails are recorded in the targeted division. Would you like to open Gmail compose anyway?");
    if (!confirmSend) return;
  }

  const bccString = uniqueEmails.join(',');
  const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccString)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoUrl;
  showToast(`Opened Gmail compose with ${uniqueEmails.length} parent email(s) in BCC!`, "success");
  confetti({ particleCount: 60, spread: 70 });
}

function openWhatsAppBroadcastQueue() {
  const students = getTargetedStudentsForBroadcast();
  if (students.length === 0) {
    showToast("No students enrolled under this division.", "error");
    return;
  }

  const message = document.getElementById('broadcast-message-input')?.value || "";
  const firstWithPhone = students.find(s => s.guardianPhone && s.guardianPhone.trim().length > 3);

  if (firstWithPhone) {
    sendSingleParentWhatsAppBroadcast(firstWithPhone.id);
  } else {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  showToast(`Opened WhatsApp broadcast for parents!`, "success");
}

function sendSingleParentWhatsAppBroadcast(studentId) {
  const student = (schoolData.students || []).find(s => s.id === studentId);
  if (!student) return;

  const subject = document.getElementById('broadcast-subject-input')?.value || "American Dara Academy Announcement";
  const message = document.getElementById('broadcast-message-input')?.value || "";

  const personalizedText = `🦅 *AMERICAN DARA ACADEMY*\n*${subject}*\n\nDear ${student.guardianName || 'Parent/Guardian'} (Parent of ${student.firstName} ${student.lastName}):\n\n${message}`;

  const phone = (student.guardianPhone || '').replace(/[^0-9+]/g, '');
  let waUrl = '';

  if (phone) {
    const cleanPhone = phone.startsWith('+') ? phone.slice(1) : (phone.length <= 9 ? `221${phone}` : phone);
    waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedText)}`;
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(personalizedText)}`;
  }

  window.open(waUrl, '_blank');
}


// -------------------------------------------------------------
// 9. DAILY ATTENDANCE
// -------------------------------------------------------------
function renderAttendanceView() {
  loadAttendanceRoster();
}

function loadAttendanceRoster() {
  const classId = document.getElementById('attendance-class-select')?.value;
  const tbody = document.getElementById('attendance-roster-tbody');
  if (!tbody) return;

  if (!classId || !schoolData.courses || schoolData.courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Please add subjects and enroll students to track daily attendance.</td></tr>`;
    return;
  }

  const course = schoolData.courses.find(c => c.id === classId);
  const students = (schoolData.students || []).filter(s => s.division === (course?.division || 'High School'));

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No students enrolled under ${course?.division || 'this division'} yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-50 transition text-xs" data-student-id="${s.id}">
      <td class="p-3.5 flex items-center gap-2.5 font-bold text-slate-900">
        <img src="${s.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}" class="w-6 h-6 rounded-full object-cover">
        <span>${s.firstName} ${s.lastName}</span>
      </td>
      <td class="p-3.5 font-mono text-slate-500">${s.id}</td>
      <td class="p-3.5"><span id="status-pill-${s.id}" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold status-pill-present">Present</span></td>
      <td class="p-3.5 space-x-1">
        <button type="button" onclick="setRowAttendance('${s.id}', 'Present')" class="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded">Present</button>
        <button type="button" onclick="setRowAttendance('${s.id}', 'Late')" class="px-2 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded">Late</button>
        <button type="button" onclick="setRowAttendance('${s.id}', 'Absent')" class="px-2 py-1 bg-red-50 text-red-800 text-[10px] font-bold rounded">Absent</button>
      </td>
      <td class="p-3.5"><input type="text" placeholder="Remarks..." class="w-full text-xs p-1.5 bg-slate-50 border rounded"></td>
    </tr>
  `).join('');
}

function setRowAttendance(studentId, status) {
  const pill = document.getElementById(`status-pill-${studentId}`);
  if (pill) {
    pill.innerText = status;
    pill.className = `px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status === 'Present' ? 'status-pill-present' : (status === 'Late' ? 'status-pill-late' : 'status-pill-absent')}`;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    info: 'bg-ada-navy',
    success: 'bg-emerald-800',
    error: 'bg-red-800'
  };
  toast.className = `${bgColors[type] || 'bg-ada-navy'} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transition-all transform duration-300`;
  toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-amber-400"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

// -------------------------------------------------------------
// 10. WORLDWIDE SHARING & PHONE LOGIN (ANY WI-FI / 4G / 5G)
// -------------------------------------------------------------
let cachedWorldwideUrl = 'https://f6c3aa932723ae.lhr.life';
let cachedLanUrl = 'http://172.20.10.4:3000';

async function fetchPublicPortalUrl() {
  try {
    const res = await fetch('/api/public-url');
    if (res.ok) {
      const data = await res.json();
      if (data.publicUrl) {
        cachedWorldwideUrl = data.publicUrl;
        cachedLanUrl = data.lanUrl || cachedLanUrl;
        updateAllShareElements(cachedWorldwideUrl, cachedLanUrl);
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote tunnel info:", err);
  }
}

function updateAllShareElements(url, lanUrl) {
  const shareInput = document.getElementById('share-portal-url-input');
  if (shareInput) shareInput.value = url;

  const phoneInput = document.getElementById('public-remote-url-input');
  if (phoneInput) phoneInput.value = url;

  const shareQr = document.getElementById('share-qr-code-img');
  if (shareQr) shareQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

  const phoneQr = document.getElementById('remote-qr-code-img');
  if (phoneQr) phoneQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

  const lanDisplay = document.getElementById('share-lan-ip-display');
  if (lanDisplay && lanUrl) lanDisplay.innerText = lanUrl;
}

function openSharePortalModal() {
  fetchPublicPortalUrl();
  document.getElementById('share-portal-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeSharePortalModal() {
  document.getElementById('share-portal-modal').classList.add('hidden');
}

function copySharePortalLink() {
  const input = document.getElementById('share-portal-url-input');
  const urlToCopy = (input && input.value) ? input.value : cachedWorldwideUrl;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(urlToCopy).then(() => {
      showToast("Copied portal link! You can now paste and send to teachers.", "success");
    }).catch(() => {
      showToast("Link: " + urlToCopy, "info");
    });
  } else {
    showToast("Link: " + urlToCopy, "info");
  }
}

function sharePortalViaWhatsApp() {
  const url = cachedWorldwideUrl;
  const message = `🦅 *American Dara Academy - Staff Portal*\n\nDear Faculty & Staff,\nPlease access your gradebook, assignments, and student management portal here:\n🔗 ${url}\n\n_Official Domain: americandaraacademy.gradelink.com_`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function sharePortalViaEmail() {
  const url = cachedWorldwideUrl;
  const subject = "American Dara Academy - Faculty & Staff Portal Login";
  const body = `Dear Faculty & Staff,\n\nPlease find the official login link for the American Dara Academy School Management & GradeLink Portal:\n\nPortal Link: ${url}\nOfficial Domain: americandaraacademy.gradelink.com\n\nYou can log in directly from your laptop, tablet, or smartphone to manage course grades and assignments.\n\nWarm regards,\nOffice of the Director\nAmerican Dara Academy`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

function openRemoteAccessModal() {
  fetchPublicPortalUrl();
  document.getElementById('remote-access-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeRemoteAccessModal() {
  document.getElementById('remote-access-modal').classList.add('hidden');
}

function copyRemoteUrl() {
  copySharePortalLink();
}


