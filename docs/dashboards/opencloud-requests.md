# OpenCloud Request Details

Performance analysis dashboard for investigating latency issues and service behavior.

| | |
|---|---|
| **UID** | `opencloud-requests` |
| **Datasource** | Prometheus |
| **Refresh** | auto |

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

### Key Indicators

| Panel | Shows | Thresholds |
|-------|-------|------------|
| **Total Requests/s** | Overall request rate | green (baseline) |
| **Error Rate** | % failed requests | green <1%, yellow <5%, red ≥5% |
| **P50 Latency** | Median response time | green <100ms, yellow <500ms, red ≥500ms |
| **P95 Latency** | 95th percentile | green <500ms, yellow <2s, red ≥2s |
| **P99 Latency** | 99th percentile | green <1s, yellow <5s, red ≥5s |
| **Errors/s** | Absolute error count | green <1, yellow <10, red ≥10 |

### Latency Analysis

| Panel | Shows |
|-------|-------|
| **Latency Heatmap** | Visual distribution of response times. Darker = more requests |
| **Latency Percentiles Over Time** | Track P50, P90, P95, P99 trends |
| **Request Rate vs Errors** | Correlation: Do errors increase with load? |

**Interpretation:**
- Consistent band in heatmap = good performance
- Spreading pattern = degradation
- Bimodal (two bands) = different request types

### Service Breakdown *(collapsed)*

| Panel | Shows |
|-------|-------|
| **HTTP Requests by Service** | Frontend, WebDAV, OCM, Storage System |
| **gRPC Requests by Service** | Gateway, Users, Groups, Sharing, Storage Users, Auth |

**Interpretation:**
- Frontend = web UI/API
- WebDAV = desktop/mobile sync clients
- High traffic on one service may indicate bottleneck

### Endpoint Analysis *(collapsed)*

| Panel | Shows |
|-------|-------|
| **Microservice Latency by Endpoint** | Top 10 slowest internal endpoints |

Focus optimization on high-volume + high-latency endpoints.

### Resource Correlation *(collapsed)*

| Panel | Shows |
|-------|-------|
| **Request Rate vs Memory** | Heap memory and goroutines vs load |

**Interpretation:**
- Memory grows with load but drops after = normal
- Memory grows and never drops = leak

### Service Totals *(collapsed)*

| Panel | Shows |
|-------|-------|
| **Service Requests (selected range)** | Request distribution for capacity planning |
| **Service Totals (since start)** | Cumulative counts since container restart |

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
4. Expand **Service Breakdown** to identify affected service

### Find slow endpoints

1. Expand **Endpoint Analysis** section
2. Check **Microservice Latency by Endpoint**
3. Note top 3-5 slowest endpoints
4. Focus optimization on high-volume + high-latency

### Check for memory leaks

1. Expand **Resource Correlation** section
2. Watch **Request Rate vs Memory** over hours/days
3. Does memory drop after load decreases?
4. Do goroutines return to baseline?
5. If not → potential leak

### Capacity planning

1. Expand **Service Totals** section
2. Review traffic distribution
3. Expand **Service Breakdown** for peak patterns
4. Identify which services need scaling

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
