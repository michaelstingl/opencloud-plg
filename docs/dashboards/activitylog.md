# OpenCloud Activitylog Debug

Debug dashboard for activitylog service and NATS/JetStream event processing.

| | |
|---|---|
| **UID** | `activitylog-debug` |
| **Datasource** | Loki |
| **Refresh** | auto |

## When to Use

- Activity feed not showing events
- Debugging activitylog service issues
- Investigating NATS/JetStream problems
- Tracking upstream issues (e.g., opencloud#2089)

**Note:** This is a debug dashboard for development and issue tracking, not daily operations.

**Start from:** [Logs](opencloud-logs.md) for general log analysis, filter by component=activitylog

---

## Data Requirements

### Log Stream

```logql
{container="opencloud-opencloud-1"} |= `"service":"activitylog"`
{container="opencloud-opencloud-1"} |= `"service":"nats"`
```

> **Note:** Container name `opencloud-opencloud-1` is deployment-specific. Adjust if your Docker Compose project has a different name.

### Required Labels

| Label | Description |
|-------|-------------|
| `container` | Docker container name |

### Log Fields

| Field | Description |
|-------|-------------|
| `service` | Service name (activitylog, nats) |
| `level` | Log level (error, warn, info) |
| `message` | Log message |

---

## Panels

### NATS / JetStream Row

| Panel | Shows | Thresholds |
|-------|-------|------------|
| **NATS Errors (24h)** | Error count from NATS service | green=0, red≥1 |
| **NATS Warnings (24h)** | Warning count from NATS | green=0, yellow≥1, orange≥10 |
| **NATS Config Warnings (24h)** | Configuration-related warnings | green=0, yellow≥1 |
| **Filestore Warnings (24h)** | JetStream filestore warnings | green=0, yellow≥1 |

**NATS Service Logs:** Error and warning logs from NATS service.

### Activitylog Errors Row

| Panel | Shows | Thresholds |
|-------|-------|------------|
| **Activitylog Errors (24h)** | Total errors | green=0, yellow≥1, red≥10 |
| **Event Processing Errors** | "could not process event" errors | green=0, red≥1 |
| **Store Errors** | Activity store errors | green=0, red≥1 |
| **Unknown Events** | "event not registered" warnings | green=0, yellow≥1 |

**Error Rate Over Time:** Errors and warnings over time.

**All Activitylog Errors:** Full error log stream.

---

## Error Types

### Event Processing Errors

```
could not process event
```

Event received but failed during processing. Check:
- Event format
- Required fields present
- Storage accessible

### Store Errors

```
error.*store
error.*activities
```

Failed to read/write activity data. Check:
- Disk space
- File permissions
- Storage path configuration

### Unknown Events

```
event not registered
```

Received event type not handled by activitylog. Usually:
- New event type not yet supported
- Version mismatch

### NATS Connection Issues

```
nats configuration
Filestore
```

JetStream storage or configuration problems. Check:
- NATS data directory
- Disk space for JetStream
- NATS configuration

---

## Common Tasks

### Debug missing activities

1. Check **Activitylog Errors (24h)** for any errors
2. Check **Event Processing Errors** specifically
3. Review **All Activitylog Errors** log panel
4. Check **NATS Errors** for event delivery issues
5. → For broader context: [Logs](opencloud-logs.md) with component=activitylog

### Investigate NATS problems

1. Check all NATS panels in top row
2. Review **NATS Service Logs** for details
3. Look for Filestore warnings (disk issues)
4. Check NATS configuration warnings

### Track upstream issues

1. Monitor error patterns over time
2. Capture specific error messages
3. Correlate with OpenCloud versions
4. Document for upstream issue reports

---

## Troubleshooting

### All activitylog panels show 0 but activities missing

- Events may not be reaching activitylog
- Check NATS service is running
- Verify event publishing from other services
- → Check [Overview](opencloud-overview.md) for Event Queues

### NATS Filestore warnings

- JetStream storage issues
- Check disk space in NATS data directory
- May need to clean old streams

### "event not registered" increasing

- New event types from updated OpenCloud
- Usually informational, not critical
- May indicate version mismatch

### Persistent event processing errors

- Check specific error messages in logs
- May indicate storage issues
- Review activitylog service configuration

### Container name doesn't match

If queries show no data, check your container name:
```bash
docker ps --format "{{.Names}}" | grep opencloud
```
Update the queries if your container is named differently.

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Logs](opencloud-logs.md) | Loki | General log analysis (component=activitylog) |
| [Overview](opencloud-overview.md) | Prometheus | Event Queues, system health |

## References

- [opencloud#2089](https://github.com/opencloud-eu/opencloud/issues/2089) - Activities app issues
