import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (
  __ENV.BASE_URL || 'https://parking-management-backend-6enx.onrender.com'
).replace(/\/+$/, '');

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@shnoor.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin';
const FIREBASE_API_KEY =
  __ENV.FIREBASE_API_KEY || 'AIzaSyBGwP4YbEnK3QXceJfYxhmYaz-JtFyat4Y';
const CUSTOMER_EMAIL = __ENV.CUSTOMER_EMAIL || 'customer@shnoor.com';

const ENABLE_WRITE_TESTS =
  (__ENV.ENABLE_WRITE_TESTS || 'false').toLowerCase() === 'true';
const PUBLIC_ONLY = (__ENV.PUBLIC_ONLY || 'false').toLowerCase() === 'true';
const DEBUG_MODE =
  (__ENV.DEBUG || __ENV.DEBUG_MODE || 'false').toLowerCase() === 'true';
const THINK_TIME = parseFloat(__ENV.THINK_TIME || '0.2');

function resolveStageProfile() {
  const stage = String(__ENV.STAGE || 'baseline').trim().toLowerCase();

  switch (stage) {
    case 'baseline':
    case 'smoke':
    case '0':
    case '5':
      return {
        name: 'Baseline Test (5 VUs, 1 min)',
        targetVUs: 5,
        durationDesc: '1 minute (10s ramp-up -> 40s steady -> 10s ramp-down)',
        stages: [
          { duration: '10s', target: 5 },
          { duration: '40s', target: 5 },
          { duration: '10s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.01'],
          http_req_duration: ['p(95)<1500'],
          endpoint_success_rate: ['rate>0.99'],
        },
      };

    case '1':
    case '25':
      return {
        name: 'Stage 1: Light Load (25 VUs, 2 min)',
        targetVUs: 25,
        durationDesc: '2 minutes (20s ramp-up -> 80s steady -> 20s ramp-down)',
        stages: [
          { duration: '20s', target: 25 },
          { duration: '80s', target: 25 },
          { duration: '20s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.02'],
          http_req_duration: ['p(95)<2000'],
          endpoint_success_rate: ['rate>0.98'],
        },
      };

    case '2':
    case '50':
      return {
        name: 'Stage 2: Medium Load (50 VUs, 3 min)',
        targetVUs: 50,
        durationDesc: '3 minutes (30s ramp-up -> 120s steady -> 30s ramp-down)',
        stages: [
          { duration: '30s', target: 50 },
          { duration: '120s', target: 50 },
          { duration: '30s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.03'],
          http_req_duration: ['p(95)<2500'],
          endpoint_success_rate: ['rate>0.97'],
        },
      };

    case '3':
    case '100':
      return {
        name: 'Stage 3: High Load (100 VUs, 3 min)',
        targetVUs: 100,
        durationDesc: '3 minutes (30s ramp-up -> 120s steady -> 30s ramp-down)',
        stages: [
          { duration: '30s', target: 100 },
          { duration: '120s', target: 100 },
          { duration: '30s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.05'],
          http_req_duration: ['p(95)<3000'],
          endpoint_success_rate: ['rate>0.95'],
        },
      };

    case '4':
    case '150':
      return {
        name: 'Stage 4: Elevated Stress (150 VUs, 3 min)',
        targetVUs: 150,
        durationDesc: '3 minutes (30s ramp-up -> 120s steady -> 30s ramp-down)',
        stages: [
          { duration: '30s', target: 150 },
          { duration: '120s', target: 150 },
          { duration: '30s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.08'],
          http_req_duration: ['p(95)<3500'],
          endpoint_success_rate: ['rate>0.92'],
        },
      };

    case '5':
    case '200':
      return {
        name: 'Stage 5: Heavy Peak Load (200 VUs, 5 min)',
        targetVUs: 200,
        durationDesc: '5 minutes (45s ramp-up -> 210s steady -> 45s ramp-down)',
        stages: [
          { duration: '45s', target: 200 },
          { duration: '210s', target: 200 },
          { duration: '45s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.08'],
          http_req_duration: ['p(95)<4000'],
          endpoint_success_rate: ['rate>0.92'],
        },
      };

    case '6':
    case '250':
      return {
        name: 'Stage 6: Near-Limit Stress (250 VUs, 5 min)',
        targetVUs: 250,
        durationDesc: '5 minutes (45s ramp-up -> 210s steady -> 45s ramp-down)',
        stages: [
          { duration: '45s', target: 250 },
          { duration: '210s', target: 250 },
          { duration: '45s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.10'],
          http_req_duration: ['p(95)<4500'],
          endpoint_success_rate: ['rate>0.90'],
        },
      };

    case 'final':
    case '7':
    case '300': {
      const allow300 = (__ENV.ALLOW_300_VUS || 'false').toLowerCase() === 'true';
      if (!allow300) {
        throw new Error(
          '[SAFETY GUARD] 300 VUs Final Test requires prior confirmation of lower stages. Run with -e ALLOW_300_VUS=true once verified.'
        );
      }
      return {
        name: 'Final Stage: Target Concurrency (300 VUs, 5 min)',
        targetVUs: 300,
        durationDesc: '5 minutes (60s ramp-up -> 180s steady -> 60s ramp-down)',
        stages: [
          { duration: '60s', target: 300 },
          { duration: '180s', target: 300 },
          { duration: '60s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.10'],
          http_req_duration: ['p(95)<4500'],
          endpoint_success_rate: ['rate>0.90'],
        },
      };
    }

    default: {
      const customVUs = Number(__ENV.MAX_VUS || 5);
      const customDur = __ENV.DURATION || '1m';
      return {
        name: `Custom Stage (${customVUs} VUs, ${customDur})`,
        targetVUs: customVUs,
        durationDesc: `${customDur} steady state`,
        stages: [
          { duration: '10s', target: customVUs },
          { duration: customDur, target: customVUs },
          { duration: '10s', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.05'],
          http_req_duration: ['p(95)<3000'],
          endpoint_success_rate: ['rate>0.95'],
        },
      };
    }
  }
}

const currentStage = resolveStageProfile();

export const options = {
  scenarios: {
    parking_api_staged_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: currentStage.stages,
      gracefulRampDown: '10s',
    },
  },
  thresholds: currentStage.thresholds,
};

const endpointRequests = new Counter('endpoint_requests');
const endpointFailures = new Counter('endpoint_failures');
const endpointLatency = new Trend('endpoint_latency_ms');
const endpointSuccess = new Rate('endpoint_success_rate');

const status400 = new Counter('status_400');
const status401 = new Counter('status_401');
const status403 = new Counter('status_403');
const status404 = new Counter('status_404');
const status405 = new Counter('status_405');
const status422 = new Counter('status_422');
const status429 = new Counter('status_429');
const status500 = new Counter('status_500');
const status502 = new Counter('status_502');
const status503 = new Counter('status_503');
const status504 = new Counter('status_504');
const statusNetworkErr = new Counter('status_network_err');

export function setup() {
  const startTime = new Date().toISOString();
  console.log('=============================================================');
  console.log('[SETUP] Shnoor Parking Management System Load Test Initialized');
  console.log(`[SETUP] Target Server: ${BASE_URL}`);
  console.log(`[SETUP] Active Profile: ${currentStage.name}`);
  console.log(`[SETUP] Max Target VUs: ${currentStage.targetVUs}`);
  console.log(`[SETUP] Schedule: ${currentStage.durationDesc}`);
  console.log('=============================================================');

  const setupData = {
    baseUrl: BASE_URL,
    stageName: currentStage.name,
    targetVUs: currentStage.targetVUs,
    startTime: startTime,
    authToken: '',
    isAuthAvailable: false,
  };

  if (PUBLIC_ONLY) {
    console.log('[SETUP] Running in PUBLIC_ONLY mode. Skipping auth token retrieval.');
    return setupData;
  }

  if (__ENV.AUTH_TOKEN) {
    console.log('[SETUP] Using pre-configured AUTH_TOKEN from environment.');
    setupData.authToken = __ENV.AUTH_TOKEN;
    setupData.isAuthAvailable = true;
    return setupData;
  }

  try {
    console.log(`[SETUP] Authenticating as '${ADMIN_EMAIL}' against ${BASE_URL}...`);
    const loginRes = http.post(
      `${BASE_URL}/api/auth/password-login`,
      JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: '30s',
      }
    );

    if (loginRes.status === 200) {
      const loginBody = JSON.parse(loginRes.body);
      if (loginBody.customToken) {
        console.log('[SETUP] Firebase customToken received. Exchanging for ID Token via Google Identity Toolkit...');
        const exchangeRes = http.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
          JSON.stringify({
            token: loginBody.customToken,
            returnSecureToken: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: '30s',
          }
        );

        if (exchangeRes.status === 200) {
          const exchangeBody = JSON.parse(exchangeRes.body);
          if (exchangeBody.idToken) {
            setupData.authToken = exchangeBody.idToken;
            setupData.isAuthAvailable = true;
            console.log('[SETUP] SUCCESS: Firebase ID Token acquired. Authenticated endpoints enabled.');
            return setupData;
          }
        } else {
          console.warn(`[SETUP] Token exchange returned HTTP ${exchangeRes.status}. Authenticated endpoints will be rejected with 401.`);
        }
      }
    } else {
      console.warn(`[SETUP] Password login returned HTTP ${loginRes.status}. Authenticated endpoints will be rejected with 401.`);
    }
  } catch (err) {
    console.warn(`[SETUP] EXCEPTION during authentication: ${err.message}. Running in unauthenticated mode.`);
  }

  return setupData;
}

const API_ENDPOINTS = [
  {
    name: 'Health Check',
    path: '/',
    method: 'GET',
    authRequired: false,
    role: 'Public',
  },
  {
    name: 'Live Occupancy Stats',
    path: '/api/occupancy',
    method: 'GET',
    authRequired: false,
    role: 'Public',
  },
  {
    name: 'Parking Slots Catalog',
    path: '/api/parking-slots?page=1&limit=10',
    method: 'GET',
    authRequired: false,
    role: 'Public',
  },
  {
    name: 'Parking Locations Directory',
    path: '/api/parking-locations?page=1&limit=10',
    method: 'GET',
    authRequired: false,
    role: 'Public',
  },
  {
    name: 'Pricing & Tariff Plans',
    path: '/api/pricing-plans?page=1&limit=10',
    method: 'GET',
    authRequired: false,
    role: 'Public',
  },
  {
    name: 'Admin Dashboard Overview',
    path: '/api/admin/dashboard-overview',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Occupancy Grid',
    path: '/api/admin/occupancy',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Users Directory',
    path: '/api/admin/users?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Vehicles Directory',
    path: '/api/admin/vehicles?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Parking Records',
    path: '/api/admin/parking-records?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Active Sessions',
    path: '/api/admin/active-sessions',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Audit Logs',
    path: '/api/admin/audit-logs?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Audit Summary',
    path: '/api/admin/audit-logs/summary',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Contact Messages',
    path: '/api/admin/messages',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Reports Analytics',
    path: '/api/admin/reports-analytics?range=today',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'System Settings',
    path: '/api/system-settings',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Payments List',
    path: '/api/payments?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Today Payments Summary',
    path: '/api/payments/today',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Admin Payments Analytics',
    path: '/api/admin/payments/analytics',
    method: 'GET',
    authRequired: true,
    role: 'Admin',
  },
  {
    name: 'Staff Dashboard Overview',
    path: '/api/staff/dashboard-overview',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Staff Vehicle Entries',
    path: '/api/staff/vehicle-entries',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Staff Active Vehicles',
    path: '/api/staff/active-vehicles',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Staff Parking Records',
    path: '/api/staff/parking-records?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Staff Shift Report',
    path: '/api/staff/shift-report',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Staff Incidents Logs',
    path: '/api/staff/incidents?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Bookings Overview',
    path: '/api/bookings?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Staff',
  },
  {
    name: 'Customer Active Parking',
    path: `/api/customer/my-parking?email=${encodeURIComponent(CUSTOMER_EMAIL)}`,
    method: 'GET',
    authRequired: true,
    role: 'Customer',
  },
  {
    name: 'Customer Parking History',
    path: `/api/customer/parking-history?email=${encodeURIComponent(CUSTOMER_EMAIL)}&page=1&limit=10`,
    method: 'GET',
    authRequired: true,
    role: 'Customer',
  },
  {
    name: 'Customer Payments History',
    path: `/api/customer/payments?email=${encodeURIComponent(CUSTOMER_EMAIL)}&page=1&limit=10`,
    method: 'GET',
    authRequired: true,
    role: 'Customer',
  },
  {
    name: 'Customer Reservations',
    path: `/api/customer/reservations?email=${encodeURIComponent(CUSTOMER_EMAIL)}&page=1&limit=10`,
    method: 'GET',
    authRequired: true,
    role: 'Customer',
  },
  {
    name: 'Customer Vehicles',
    path: `/api/customer/vehicles?email=${encodeURIComponent(CUSTOMER_EMAIL)}&page=1&limit=10`,
    method: 'GET',
    authRequired: true,
    role: 'Customer',
  },
  {
    name: 'Support Tickets Catalog',
    path: '/api/support-tickets?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Shared',
  },
  {
    name: 'EV Charging Slots Catalog',
    path: '/api/ev-charging-slots?page=1&limit=10',
    method: 'GET',
    authRequired: true,
    role: 'Shared',
  },
  {
    name: 'Promotional Coupons List',
    path: '/api/coupons',
    method: 'GET',
    authRequired: true,
    role: 'Shared',
  },
];

function recordDiagnostics(res, endpoint) {
  const isSuccess = res.status >= 200 && res.status < 400;

  endpointRequests.add(1, { endpoint: endpoint.name, role: endpoint.role });
  endpointFailures.add(isSuccess ? 0 : 1, { endpoint: endpoint.name, role: endpoint.role });
  endpointLatency.add(res.timings.duration, { endpoint: endpoint.name, role: endpoint.role });
  endpointSuccess.add(isSuccess, { endpoint: endpoint.name, role: endpoint.role });

  if (!isSuccess) {
    if (res.status === 0) statusNetworkErr.add(1);
    else if (res.status === 400) status400.add(1);
    else if (res.status === 401) status401.add(1);
    else if (res.status === 403) status403.add(1);
    else if (res.status === 404) status404.add(1);
    else if (res.status === 405) status405.add(1);
    else if (res.status === 422) status422.add(1);
    else if (res.status === 429) status429.add(1);
    else if (res.status === 500) status500.add(1);
    else if (res.status === 502) status502.add(1);
    else if (res.status === 503) status503.add(1);
    else if (res.status === 504) status504.add(1);

    if (DEBUG_MODE || __ITER === 0) {
      let safeError = '';
      try {
        const bodyObj = JSON.parse(res.body);
        safeError = bodyObj.error || bodyObj.message || JSON.stringify(bodyObj);
      } catch (e) {
        safeError = String(res.body || '').replace(/[\r\n]+/g, ' ').substring(0, 120);
      }
      safeError = safeError.substring(0, 150);
      console.warn(`[HTTP ${res.status}] ${endpoint.name} (${res.timings.duration.toFixed(1)}ms): ${safeError}`);
    }
  }

  check(res, {
    [`${endpoint.name}: HTTP 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
    [`${endpoint.name}: latency < 4000ms`]: (r) => r.timings.duration < 4000,
  });
}

export default function (setupData) {
  const token = setupData ? setupData.authToken : '';

  group('Read-Only API Load Simulation', () => {
    for (const ep of API_ENDPOINTS) {
      if (PUBLIC_ONLY && ep.authRequired) {
        continue;
      }

      const reqHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      if (ep.authRequired && token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
      }

      const url = `${BASE_URL}${ep.path}`;
      const res = http.get(url, {
        headers: reqHeaders,
        tags: { endpoint: ep.name, method: ep.method, role: ep.role },
        timeout: '30s',
      });

      recordDiagnostics(res, ep);
      sleep(THINK_TIME);
    }
  });

  if (ENABLE_WRITE_TESTS && token) {
    group('Safe Non-Destructive Write Tests', () => {
      const authHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const calcRes = http.post(
        `${BASE_URL}/api/parking/calculate-fee`,
        JSON.stringify({ vehicle_type: 'Car', duration_hours: 2 }),
        { headers: authHeaders, tags: { endpoint: 'Fee Calculation', method: 'POST' }, timeout: '30s' }
      );
      check(calcRes, { 'Fee Calculation: HTTP 200': (r) => r.status === 200 });

      sleep(THINK_TIME);
    });
  }

  sleep(0.3);
}

export function handleSummary(data) {
  const reqMetrics = data.metrics.http_reqs?.values || {};
  const failMetrics = data.metrics.http_req_failed?.values || {};
  const durMetrics = data.metrics.http_req_duration?.values || {};

  const totalRequests = reqMetrics.count || 0;
  const failureRate = failMetrics.rate || 0;
  const successRate = 1 - failureRate;
  const failedRequests = Math.round(totalRequests * failureRate);
  const successfulRequests = totalRequests - failedRequests;

  const testDurationMs = data.state.testRunDurationMs || 0;
  const durationSec = (testDurationMs / 1000).toFixed(1);
  const rps = (totalRequests / (testDurationMs / 1000 || 1)).toFixed(2);

  const avgMs = (durMetrics.avg || 0).toFixed(2);
  const medMs = (durMetrics.med || 0).toFixed(2);
  const p90Ms = (durMetrics['p(90)'] || 0).toFixed(2);
  const p95Ms = (durMetrics['p(95)'] || 0).toFixed(2);
  const maxMs = (durMetrics.max || 0).toFixed(2);

  const checksMap = {};
  function extractChecks(group) {
    if (!group) return;
    if (group.checks) {
      for (const chk of group.checks) {
        checksMap[chk.name] = { passes: chk.passes, fails: chk.fails };
      }
    }
    if (group.groups) {
      for (const sub of group.groups) extractChecks(sub);
    }
  }
  extractChecks(data.root_group);

  const endpointDetails = [];
  for (const ep of API_ENDPOINTS) {
    const statusChk = checksMap[`${ep.name}: HTTP 2xx/3xx`];
    const passes = statusChk ? statusChk.passes : 0;
    const fails = statusChk ? statusChk.fails : 0;
    const calls = passes + fails;
    const successPct = calls > 0 ? (((passes) / calls) * 100).toFixed(2) : 'N/A';

    endpointDetails.push({
      name: ep.name,
      role: ep.role,
      category: ep.role,
      method: ep.method,
      path: ep.path,
      authRequired: ep.authRequired,
      totalCalls: calls,
      successfulCalls: passes,
      failedCalls: fails,
      successPercentage: successPct,
    });
  }

  const statusMap = {
    '2xx/3xx (Success)': successfulRequests,
    '400 Bad Request': data.metrics.status_400?.values?.count || 0,
    '401 Unauthorized': data.metrics.status_401?.values?.count || 0,
    '403 Forbidden': data.metrics.status_403?.values?.count || 0,
    '404 Not Found': data.metrics.status_404?.values?.count || 0,
    '405 Method Not Allowed': data.metrics.status_405?.values?.count || 0,
    '422 Unprocessable': data.metrics.status_422?.values?.count || 0,
    '429 Rate Limited': data.metrics.status_429?.values?.count || 0,
    '500 Server Error': data.metrics.status_500?.values?.count || 0,
    '502 Bad Gateway': data.metrics.status_502?.values?.count || 0,
    '503 Service Unavailable': data.metrics.status_503?.values?.count || 0,
    '504 Gateway Timeout': data.metrics.status_504?.values?.count || 0,
    'Network / Connect Err': data.metrics.status_network_err?.values?.count || 0,
  };

  const executiveSummary = {
    testDate: new Date().toISOString(),
    environment: {
      targetUrl: BASE_URL,
      stage: currentStage.name,
      maxVirtualUsers: currentStage.targetVUs,
      durationDescription: currentStage.durationDesc,
      actualDurationSeconds: durationSec,
    },
    performanceKPIs: {
      totalRequests,
      successfulRequests,
      failedRequests,
      successPercentage: `${(successRate * 100).toFixed(2)}%`,
      failurePercentage: `${(failureRate * 100).toFixed(2)}%`,
      requestsPerSecond: parseFloat(rps),
      latencyMs: {
        average: parseFloat(avgMs),
        median: parseFloat(medMs),
        p90: parseFloat(p90Ms),
        p95: parseFloat(p95Ms),
        maximum: parseFloat(maxMs),
      },
      thresholdStatus: failureRate <= 0.01 && parseFloat(p95Ms) <= 1500 ? 'PASSED' : 'WARNED / FAILED',
    },
    statusCodesBreakdown: statusMap,
    endpointBreakdown: endpointDetails,
  };

  const separator = '='.repeat(84);
  const subSeparator = '-'.repeat(84);

  let terminalReport = `
${separator}
SHNOOR SMART PARKING MANAGEMENT SYSTEM - K6 PERFORMANCE & DIAGNOSTIC REPORT
${separator}
Test Timestamp    : ${new Date().toLocaleString()}
Target Backend    : ${BASE_URL}
Execution Profile : ${currentStage.name}
Target Concurrency: ${currentStage.targetVUs} Virtual Users (VUs)
Test Duration     : ${durationSec} seconds
Threshold Status  : ${executiveSummary.performanceKPIs.thresholdStatus}
${subSeparator}
EXECUTIVE KPI SUMMARY:
  Total HTTP Requests  : ${totalRequests.toLocaleString()}
  Successful Requests  : ${successfulRequests.toLocaleString()} (${(successRate * 100).toFixed(2)}%)
  Failed Requests      : ${failedRequests.toLocaleString()} (${(failureRate * 100).toFixed(2)}%)
  Throughput (RPS)     : ${rps} req/sec

LATENCY PROFILE (ms):
  Average Latency      : ${avgMs} ms
  Median (P50) Latency : ${medMs} ms
  90th Percentile (P90): ${p90Ms} ms
  95th Percentile (P95): ${p95Ms} ms
  Maximum Latency      : ${maxMs} ms
${subSeparator}
HTTP STATUS BREAKDOWN:
`;

  for (const [stName, stCount] of Object.entries(statusMap)) {
    if (stCount > 0) {
      terminalReport += `  ${stName.padEnd(26)}: ${String(stCount).padStart(6)} (${(((stCount) / totalRequests) * 100).toFixed(2)}%)\n`;
    }
  }

  terminalReport += `${subSeparator}\nENDPOINT-WISE PERFORMANCE BREAKDOWN:\n`;
  terminalReport += `${'Endpoint Name'.padEnd(34)} | ${'Role'.padEnd(10)} | ${'Reqs'.padStart(6)} | ${'Success%'.padStart(9)}\n`;
  terminalReport += `${'-'.repeat(34)}-+-${'-'.repeat(10)}-+-${'-'.repeat(6)}-+-${'-'.repeat(9)}\n`;

  for (const ep of endpointDetails) {
    if (ep.totalCalls > 0) {
      terminalReport += `${ep.name.padEnd(34)} | ${ep.role.padEnd(10)} | ${String(ep.totalCalls).padStart(6)} | ${(ep.successPercentage + '%').padStart(9)}\n`;
    }
  }

  terminalReport += `${separator}\n`;

  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    'k6-report.json': JSON.stringify(executiveSummary, null, 2),
    stdout: terminalReport,
  };
}
