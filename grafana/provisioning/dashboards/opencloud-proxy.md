# OpenCloud Proxy

HTTP access log analysis for the OpenCloud reverse proxy.

| | |
|---|---|
| **UID** | `opencloud-proxy` |
| **Datasource** | Loki |
| **Refresh** | auto |

## When to Use

- Analyze HTTP traffic patterns and request volumes
- Debug specific API calls or endpoints
- Track down client/server errors (4xx/5xx)
- Identify top paths, heavy clients, or suspicious IPs
- Monitor request rates and error percentages

**Not for:** Application-level debugging → use [Logs](opencloud-logs.md) instead

**Start from:** [Overview](opencloud-overview.md) for quick health check

---

## Data Requirements

### Log Stream

```logql
{service="opencloud"} | json | service_extracted="proxy"
```

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| `method` | HTTP method | `GET`, `PROPFIND` |
| `uri` | Request path | `/dav/files/admin/Documents/` |
| `status` | HTTP status code | `200`, `404`, `503` |
| `remote_addr` | Client IP | `192.168.1.100` |

---

## Filters

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| **Method** | Multi-select | GET | HTTP methods including WebDAV (PROPFIND, MKCOL, etc.) |
| **Status** | Dropdown | All | Status class: All, 2xx, 3xx, 4xx, 5xx |
| **Path** | Text (regex) | `.*` | Filter paths by regex pattern |

### Path Filter Examples

```
.*                      # All paths
/dav/.*                 # WebDAV requests
/graph/v1.0/.*          # Graph API
/ocs/v[12]/.*           # OCS API
/dav/files/admin/.*     # Specific user
.*\.(pdf|docx|xlsx)     # Specific file types
```

---

## Panels

### Overview

| Panel | Shows |
|-------|-------|
| **Total Requests** | Request count in time range |
| **Error Rate** | % of 4xx/5xx responses (green <1%, yellow <5%, red ≥10%) |
| **Request Rate** | Requests per second |

### Traffic Analysis

| Panel | Shows |
|-------|-------|
| **Requests Over Time** | Stacked bars by status code (green=2xx, blue=3xx, orange=4xx, red=5xx) |

### Top Lists

| Panel | Shows |
|-------|-------|
| **Top 10 Paths** | Most requested URIs |
| **Top 10 Client IPs** | Most active clients |

### HTTP Methods

| Panel | Shows |
|-------|-------|
| **Requests by Method** | Pie chart of method distribution |
| **Method Distribution** | Methods over time |

### Error Analysis

| Panel | Shows |
|-------|-------|
| **4xx Client Errors** | Client errors over time |
| **5xx Server Errors** | Server errors over time |
| **Top Error Paths (4xx)** | Paths with most client errors |
| **Top Error Paths (5xx)** | Paths with most server errors |

### Detailed Logs

| Panel | Shows |
|-------|-------|
| **Access Logs** | Raw log stream with all fields |

---

## Common Tasks

### Debug a failing endpoint

1. Enter path in **Path** filter (e.g., `/graph/v1.0/me`)
2. Set **Status** to `4xx` or `5xx`
3. Check **Top Error Paths** for error patterns
4. Review **Access Logs** for specific requests
5. → For application errors: [Logs](opencloud-logs.md)

### Find heavy clients

1. Check **Top 10 Client IPs**
2. Note suspicious IPs with unusually high counts
3. Filter **Path** to see what they're accessing
4. Check **Access Logs** for user agent and patterns

### Monitor error spikes

1. Watch **Error Rate** gauge
2. Check **Requests Over Time** for spike timing
3. Look at **4xx/5xx** charts to identify which status codes
4. Review **Top Error Paths** to find affected endpoints

### Analyze WebDAV traffic

1. Set **Method** filter to WebDAV methods (PROPFIND, PROPPATCH, MKCOL, etc.)
2. Review **Requests by Method** distribution
3. Check **Top 10 Paths** for WebDAV patterns
4. → For upload issues: [Uploads](opencloud-uploads.md)

---

## Troubleshooting

### No data displayed

- Check if OpenCloud proxy logs are being collected
- Verify time range includes recent data
- Try removing all filters to see any proxy logs

### "Too many series" error

- Narrow the time range
- Add more specific filters
- Queries use `instant: true` to minimize series

### Missing fields in Top lists

- Ensure proxy logs include `uri` and `remote_addr` fields
- Check OpenCloud proxy log configuration

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Overview](opencloud-overview.md) | Prometheus | Quick health check (start here) |
| [Logs](opencloud-logs.md) | Loki | Application errors, component debugging |
| [Requests](opencloud-requests.md) | Prometheus | Performance analysis, latency |
| [Uploads](opencloud-uploads.md) | Prometheus | File upload pipeline |
