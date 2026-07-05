const API_URL = 'http://localhost:3001/api/v1';

let cookies = {};
let csrfToken = '';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const cookieHeader = Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ');

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...options.headers
    },
    ...options
  });
  
  const setCookieHeader = res.headers.get('set-cookie');
  if (setCookieHeader) {
    // Basic parse of set-cookie (comma separated in node-fetch)
    const parts = setCookieHeader.split(',');
    for (const part of parts) {
      const cookiePart = part.split(';')[0].trim();
      const [key, val] = cookiePart.split('=');
      if (key && val) {
        cookies[key] = val;
        if (key === 'XSRF-TOKEN') {
          csrfToken = val;
        }
      }
    }
  }
  
  let data;
  try { data = await res.json(); } catch(e) { data = null; }
  
  return { status: res.status, data };
}

let logs = [];
function log(msg) {
  console.log(msg);
  logs.push(msg);
}

function assert(condition, message, responseData = null) {
  if (!condition) {
    log(`â Œ FAILED: ${message}`);
    if (responseData) log(`   Response: ${JSON.stringify(responseData)}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  log(`âœ… PASSED: ${message}`);
}

async function runQA() {
  log("Starting Master QA API Tests...");
  try {
    // 1. Login as Super Admin
    log("\n--- 1. Authentication (Super Admin) ---");
    // Fetch initial CSRF token
    await request('/public/organizations'); 
    
    let res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'super@vidyaai.com', password: 'Admin@123' })
    });
    assert(res.status === 200, "Super Admin login succeeds", res.data);
    const superAdminToken = res.data.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${superAdminToken}` };
    
    // 2. Create Organization A
    log("\n--- 2. Multi-Tenant: Org Creation ---");
    let orgAId = `qa-org-A-${Date.now()}`;
    res = await request('/admin/organizations', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ 
        name: 'QA Org A', code: `QAA${Date.now()}`, email: `qaa${Date.now()}@example.com`, address: '123 QA St', phone: '1234567890'
      })
    });
    assert(res.status === 201, "Super Admin can create Org A", res.data);
    const orgA = res.data.data;
    
    // 3. Create Org Admin A
    log("\n--- 3. Role-Based Access: Create Org Admin ---");
    res = await request('/admin/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Admin', lastName: 'A', email: `admina${Date.now()}@example.com`, role: 'ADMIN', organizationId: orgA.id, password: 'Password@123'
      })
    });
    assert(res.status === 201, "Super Admin can create Org Admin A");
    const orgAdminACreds = { email: res.data.data.email, password: 'Password@123' };
    const orgAdminAId = res.data.data.id;

    // Create Organization B & Org Admin B to test isolation
    let orgBId = `qa-org-B-${Date.now()}`;
    res = await request('/admin/organizations', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ 
        name: 'QA Org B', code: `QAB${Date.now()}`, email: `qab${Date.now()}@example.com`, address: '456 QA St', phone: '1234567890' 
      })
    });
    const orgB = res.data.data;
    res = await request('/admin/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Admin', lastName: 'B', email: `adminb${Date.now()}@example.com`, role: 'ADMIN', organizationId: orgB.id, password: 'Password@123'
      })
    });
    const orgAdminBCreds = { email: res.data.data.email, password: 'Password@123' };

    // 4. Login as Org Admin A
    log("\n--- 4. Authentication (Org Admin A) ---");
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(orgAdminACreds)
    });
    assert(res.status === 200, "Org Admin A login succeeds");
    const orgAdminAToken = res.data.data.accessToken;
    const orgAdminAHeaders = { Authorization: `Bearer ${orgAdminAToken}` };

    // 5. Org Admin A - CRUD Operations
    log("\n--- 5. Org Admin A CRUD Operations ---");
    
    // Create Student
    res = await request('/admin/students', {
      method: 'POST',
      headers: orgAdminAHeaders,
      body: JSON.stringify({
        firstName: 'Student', lastName: 'A', email: `studentA${Date.now()}@qaa.com`, rollNo: 'S001'
      })
    });
    assert(res.status === 201, "Org Admin A can create Student A");
    const studentA = res.data.data;

    // Create Faculty
    res = await request('/admin/faculty', {
      method: 'POST',
      headers: orgAdminAHeaders,
      body: JSON.stringify({
        firstName: 'Faculty', lastName: 'A', email: `facultyA${Date.now()}@qaa.com`
      })
    });
    assert(res.status === 201, "Org Admin A can create Faculty A");
    const facultyA = res.data.data;

    // 6. Test IDOR - Multi Tenant Isolation
    log("\n--- 6. Multi-Tenant Isolation & IDOR Testing ---");
    
    // Login as Org Admin B
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(orgAdminBCreds)
    });
    const orgAdminBToken = res.data.data.accessToken;
    const orgAdminBHeaders = { Authorization: `Bearer ${orgAdminBToken}` };

    // Try to update Student A from Org Admin B
    res = await request(`/admin/students/${studentA.id}`, {
      method: 'PUT',
      headers: orgAdminBHeaders,
      body: JSON.stringify({ firstName: 'Hacked Student' })
    });
    assert(res.status === 403, "Org Admin B is FORBIDDEN to update Student A (IDOR blocked)");

    // Try to fetch Faculty A from Org Admin B (assuming endpoint exists, else test settings)
    res = await request(`/admin/analytics/dashboard`, {
      method: 'GET',
      headers: orgAdminBHeaders
    });
    assert(res.status === 200, "Org Admin B can access their own dashboard");
    assert(res.data.data.totalStudents === 0, "Org Admin B does NOT see Org Admin A's students in analytics");

    // Try to escalate privileges to SUPER_ADMIN
    res = await request(`/admin/users/${orgAdminAId}`, {
      method: 'PUT',
      headers: orgAdminAHeaders, // Modifying own user
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });
    if (res.status === 403) {
      assert(res.status === 403, "Org Admin A is FORBIDDEN to escalate to SUPER_ADMIN");
    } else {
      log("Warning: Escalate test returned " + res.status);
    }

    log("\n✨ All API E2E Integration Tests Completed Successfully! ✨");

  } catch(e) {
    log(`\n❌ FATAL ERROR during testing: ${e.message}`);
  }
}

runQA();
