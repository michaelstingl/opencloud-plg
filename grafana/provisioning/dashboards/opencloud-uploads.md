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

### Key Indicators (Top Row)

| Panel | Shows | Thresholds |
|-------|-------|------------|
| **Active Uploads** | Current upload count | green <10, yellow <50, red ≥50 |
| **Processing** | Files in post-upload processing | blue <20, yellow <100, red ≥100 |
| **Active Downloads** | Current download count | purple <50, yellow <200, red ≥200 |
| **Upload Success Rate** | % uploads completing successfully | red <90%, yellow <98%, green ≥98% |
| **Postprocessing Queue** | Events waiting for processing | green <10, yellow <50, red ≥50 |
| **Search Queue** | Events waiting for indexing | green <10, yellow <50, red ≥50 |

### Upload Pipeline Flow

Upload lifecycle over time:
- **Initiated** (blue) → Upload started
- **Transfer Complete** (light-blue) → All bytes received
- **Scanned (AV)** (yellow) → ClamAV check done
- **Finalized** (green) → Success
- **Aborted** (red) → Failed

**Interpretation:**
- Gap between stages = where uploads get stuck
- Initiated >> Finalized = high failure rate

### Uploads in Selected Range / Upload Totals

Compare stages to identify where uploads fail:
- Transfer Complete < Initiated → Network issues
- Scanned < Transfer Complete → ClamAV rejections
- Finalized < Scanned → Post-processing failures

### Active Transfers Over Time

Stacked view: Uploads, Downloads, Processing, Assimilation (PosixFS metadata sync).

### Event Queue Depth

Queue backlog over time:
- **Unprocessed** = waiting to be handled
- **Redelivered** = failed and retrying

Rising redelivered count = persistent failures.

### Thumbnail Generation / Postprocessing Duration

Latency percentiles (P50, P95, P99) for:
- Thumbnail generation
- Overall postprocessing

### Drop-off Analysis

Success rates for each stage as bar gauges. All should be near 100%.

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
2. Check **Postprocessing Duration** for slow P95/P99
3. Check **Event Queue Depth** for backlog
4. → For ClamAV logs: [Logs](opencloud-logs.md) with component=antivirus

### Investigate upload failures

1. Check **Upload Success Rate** gauge
2. Compare stages in **Uploads in Selected Range**
3. Identify gap: which stage has drop-off?
4. Check **Drop-off Analysis** bars
5. → For error details: [Logs](opencloud-logs.md)

### Monitor ClamAV performance

1. Watch gap between Transfer Complete and Scanned
2. Check **Postprocessing Queue** for growing backlog
3. Review **Postprocessing Duration** P95

### Check for sync client issues

1. Look for many **Active Uploads** during off-hours (backup jobs)
2. Check **Aborted** count in pipeline flow
3. → For HTTP details: [Proxy](opencloud-proxy.md)

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
