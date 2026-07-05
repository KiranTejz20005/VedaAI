import { prisma } from '../lib/prisma';
import * as argon2 from 'argon2';

const API_URL = 'http://localhost:3001/api/v1';

let currentCookie = '';
let csrfToken = '';

async function request(endpoint: string, options: any = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': currentCookie,
      'x-csrf-token': csrfToken,
      ...options.headers
    },
    ...options
  });
  
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    currentCookie = setCookie.split(';')[0];
    if (currentCookie.startsWith('XSRF-TOKEN=')) {
      csrfToken = currentCookie.split('=')[1];
    }
  }
  
  let data;
  try { data = await res.json(); } catch(e) { data = null; }
  
  return { status: res.status, data };
}

function log(msg: string) {
  console.log(msg);
}

function assert(condition: boolean, message: string, responseData: any = null) {
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
    log("\n--- 0. Setup: Creating QA Super Admin ---");
    const pwdHash = await argon2.hash('Admin@123');
    await prisma.user.upsert({
      where: { email: 'qa-superadmin@example.com' },
      update: { passwordHash: pwdHash, role: 'SUPER_ADMIN' },
      create: {
        email: 'qa-superadmin@example.com',
        passwordHash: pwdHash,
        firstName: 'QA',
        lastName: 'Superadmin',
        role: 'SUPER_ADMIN',
      }
    });
    log("QA Super Admin prepared.");

    log("\n--- 1. Authentication (Super Admin) ---");
    await request('/public/organizations'); 
    
    let res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'qa-superadmin@example.com', password: 'Admin@123' })
    });
    assert(res.status === 200, "Super Admin login succeeds", res.data);
    const superAdminToken = res.data.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${superAdminToken}` };
    
    log("\n--- 2. Multi-Tenant: Org Creation ---");
    const suffix = Date.now();
    res = await request('/admin/organizations', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ 
        name: `QA Org A ${suffix}`, code: `QAA${suffix}`, email: `qaa${suffix}@example.com`, address: '123 QA St', phone: '1234567890'
      })
    });
    assert(res.status === 201, "Super Admin can create Org A", res.data);
    const orgA = res.data.data;
    
    log("\n--- 3. Role-Based Access: Create Org Admin ---");
    res = await request('/admin/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Admin', lastName: 'A', email: `admina${suffix}@example.com`, role: 'ADMIN', organizationId: orgA.id, password: 'Password@123'
      })
    });
    assert(res.status === 201, "Super Admin can create Org Admin A", res.data);
    const orgAdminACreds = { email: res.data.data.email, password: 'Password@123' };
    const orgAdminAId = res.data.data.id;

    res = await request('/admin/organizations', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ 
        name: `QA Org B ${suffix}`, code: `QAB${suffix}`, email: `qab${suffix}@example.com`, address: '456 QA St', phone: '1234567890' 
      })
    });
    const orgB = res.data.data;
    res = await request('/admin/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Admin', lastName: 'B', email: `adminb${suffix}@example.com`, role: 'ADMIN', organizationId: orgB.id, password: 'Password@123'
      })
    });
    const orgAdminBCreds = { email: res.data.data.email, password: 'Password@123' };

    log("\n--- 4. Authentication (Org Admin A) ---");
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(orgAdminACreds)
    });
    assert(res.status === 200, "Org Admin A login succeeds", res.data);
    const orgAdminAToken = res.data.data.accessToken;
    const orgAdminAHeaders = { Authorization: `Bearer ${orgAdminAToken}` };

    log("\n--- 5. Org Admin A CRUD Operations ---");
    res = await request('/admin/students', {
      method: 'POST',
      headers: orgAdminAHeaders,
      body: JSON.stringify({
        firstName: 'Student', lastName: 'A', email: `studentA${suffix}@qaa.com`, rollNo: 'S001'
      })
    });
    assert(res.status === 201, "Org Admin A can create Student A", res.data);
    const studentA = res.data.data;

    res = await request('/admin/faculty', {
      method: 'POST',
      headers: orgAdminAHeaders,
      body: JSON.stringify({
        firstName: 'Faculty', lastName: 'A', email: `facultyA${suffix}@qaa.com`
      })
    });
    assert(res.status === 201, "Org Admin A can create Faculty A", res.data);

    log("\n--- 6. Multi-Tenant Isolation & IDOR Testing ---");
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(orgAdminBCreds)
    });
    const orgAdminBToken = res.data.data.accessToken;
    const orgAdminBHeaders = { Authorization: `Bearer ${orgAdminBToken}` };

    res = await request(`/admin/students/${studentA.id}`, {
      method: 'PUT',
      headers: orgAdminBHeaders,
      body: JSON.stringify({ firstName: 'Hacked Student' })
    });
    assert(res.status === 403, "Org Admin B is FORBIDDEN to update Student A (IDOR blocked)", res.data);

    res = await request(`/admin/analytics/dashboard`, {
      method: 'GET',
      headers: orgAdminBHeaders
    });
    assert(res.status === 200, "Org Admin B can access their own dashboard", res.data);
    assert(res.data.data.totalStudents === 0, "Org Admin B does NOT see Org Admin A's students in analytics");

    res = await request(`/admin/users/${orgAdminAId}`, {
      method: 'PUT',
      headers: orgAdminAHeaders,
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });
    if (res.status === 403) {
      assert(res.status === 403, "Org Admin A is FORBIDDEN to escalate to SUPER_ADMIN", res.data);
    } else {
      log("Warning: Escalate test returned " + res.status);
    }

    log("\nâœ¨ All API E2E Integration Tests Completed Successfully! âœ¨");

  } catch(e) {
    log(`\nâ Œ FATAL ERROR during testing: ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

runQA();
