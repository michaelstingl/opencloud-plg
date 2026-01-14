# OpenCloud Logs

Log monitoring for all OpenCloud services and components with flexible filtering.

| | |
|---|---|
| **UID** | `opencloud-logs` |
| **Datasource** | Loki |
| **Refresh** | 30s |

## When to Use

- Monitor error rates across all services
- Debug application-level issues by component
- Track down warnings and errors in specific components
- Search logs by text pattern
- Analyze log volume patterns

**Not for:** HTTP request analysis → use [Proxy](opencloud-proxy.md) instead

**Start from:** [Overview](opencloud-overview.md) for quick health check

---

## Data Requirements

### Log Stream

```logql
{service=~"$service", level=~"$level"} | json | service_extracted=~"$component"
```

### Labels

| Label | Source | Description |
|-------|--------|-------------|
| `service` | Docker Compose | Container service name (e.g., `opencloud`, `collaboration`) |
| `level` | Log JSON | Log level (error, warn, info, debug) |

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| `service_extracted` | OpenCloud component | `proxy`, `graph`, `storage-users` |
| `message` | Log message | `request completed` |

### OpenCloud Components

```
proxy, gateway, frontend, graph, ocdav, ocm, sharing
storage-system, storage-users, storage-shares, storage-publiclink
auth-service, auth-app, auth-basic, auth-machine
users, groups, idm, idp, settings, notifications
postprocessing, thumbnails, antivirus, search
app-provider, app-registry, collaboration
activitylog, clientlog, userlog, eventhistory
nats, sse, webfinger, invitations, policies, audit
```

---

## Filters

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| **Service** | Multi-select (query) | opencloud | Docker Compose service names |
| **Component** | Multi-select | All | OpenCloud internal components |
| **Log Level** | Multi-select (query) | All | error, warn, info, debug |
| **Search** | Text | (empty) | Case-insensitive text search |

### Search Filter Examples

```
error                   # Logs containing "error"
user@example.com        # Logs for specific user
spaceid                 # Space-related logs
quota                   # Quota-related logs
timeout                 # Timeout errors
```

---

## Panels

### Overview (Top Row)

| Panel | Shows |
|-------|-------|
| **Log Volume by Level** | Stacked bars over time (red=error, orange=warn, blue=info, gray=debug) |
| **Error Count** | Total errors (green <10, yellow <100, red ≥100) |
| **Warning Count** | Total warnings (green <50, yellow <200, orange ≥200) |
| **Total Logs** | Total log lines in time range |
| **Error Rate** | Gauge showing % of error logs (green <1%, yellow <5%, red ≥10%) |

### Distribution (Middle Row)

| Panel | Shows |
|-------|-------|
| **Logs by Service** | Pie chart: Docker service distribution |
| **Logs by Component** | Pie chart: OpenCloud component distribution |
| **Top Components by Errors** | Components ranked by error count |
| **Log Volume by Component** | Component activity over time |

### Detailed Logs (Bottom)

| Panel | Shows |
|-------|-------|
| **Logs** | Live log stream with full JSON details |

---

## Common Tasks

### Find errors in a specific component

1. Set **Component** filter (e.g., `graph`)
2. Set **Log Level** to `error`
3. Review **Log Volume by Level** for timing
4. Check **Logs** panel for details

### Debug a user issue

1. Enter username or email in **Search** filter
2. Set **Log Level** to `error` and `warn`
3. Check **Top Components by Errors** for affected components
4. Review **Logs** for the sequence of events

### Monitor system health

1. Keep all filters at default (All)
2. Watch **Error Count** and **Error Rate**
3. Check **Top Components by Errors** for problem areas
4. Investigate spikes in **Log Volume by Level**

### Compare component activity

1. Select multiple components in **Component** filter
2. Review **Logs by Component** pie chart for distribution
3. Check **Log Volume by Component** for patterns over time

### Search for specific errors

1. Enter error message pattern in **Search** filter
2. Set **Log Level** to `error`
3. Review matching logs in **Logs** panel
4. Click entries to expand full JSON

### Debug activitylog issues

1. Set **Component** to `activitylog`
2. Set **Log Level** to `error` and `warn`
3. → For deep dive: [Activitylog Debug](activitylog.md)

---

## Troubleshooting

### No data displayed

- Check if OpenCloud containers are running
- Verify Loki is receiving logs from Alloy
- Try setting all filters to "All"

### Component filter shows no matches

- Components are extracted from JSON field `service`
- Verify OpenCloud logs include this field
- Check **Logs by Component** to see available components

### Search not finding expected results

- Search is case-insensitive regex
- Try simpler patterns
- Check if the text appears in the JSON log structure

### Too many logs displayed

- Narrow time range
- Add component or level filters
- Use search to filter by text

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Overview](opencloud-overview.md) | Prometheus | Quick health check (start here) |
| [Proxy](opencloud-proxy.md) | Loki | HTTP access logs, request analysis |
| [Uploads](opencloud-uploads.md) | Prometheus | File upload pipeline |
| [Activitylog Debug](activitylog.md) | Loki | Activity feed debugging |
