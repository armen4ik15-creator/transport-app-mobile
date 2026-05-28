/**
 * Full API smoke test — production/staging.
 * Run: node smoke-test.js
 */
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL =
  process.env.SMOKE_BASE_URL ||
  'https://armen4ik15-creator-transport-app-server-43b9.twc1.net/api';

const RUN_ID = Date.now();
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || 'admin123';
const DRIVER_EMAIL = `smoke_driver_${RUN_ID}@test.local`;
const DRIVER_PASSWORD = 'test123456';

const MIN_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  'base64'
);

const state = {
  adminToken: null,
  driverToken: null,
  driverUserId: null,
  driverId: null,
  materialId: null,
  vehicleId: null,
  contractorId: null,
  orderId: null,
  templateId: null,
};

/** @type {Record<string, boolean>} */
const availability = {};

const failures = [];
const skipped = [];
let stepNo = 0;

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function probeEndpoint(method, path, token) {
  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${path}`,
      headers: authHeaders(token),
      validateStatus: () => true,
      timeout: 15000,
    });
    availability[path] =
      res.status >= 200 &&
      res.status < 500 &&
      res.status !== 404 &&
      !String(res.data).includes('Cannot GET') &&
      !String(res.data).includes('Cannot PUT');
    return availability[path];
  } catch {
    availability[path] = false;
    return false;
  }
}

async function step(name, fn, { optional = false, endpoint = null } = {}) {
  stepNo += 1;
  const label = `[${stepNo}] ${name}`;
  if (endpoint && availability[endpoint] === false) {
    skipped.push(label);
    console.log(`⏭️  ${label} (endpoint unavailable: ${endpoint})`);
    return;
  }
  try {
    await fn();
    console.log(`✅ ${label}`);
  } catch (error) {
    const message = formatError(error);
    if (optional) {
      skipped.push(`${label}: ${message}`);
      console.log(`⚠️  ${label} (optional): ${message}`);
      return;
    }
    console.error(`❌ ${label}: ${message}`);
    failures.push({ step: label, message });
    throw error;
  }
}

function formatError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const detail =
      typeof body === 'object' && body !== null
        ? body.error || JSON.stringify(body)
        : String(body || error.message).slice(0, 200);
    return status ? `HTTP ${status}: ${detail}` : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

function expectStatus(res, expected) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(res.status)) {
    throw new Error(`Expected ${allowed.join('|')}, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`);
  }
}

function expectField(obj, field) {
  if (obj == null || obj[field] == null) {
    throw new Error(`Missing field "${field}" in ${JSON.stringify(obj)}`);
  }
}

async function login(email, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  expectStatus(res, 200);
  expectField(res.data, 'token');
  return res.data;
}

async function resolveDriverId() {
  const meRes = await axios.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders(state.driverToken),
  });
  expectStatus(meRes, 200);
  if (meRes.data?.driver?.id) return meRes.data.driver.id;

  const driversRes = await axios.get(`${BASE_URL}/drivers`, {
    headers: authHeaders(state.driverToken),
  });
  expectStatus(driversRes, 200);
  if (Array.isArray(driversRes.data) && driversRes.data[0]?.id) {
    return driversRes.data[0].id;
  }
  throw new Error('Driver id not found after registration');
}

async function run() {
  console.log(`Smoke test → ${BASE_URL}\n`);

  await step('GET /health', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    expectStatus(res, 200);
    if (res.data?.status !== 'ok') throw new Error('health status is not ok');
  });

  await step('Login admin', async () => {
    try {
      const data = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      state.adminToken = data.token;
    } catch {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        full_name: 'Smoke Admin',
      });
      expectStatus(res, 201);
      state.adminToken = res.data.token;
    }
  });

  console.log('\nProbing endpoint availability...');
  const probePaths = [
    ['GET', '/drivers'],
    ['GET', '/contractors'],
    ['GET', '/materials'],
    ['GET', '/vehicles'],
    ['GET', '/order-templates'],
    ['GET', '/orders'],
    ['GET', '/finances'],
    ['GET', '/documents'],
    ['GET', '/waybills'],
    ['GET', '/invoices'],
    ['GET', '/notifications'],
    ['GET', '/activity'],
    ['GET', '/reports/summary'],
    ['GET', '/expenses'],
    ['GET', '/trips'],
    ['GET', '/salary/payments'],
    ['GET', '/earnings/summary'],
    ['GET', '/contractors/summary'],
    ['PUT', '/drivers/profile/me'],
  ];
  for (const [method, path] of probePaths) {
    const ok = await probeEndpoint(method, path, state.adminToken);
    console.log(`  ${method} ${path} → ${ok ? 'OK' : 'MISSING/BROKEN'}`);
  }
  console.log('');

  await step('Register driver', async () => {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: DRIVER_EMAIL,
      password: DRIVER_PASSWORD,
      role: 'driver',
      full_name: 'Smoke Driver',
      phone: '+79990001122',
    });
    expectStatus(res, 201);
    state.driverToken = res.data.token;
    state.driverUserId = res.data.user.id;
  });

  await step('Login driver', async () => {
    const data = await login(DRIVER_EMAIL, DRIVER_PASSWORD);
    state.driverToken = data.token;
    state.driverUserId = data.user.id;
  });

  await step('Driver profile / car_number', async () => {
    state.driverId = await resolveDriverId();
    const carNumber = `A${RUN_ID}`.slice(0, 9);

    if (availability['/drivers/profile/me']) {
      const res = await axios.put(
        `${BASE_URL}/drivers/profile/me`,
        { full_name: 'Smoke Driver', car_number: carNumber, phone: '+79990001122' },
        { headers: authHeaders(state.driverToken) }
      );
      expectStatus(res, 200);
      return;
    }

    const res = await axios.put(
      `${BASE_URL}/drivers/${state.driverId}`,
      { full_name: 'Smoke Driver', car_number: carNumber, phone: '+79990001122' },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 200);
  });

  await step('POST /materials', async () => {
    const res = await axios.post(
      `${BASE_URL}/materials`,
      { name: `Sand ${RUN_ID}`, unit: 'т', price_per_ton: 1200 },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    state.materialId = res.data.id;
  }, { endpoint: '/materials' });

  await step('POST /vehicles', async () => {
    const res = await axios.post(
      `${BASE_URL}/vehicles`,
      { plate_number: `SMK${RUN_ID}`.slice(0, 12), model: 'KAMAZ', is_active: true },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    state.vehicleId = res.data.id;
  }, { endpoint: '/vehicles' });

  await step('POST /contractors', async () => {
    const res = await axios.post(
      `${BASE_URL}/contractors`,
      { name: `Contractor ${RUN_ID}`, type: 'company', phone: '+74951234567' },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    state.contractorId = res.data.id;
  });

  await step('GET reference lists (drivers, contractors)', async () => {
    const headers = { headers: authHeaders(state.adminToken) };
    const [drivers, contractors] = await Promise.all([
      axios.get(`${BASE_URL}/drivers`, headers),
      axios.get(`${BASE_URL}/contractors`, headers),
    ]);
    expectStatus(drivers, 200);
    expectStatus(contractors, 200);
    if (!drivers.data.some((d) => d.id === state.driverId)) {
      throw new Error('Created driver not in list');
    }
    if (!contractors.data.some((c) => c.id === state.contractorId)) {
      throw new Error('Created contractor not in list');
    }
  });

  await step('POST /orders', async () => {
    const res = await axios.post(
      `${BASE_URL}/orders`,
      {
        driver_id: state.driverId,
        contractor_id: state.contractorId,
        task_name: 'Smoke delivery',
        material: 'Sand',
        quantity: 10,
        unit: 'т',
        notes: 'Smoke test order',
        driver_rate: 500,
        company_rate: 800,
        is_active: 1,
      },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    state.orderId = res.data.id;
  });

  await step('GET /orders contains created order', async () => {
    const res = await axios.get(`${BASE_URL}/orders`, {
      headers: authHeaders(state.adminToken),
    });
    expectStatus(res, 200);
    if (!res.data.some((o) => o.id === state.orderId)) {
      throw new Error('Order not found in list');
    }
  });

  await step('PUT /orders/:id', async () => {
    const res = await axios.put(
      `${BASE_URL}/orders/${state.orderId}`,
      { notes: `Updated ${RUN_ID}`, quantity: 12 },
      { headers: authHeaders(state.adminToken), validateStatus: () => true }
    );
    if (res.status === 404) throw new Error('PUT /orders/:id not deployed on server');
    expectStatus(res, 200);
  }, { optional: true });

  await step('POST /orders/bulk', async () => {
    const res = await axios.post(
      `${BASE_URL}/orders/bulk`,
      {
        driver_ids: [state.driverId],
        contractor_id: state.contractorId,
        material: 'Bulk sand',
        quantity: 5,
        unit: 'т',
      },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error('Bulk orders empty');
    }
  }, { optional: true });

  await step('POST /order-templates/from-order', async () => {
    const res = await axios.post(
      `${BASE_URL}/order-templates/from-order`,
      { order_id: state.orderId, name: `Template ${RUN_ID}` },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
    state.templateId = res.data.id;
  }, { endpoint: '/order-templates' });

  await step('POST /trips', async () => {
    const form = new FormData();
    form.append('order_id', String(state.orderId));
    form.append('stage', 'loading');
    form.append('ttn_number', `TTN-${RUN_ID}`);
    form.append('volume', '10');
    form.append('photo', MIN_JPEG, { filename: 'trip.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${BASE_URL}/trips`, form, {
      headers: { ...form.getHeaders(), ...authHeaders(state.adminToken) },
    });
    expectStatus(res, 201);
  }, { optional: true });

  await step('POST /expenses', async () => {
    const res = await axios.post(
      `${BASE_URL}/expenses`,
      {
        exp_type: 'fuel',
        method: 'cash',
        amount: 1500,
        comment: 'Smoke expense',
        driver_id: state.driverId,
      },
      { headers: authHeaders(state.adminToken), validateStatus: () => true }
    );
    if (res.status === 500) throw new Error(res.data?.error || 'Server error');
    expectStatus(res, 201);
  });

  await step('POST /salary/payments', async () => {
    const res = await axios.post(
      `${BASE_URL}/salary/payments`,
      { driver_id: state.driverId, type: 'salary', amount: 10000, note: 'Smoke salary' },
      { headers: authHeaders(state.adminToken), validateStatus: () => true }
    );
    if (res.status === 500) throw new Error(res.data?.error || 'Server error');
    expectStatus(res, 201);
  });

  await step('GET /drivers/:id/balance', async () => {
    const res = await axios.get(`${BASE_URL}/drivers/${state.driverId}/balance`, {
      headers: authHeaders(state.adminToken),
      validateStatus: () => true,
    });
    if (res.status === 404) {
      availability['/drivers/:id/balance'] = false;
      throw new Error('Endpoint missing');
    }
    expectStatus(res, 200);
    expectField(res.data, 'balance');
  }, { optional: true });

  await step('POST /waybills', async () => {
    const form = new FormData();
    form.append('order_id', String(state.orderId));
    form.append('number', `WB-${RUN_ID}`);
    form.append('date', new Date().toISOString().slice(0, 10));
    form.append('file', MIN_JPEG, { filename: 'waybill.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${BASE_URL}/waybills`, form, {
      headers: { ...form.getHeaders(), ...authHeaders(state.adminToken) },
    });
    expectStatus(res, 201);
  }, { endpoint: '/waybills' });

  await step('POST /invoices', async () => {
    const form = new FormData();
    form.append('order_id', String(state.orderId));
    form.append('number', `INV-${RUN_ID}`);
    form.append('amount', '25000');
    form.append('file', MIN_JPEG, { filename: 'invoice.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${BASE_URL}/invoices`, form, {
      headers: { ...form.getHeaders(), ...authHeaders(state.adminToken) },
    });
    expectStatus(res, 201);
  }, { endpoint: '/invoices' });

  await step('POST /notifications', async () => {
    const res = await axios.post(
      `${BASE_URL}/notifications`,
      { user_id: state.driverUserId, message: `Smoke notification ${RUN_ID}` },
      { headers: authHeaders(state.adminToken) }
    );
    expectStatus(res, 201);
  }, { endpoint: '/notifications' });

  await step('GET /activity', async () => {
    const res = await axios.get(`${BASE_URL}/activity`, {
      headers: authHeaders(state.adminToken),
    });
    expectStatus(res, 200);
    if (!Array.isArray(res.data)) throw new Error('Activity must be array');
  }, { endpoint: '/activity' });

  await step('GET /reports/summary', async () => {
    const res = await axios.get(`${BASE_URL}/reports/summary`, {
      headers: authHeaders(state.adminToken),
    });
    expectStatus(res, 200);
    expectField(res.data, 'orders_total');
  });

  await step('GET /finances', async () => {
    const res = await axios.get(`${BASE_URL}/finances`, {
      headers: authHeaders(state.adminToken),
      validateStatus: () => true,
    });
    if (res.status === 500) {
      throw new Error(res.data?.error || 'Server error');
    }
    expectStatus(res, 200);
  });

  await step('Driver GET /orders (own only)', async () => {
    const res = await axios.get(`${BASE_URL}/orders`, {
      headers: authHeaders(state.driverToken),
    });
    expectStatus(res, 200);
    if (res.data.some((o) => o.driver_id !== state.driverId)) {
      throw new Error('Driver sees foreign orders');
    }
    if (!res.data.some((o) => o.id === state.orderId)) {
      throw new Error('Driver does not see assigned order');
    }
  });

  await step('Driver PUT /orders/:id/status', async () => {
    const res = await axios.put(
      `${BASE_URL}/orders/${state.orderId}/status`,
      { status: 'in_progress' },
      { headers: authHeaders(state.driverToken) }
    );
    expectStatus(res, 200);
    if (res.data.status !== 'in_progress') throw new Error('Status not updated');
  });

  await step('Driver POST /orders/:id/photos', async () => {
    const form = new FormData();
    form.append('photo', MIN_JPEG, { filename: 'order.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${BASE_URL}/orders/${state.orderId}/photos`, form, {
      headers: { ...form.getHeaders(), ...authHeaders(state.driverToken) },
    });
    expectStatus(res, 201);
  }, { optional: true });

  await step('Driver GET /finances', async () => {
    const res = await axios.get(`${BASE_URL}/finances`, {
      headers: authHeaders(state.driverToken),
      validateStatus: () => true,
    });
    if (res.status === 500) throw new Error(res.data?.error || 'Server error');
    expectStatus(res, 200);
  });

  await step('Driver POST /orders forbidden', async () => {
    const res = await axios.post(
      `${BASE_URL}/orders`,
      { driver_id: state.driverId, contractor_id: state.contractorId },
      { headers: authHeaders(state.driverToken), validateStatus: () => true }
    );
    if (![401, 403].includes(res.status)) {
      throw new Error(`Expected 401|403, got ${res.status}`);
    }
  });

  await step('Driver cannot access admin salary', async () => {
    const res = await axios.get(`${BASE_URL}/salary/payments`, {
      headers: authHeaders(state.driverToken),
      validateStatus: () => true,
    });
    if (![401, 403, 404].includes(res.status)) {
      throw new Error(`Expected 401|403|404, got ${res.status}`);
    }
  });

  console.log('\n--- SUMMARY ---');
  const missing = Object.entries(availability)
    .filter(([, ok]) => !ok)
    .map(([path]) => path);
  if (missing.length > 0) {
    console.log('Missing/broken on server:', missing.join(', '));
  }
  if (skipped.length > 0) {
    console.log(`Skipped/optional: ${skipped.length} step(s)`);
  }

  if (failures.length === 0 && missing.length === 0 && skipped.length === 0) {
    console.log('\nALL SMOKE TESTS PASSED');
    return;
  }

  if (failures.length === 0 && missing.length > 0) {
    console.error('\nServer endpoints missing or broken — redeploy required.');
    process.exit(1);
  }
}

run().catch(() => {
  console.error('\nSMOKE TEST FAILED');
  if (failures.length > 0) {
    console.error('\nFailed steps:');
    failures.forEach((f) => console.error(` - ${f.step}: ${f.message}`));
  }
  process.exit(1);
});
