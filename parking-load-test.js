import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000')
  .replace(/\/+$/, '');

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || '';
const CUSTOMER_EMAIL = __ENV.CUSTOMER_EMAIL || 'loadtest@example.com';
const MAX_VUS = Number(__ENV.MAX_VUS || 5);
const DURATION = __ENV.DURATION || '1m';

const ENABLE_WRITE_TESTS =
  (__ENV.ENABLE_WRITE_TESTS || 'false').toLowerCase() === 'true';

const endpointRequests = new Counter('endpoint_requests');
const endpointFailures = new Counter('endpoint_failures');
const endpointLatency = new Trend('endpoint_latency_ms');
const endpointSuccess = new Rate('endpoint_success_rate');

export const options = {
  scenarios: {
    parking_api_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: Math.max(1, Math.ceil(MAX_VUS / 2)) },
        { duration: '15s', target: MAX_VUS },
        { duration: DURATION, target: MAX_VUS },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<3000'],
  },
};

function headers() {
  const h = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (ADMIN_EMAIL) {
    h['x-admin-email'] = ADMIN_EMAIL;
  }

  return h;
}

function recordResponse(response, endpoint) {
  const success = response.status >= 200 && response.status < 400;

  endpointRequests.add(1, { endpoint });
  endpointFailures.add(success ? 0 : 1, { endpoint });
  endpointLatency.add(response.timings.duration, { endpoint });
  endpointSuccess.add(success, { endpoint });

  check(response, {
    [`${endpoint}: HTTP 2xx/3xx`]: r =>
      r.status >= 200 && r.status < 400,
  });
}

function get(path, endpoint) {
  const response = http.get(`${BASE_URL}${path}`, {
    headers: headers(),
    tags: { endpoint, method: 'GET' },
    timeout: '30s',
  });

  recordResponse(response, endpoint);
  return response;
}

function post(path, endpoint, body) {
  const response = http.post(
    `${BASE_URL}${path}`,
    JSON.stringify(body),
    {
      headers: headers(),
      tags: { endpoint, method: 'POST' },
      timeout: '30s',
    }
  );

  recordResponse(response, endpoint);
  return response;
}

const API_ENDPOINTS = [
  { name: 'Health', path: '/', admin: false },
  { name: 'Admin dashboard', path: '/api/admin/dashboard-overview', admin: true },
  { name: 'Admin occupancy', path: '/api/admin/occupancy', admin: false },
  { name: 'Occupancy', path: '/api/occupancy', admin: false },
  { name: 'Parking slots', path: '/api/parking-slots?page=1&limit=10', admin: false },
  { name: 'Parking locations', path: '/api/parking-locations?page=1&limit=10', admin: false },
  { name: 'System settings', path: '/api/system-settings', admin: false },
  { name: 'Admin users', path: '/api/admin/users', admin: true },
  { name: 'Admin vehicles', path: '/api/admin/vehicles', admin: true },
  { name: 'Admin parking records', path: '/api/admin/parking-records', admin: true },
  { name: 'Admin active sessions', path: '/api/admin/active-sessions', admin: true },
  { name: 'Admin audit logs', path: '/api/admin/audit-logs?page=1&limit=10', admin: true },
  { name: 'Audit summary', path: '/api/admin/audit-logs/summary', admin: true },
  { name: 'Admin messages', path: '/api/admin/messages', admin: true },
  { name: 'Reports analytics', path: '/api/admin/reports-analytics?range=today', admin: true },
  { name: 'Staff dashboard', path: '/api/staff/dashboard-overview', admin: false },
  { name: 'Staff vehicle entries', path: '/api/staff/vehicle-entries', admin: false },
  { name: 'Staff active vehicles', path: '/api/staff/active-vehicles', admin: false },
  { name: 'Staff parking records', path: '/api/staff/parking-records', admin: false },
  { name: 'Staff shift report', path: '/api/staff/shift-report', admin: false },
  { name: 'Staff incidents', path: '/api/staff/incidents?page=1&limit=10', admin: false },
  { name: 'Active parking sessions', path: '/api/parking/active-sessions', admin: false },
  { name: 'Payments', path: '/api/payments', admin: false },
  { name: 'Today payments', path: '/api/payments/today', admin: false },
  { name: 'Customer payments', path: '/api/customer/payments', admin: false },
  {
    name: 'Customer parking',
    path: `/api/customer/my-parking?email=${encodeURIComponent(CUSTOMER_EMAIL)}`,
    admin: false,
  },
  {
    name: 'Customer parking history',
    path: `/api/customer/parking-history?email=${encodeURIComponent(CUSTOMER_EMAIL)}`,
    admin: false,
  },
  {
    name: 'Customer vehicles',
    path: `/api/customer/vehicles?email=${encodeURIComponent(CUSTOMER_EMAIL)}`,
    admin: false,
  },
  { name: 'Bookings', path: '/api/bookings', admin: false },
  {
    name: 'Customer reservations',
    path: `/api/customer/reservations?email=${encodeURIComponent(CUSTOMER_EMAIL)}`,
    admin: false,
  },
  { name: 'Pricing plans', path: '/api/pricing-plans?page=1&limit=10', admin: false },
  { name: 'Support tickets', path: '/api/support-tickets?page=1&limit=10', admin: false },
];

export default function () {
  group('Read-only API tests', () => {
    for (const endpoint of API_ENDPOINTS) {
      if (endpoint.admin && !ADMIN_EMAIL) {
        continue;
      }

      get(endpoint.path, endpoint.name);
      sleep(0.1);
    }
  });

  if (ENABLE_WRITE_TESTS) {
    group('Optional write tests', () => {
      const unique = `k6-${__VU}-${__ITER}-${Date.now()}`;

      post('/api/contact', 'Create contact message', {
        name: 'k6 Test',
        email: CUSTOMER_EMAIL,
        subject: unique,
        message: 'Automated k6 test message',
      });

      post('/api/support-tickets', 'Create support ticket', {
        customer_name: 'k6 Test',
        customer_email: CUSTOMER_EMAIL,
        subject: unique,
        category: 'General Query',
        description: 'Automated k6 test ticket',
        priority: 'Normal',
      });

      post('/api/parking/calculate-fee', 'Calculate parking fee', {
        vehicle_type: 'Car',
        duration_hours: 1,
      });
    });
  }

  sleep(0.3);
}

export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify({
      totalRequests: data.metrics.http_reqs?.values?.count,
      failedRequestRate: data.metrics.http_req_failed?.values?.rate,
      averageResponseMs: data.metrics.http_req_duration?.values?.avg,
      p95ResponseMs: data.metrics.http_req_duration?.values?.['p(95)'],
      endpointSuccessRate: data.metrics.endpoint_success_rate?.values?.rate,
    }, null, 2),
  };
}
