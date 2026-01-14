# OpenCloud Request Details

Performance analysis dashboard for investigating latency issues and service behavior.

| | |
|---|---|
| **UID** | `opencloud-requests` |
| **Datasource** | Prometheus |
| **Refresh** | 30s |

## When to Use

- Users report slowness
- Investigate latency issues
- Identify slow services or endpoints
- Correlate load with resource usage
- Capacity planning

**Not for:** Error investigation → use [Logs](opencloud-logs.md) instead

**Start from:** [Overview](opencloud-overview.md) for quick health check

---

## Data Requirements

### Metrics Source

```promql
opencloud_proxy_requests_total
opencloud_proxy_errors_total
opencloud_proxy_duration_seconds_bucket
opencloud_*_http_requests_total
opencloud_*_grpc_requests_total
micro_request_duration_seconds_*
go_memstats_heap_alloc_bytes
go_goroutines
```

### Required Jobs

| Job | Description |
|-----|-------------|
| `opencloud` | OpenCloud metrics endpoint (port 9205) |

---

## Panels

### Key Indicators (Top Row)

| Panel | Shows | Thresholds |
|-------|-------|------------|
| **Total Requests/s** | Overall request rate | green (baseline) |
| **Error Rate** | % failed requests | green <1%, yellow <5%, red ≥5% |
| **P50 Latency** | Median response time | green <100ms, yellow <500ms, red ≥500ms |
| **P95 Latency** | 95th percentile | green <500ms, yellow <2s, red ≥2s |
| **P99 Latency** | 99th percentile | green <1s, yellow <5s, red ≥5s |
| **Errors/s** | Absolute error count | green <1, yellow <10, red ≥10 |

### Latency Heatmap

Visual distribution of response times. Darker = more requests at that latency.

**Interpretation:**
- Consistent band = good performance
- Spreading pattern = degradation
- Bimodal (two bands) = different request types

### Latency Percentiles Over Time

Track P50, P90, P95, P99 over time.

**Interpretation:**
- Parallel lines = consistent
- Diverging lines = some requests getting slower
- Sudden jumps = correlate with events

### Request Rate vs Errors

Correlation analysis: Do errors increase with load?

**Interpretation:**
- Errors spike with requests → system overwhelmed
- Errors spike alone → other issue (disk, dependency)

### HTTP Requests by Service

External-facing services:
- **Frontend** = Web UI/API
- **WebDAV** = Desktop/mobile sync clients
- **OCM** = Federation
- **Storage System** = Internal storage ops

### gRPC Requests by Service

Internal microservice communication:
- **Gateway** = Central router
- **Users/Groups** = Identity lookups
- **Sharing** = Share operations
- **Storage Users** = User storage
- **Auth Service** = Authentication

### Microservice Latency by Endpoint

Top 10 slowest internal endpoints. Focus optimization here.

### Request Rate vs Memory

Correlation for memory leak detection.

**Interpretation:**
- Memory grows with load but drops after = normal
- Memory grows and never drops = leak

### Service Requests (range) / Service Totals

Bar gauges showing request distribution for capacity planning.

---

## Understanding Latency

```
         P50 (Median)        P95           P99
            │                 │             │
            ▼                 ▼             ▼
    ┌───────────────────────────────────────────┐
    │░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓████████████████│
    └───────────────────────────────────────────┘
    fast                                    slow

    ░░░ = 50% of requests (typical user)
    ▓▓▓ = 45% of requests
    ███ = 5% of requests (slow, but still affect users)
```

**What to watch:**
- P50 = typical user experience
- P95 = slow users (1 in 20)
- P99 = worst case (1 in 100)

Large gap between P50 and P99 indicates outliers needing investigation.

---

## Common Tasks

### Investigate reported slowness

1. Check **P50/P95/P99 Latency** indicators
2. Look at **Latency Heatmap** for when slowdown started
3. Check **Latency Percentiles Over Time** for trends
4. Identify affected service in **HTTP/gRPC Requests by Service**

### Find slow endpoints

1. Check **Microservice Latency by Endpoint**
2. Note top 3-5 slowest endpoints
3. Correlate with request volume
4. Focus optimization on high-volume + high-latency

### Check for memory leaks

1. Watch **Request Rate vs Memory** over hours/days
2. Does memory drop after load decreases?
3. Do goroutines return to baseline?
4. If not → potential leak

### Capacity planning

1. Review **Service Totals** for traffic distribution
2. Check **HTTP/gRPC Requests by Service** for peak patterns
3. Identify which services need scaling

---

## Troubleshooting

### High P99 with normal P50

- Some operations are much slower than others
- Likely: large file operations, complex searches
- Check **Microservice Latency by Endpoint** for culprit

### Latency increases with load

- System reaching capacity
- Check CPU/Memory on host (use Node Exporter dashboard)
- Consider resource allocation or scaling

### Bimodal latency pattern

- Two different types of requests
- Often: cached vs uncached, small vs large files
- May be normal behavior

### All latencies increasing together

- Systemic issue (disk I/O, network, dependency)
- Check infrastructure dashboards
- Review external dependencies

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Overview](opencloud-overview.md) | Prometheus | Quick health check (start here) |
| [Proxy](opencloud-proxy.md) | Loki | HTTP access log analysis |
| [Logs](opencloud-logs.md) | Loki | Error investigation |
| [Uploads](opencloud-uploads.md) | Prometheus | Upload pipeline analysis |

**External:** Node Exporter Full (from grafana.com) for host system metrics.
