# OpenCloud Upload Pipeline

Deep dive into file uploads, antivirus scanning, and async processing queues.

| | |
|---|---|
| **UID** | `opencloud-uploads` |
| **Datasource** | Prometheus |
| **Refresh** | 30s |

## When to Use

- Troubleshoot upload failures
- Monitor ClamAV antivirus performance
- Identify processing bottlenecks
- Debug file sync issues (desktop/mobile clients)

**Not for:** HTTP error analysis → use [Proxy](opencloud-proxy.md) instead

**Start from:** [Overview](opencloud-overview.md) for quick health check

---

## Data Requirements

### Metrics Source

```promql
reva_upload_*
reva_download_*
opencloud_postprocessing_*
opencloud_search_*
opencloud_thumbnails_*
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
| **Active Uploads** | Current upload count | green <10, yellow <50, red ≥50 |
| **Processing** | Files in post-upload processing | blue <20, yellow <100, red ≥100 |
| **Active Downloads** | Current download count | purple <50, yellow <200, red ≥200 |
| **Upload Success Rate** | % uploads completing successfully | red <90%, yellow <98%, green ≥98% |
| **Postprocessing Queue** | Events waiting for processing | green <10, yellow <50, red ≥50 |
| **Search Queue** | Events waiting for indexing | green <10, yellow <50, red ≥50 |

### Upload Pipeline

| Panel | Shows |
|-------|-------|
| **Upload Pipeline Flow** | Upload lifecycle over time: Initiated → Transfer Complete → Scanned → Finalized/Aborted |

**Interpretation:**
- Gap between stages = where uploads get stuck
- Initiated >> Finalized = high failure rate

### Upload Statistics

| Panel | Shows |
|-------|-------|
| **Uploads in Selected Range** | Counts for selected time window |
| **Upload Totals (since start)** | Cumulative counts since container restart |

Compare stages to identify where uploads fail:
- Transfer Complete < Initiated → Network issues
- Scanned < Transfer Complete → ClamAV rejections
- Finalized < Scanned → Post-processing failures

### Transfer Activity *(collapsed)*

| Panel | Shows |
|-------|-------|
| **Active Transfers Over Time** | Stacked view: Uploads, Downloads, Processing, Assimilation |
| **Event Queue Depth** | Queue backlog: Unprocessed and Redelivered events |

**Interpretation:**
- Rising redelivered count = persistent failures
- High Processing values = slow ClamAV

### Processing Performance *(collapsed)*

| Panel | Shows |
|-------|-------|
| **Thumbnail Generation** | Latency percentiles (P50, P95, P99) |
| **Postprocessing Duration** | Overall processing time percentiles |
| **Drop-off Analysis** | Success rates per stage as bar gauges |

All drop-off bars should be near 100%.

---

## Upload Lifecycle

```
User clicks Upload
        │
        ▼
┌─────────────────┐
│   Initiated     │ ← Upload session created
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Transfer Complete│ ← All bytes received
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scanned (AV)   │ ← ClamAV checks file
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Finalized│ │Aborted│
│(success)│ │(failed)│
└───────┘ └───────┘
```

---

## Common Tasks

### Debug slow uploads

1. Check **Processing** count (high = bottleneck)
2. Expand **Processing Performance** section
3. Check **Postprocessing Duration** for slow P95/P99
4. Expand **Transfer Activity** for **Event Queue Depth**
5. → For ClamAV logs: [Logs](opencloud-logs.md) with component=antivirus

### Investigate upload failures

1. Check **Upload Success Rate** gauge
2. Compare stages in **Uploads in Selected Range**
3. Identify gap: which stage has drop-off?
4. Expand **Processing Performance** for **Drop-off Analysis**
5. → For error details: [Logs](opencloud-logs.md)

### Monitor ClamAV performance

1. Watch gap between Transfer Complete and Scanned in pipeline
2. Check **Postprocessing Queue** for growing backlog
3. Expand **Processing Performance** for duration P95
4. → For ClamAV specific: [Logs](opencloud-logs.md) with component=antivirus

### Check for sync client issues

1. Look for many **Active Uploads** during off-hours (backup jobs)
2. Check **Aborted** count in pipeline flow
3. Expand **Transfer Activity** for patterns
4. → For HTTP details: [Proxy](opencloud-proxy.md)

---

## Troubleshooting

### Processing count stays high

- ClamAV is slow or overloaded
- Check disk I/O
- Consider ClamAV resource limits

### Many Aborted uploads

- File rejected by antivirus
- Storage quota exceeded
- Network interruption
- → Check [Logs](opencloud-logs.md) for error messages

### Queue growing continuously

- Processing can't keep up with uploads
- Check ClamAV, thumbnail service logs
- Consider scaling or resource allocation

### Success rate dropping

- Check which stage has the drop-off
- Transfer Complete low → network issues
- Scanned low → ClamAV rejecting files
- Finalized low → post-processing errors

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Overview](opencloud-overview.md) | Prometheus | Quick health check (start here) |
| [Logs](opencloud-logs.md) | Loki | Error details, antivirus logs |
| [Proxy](opencloud-proxy.md) | Loki | WebDAV request analysis |
| [Requests](opencloud-requests.md) | Prometheus | Performance analysis |
