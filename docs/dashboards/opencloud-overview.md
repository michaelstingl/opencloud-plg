# OpenCloud Overview

Quick health check dashboard showing key metrics at a glance.

| | |
|---|---|
| **UID** | `opencloud-overview` |
| **Datasource** | Prometheus |
| **Refresh** | auto |

## Start Here

This is the **entry point** for OpenCloud monitoring. Use it for daily health checks and as a starting point for investigations.

```
                    ┌─────────────────────┐
                    │  OpenCloud Overview │ ← You are here
                    │     (Prometheus)    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Requests   │     │   Uploads   │     │    Logs     │
    │ (Prometheus)│     │ (Prometheus)│     │   (Loki)    │
    └─────────────┘     └─────────────┘     └──────┬──────┘
                                                   │
                               ┌───────────────────┼───────────────────┐
                               │                   │                   │
                               ▼                   ▼                   ▼
                        ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                        │    Proxy    │     │ Activitylog │     │  (filter by │
                        │   (Loki)    │     │   (Loki)    │     │  component) │
                        └─────────────┘     └─────────────┘     └─────────────┘
```

---

## When to Use

- Daily health check at a glance
- First stop when investigating issues
- Monitor system during deployments
- Correlate load with errors and latency

**Drill down to:**
- [Requests](opencloud-requests.md) → Performance details, latency heatmap
- [Uploads](opencloud-uploads.md) → Upload pipeline, ClamAV issues
- [Logs](opencloud-logs.md) → Application errors, component debugging

---

## Data Requirements

### Metrics Source

```promql
opencloud_proxy_requests_total
opencloud_proxy_errors_total
opencloud_proxy_duration_seconds_bucket
reva_upload_*
opencloud_postprocessing_*
go_goroutines
go_memstats_heap_alloc_bytes
```

### Required Jobs

| Job | Description |
|-----|-------------|
| `opencloud` | OpenCloud metrics endpoint (port 9205) |

---

## Panels

### Key Indicators (Top Row)

| Panel | Metric | Thresholds |
|-------|--------|------------|
| **Requests/s** | HTTP requests per second | green, yellow >100, red >500 |
| **Error Rate** | % failed requests (5xx, timeouts) | green <1%, yellow <5%, red ≥5% |
| **P95 Latency** | 95th percentile response time | green <500ms, yellow <2s, red ≥2s |
| **Goroutines** | Active goroutines | green <2000, yellow <5000, red ≥5000 |

### Request Rate & Errors

Dual-axis chart showing requests (green, left) and errors (red, right) over time.

**Interpretation:**
- Errors rise with requests → system overloaded
- Errors spike without request spike → other problem (disk, external service)

### Latency Percentiles

Response times over time: P50 (green), P95 (yellow), P99 (red).

**Interpretation:**
- Parallel lines = consistent performance
- Large gap P50↔P99 = outliers → check [Requests](opencloud-requests.md)

### Active Transfers

Concurrent transfers: Uploads (blue), Downloads (purple), Processing (orange).

**Interpretation:**
- High Processing = slow ClamAV or backlog → check [Uploads](opencloud-uploads.md)
- Should return to 0 after activity stops

### Upload Pipeline

Upload lifecycle per minute: Initiated → Scanned → Finalized/Aborted.

**Interpretation:**
- Gap between stages = where uploads get stuck
- Many Aborted = antivirus or storage issues → check [Uploads](opencloud-uploads.md)

### Event Queues

Async processing queues: Postprocessing, Search.

**Interpretation:**
- Should be 0-5 normally
- Growing queue = processing can't keep up

### Memory Usage

Heap memory of OpenCloud process.

**Interpretation:**
- Normal: 50-200 MB
- Steadily increasing without drop = memory leak

---

## Common Tasks

### Quick health check

1. Check **Error Rate** gauge (should be green)
2. Check **P95 Latency** (should be <500ms)
3. Check **Goroutines** (should be <2000)
4. If any red → drill down to specific dashboards

### Investigate slow performance

1. Check **Latency Percentiles** for when slowdown started
2. Correlate with **Request Rate & Errors** for load spike
3. Check **Active Transfers** for upload/download activity
4. → Drill down: [Requests](opencloud-requests.md)

### Monitor during deployment

1. Watch **Error Rate** during rollout
2. Check **Request Rate & Errors** for correlation
3. Watch **Goroutines** for stability after restart
4. Verify **Upload Pipeline** resumes normal flow

### Investigate errors

1. Note the time range with errors
2. → Drill down: [Logs](opencloud-logs.md) for application errors
3. → Drill down: [Proxy](opencloud-proxy.md) for HTTP errors

---

## Troubleshooting

### No data displayed

- Check Prometheus is scraping OpenCloud metrics
- Verify `opencloud:9205/metrics` endpoint is accessible
- Check job name matches `opencloud`

### Goroutines steadily increasing

- Possible goroutine leak
- Monitor for several hours
- If continues without load, restart container and report upstream

### High error rate without request spike

- Check disk space
- Check external dependencies (LDAP, SMTP)
- → Drill down: [Logs](opencloud-logs.md) for specific errors

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Requests](opencloud-requests.md) | Prometheus | Detailed performance analysis |
| [Uploads](opencloud-uploads.md) | Prometheus | Upload pipeline deep dive |
| [Logs](opencloud-logs.md) | Loki | Error investigation |
| [Proxy](opencloud-proxy.md) | Loki | HTTP traffic analysis |
