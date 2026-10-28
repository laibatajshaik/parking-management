
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const MAX_VUS = Number(__ENV.MAX_VUS || 10);
const DURATION = __ENV.DURATION || '30s';

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

export default function () {
  const response = http.get(`${BASE_URL}/`, {
    tags: { endpoint: 'Health' },
    timeout: '30s',
  });

  check(response, {
    'health endpoint returns success': (r) => r.status >= 200 && r.status < 400,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify({
      totalRequests: data.metrics.http_reqs?.values?.count,
      failedRequestRate: data.metrics.http_req_failed?.values?.rate,
      averageResponseMs: data.metrics.http_req_duration?.values?.avg,
      p95ResponseMs: data.metrics.http_req_duration?.values?.['p(95)'],
    }, null, 2),
  };
}

