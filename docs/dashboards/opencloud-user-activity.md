# OpenCloud User Activity

User activity tracking: authentication events, audit trail, and detailed logs.

| | |
|---|---|
| **UID** | `opencloud-user-activity` |
| **Datasource** | Loki |
| **Refresh** | auto |

## When to Use

- Investigate login issues or suspicious authentication attempts
- Audit user actions (file operations, sharing, space management)
- Track specific user activity by email, UUID, or filename
- Review self-service events (profile updates, password changes)

**Not for:** System-wide error investigation → use [Logs](opencloud-logs.md) instead

**Start from:** [Overview](opencloud-overview.md) for quick health check

---

## Data Requirements

### Log Stream

```logql
{service="opencloud"} | json | service_extracted=~"proxy|idm|idp|audit"
```

### Required Services

| Service | Description |
|---------|-------------|
| `proxy` | HTTP access logs (login endpoints, self-service) |
| `idm` / `idp` | Identity management (failed logins) |
| `audit` | Audit events (file, share, space, user actions) |

---

## Filters

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| **Search** | Text | (empty) | Case-insensitive filter by email, UUID, or filename |
| **Audit Action** | Multi-select | All | Filter audit events by action type |

### Search Examples

```
user@example.com        # Activity for specific user
report.pdf              # Operations on specific file
space-uuid              # Space-related activity
```

### Audit Action Types

| Category | Actions |
|----------|---------|
| **Files** | `file_read`, `file_create`, `file_delete`, `file_rename`, `file_trash`, `file_version` |
| **Sharing** | `share_created`, `share_removed`, `share_updated` |
| **Spaces** | `space_created`, `space_deleted`, `space_disabled`, `space_enabled`, `space_shared`, `space_unshared` |
| **Users** | `user_created`, `user_deleted`, `user_feature_changed` |
| **Groups** | `group_member_added`, `group_member_removed` |
| **Containers** | `container_created`, `container_deleted` |

---

## Panels

### Authentication Row

| Panel | Shows |
|-------|-------|
| **Login Attempts** | HTTP requests to login endpoint, grouped by status code. Stacked bars: green=2xx, red=4xx |
| **Failed Logins** | IDM/IDP log entries for invalid credentials with username and source IP |
| **Self-Service Events** | User self-service requests on `/graph/v1.0/me` endpoints |

### Audit Activity Row

| Panel | Shows |
|-------|-------|
| **Audit Events over Time** | Stacked bar chart of audit events by action type |
| **Action Distribution** | Pie chart showing proportion of each action type |
| **Last Audit Events** | Table of top 50 recent audit events with action, message, and count |
| **Raw Audit Logs** | Full audit log stream with JSON details |

### Detailed Logs Row

| Panel | Shows |
|-------|-------|
| **All OpenCloud Logs** | Unfiltered logs, only filtered by Search variable. Use for correlation |

---

## Common Tasks

### Investigate failed logins

1. Check **Login Attempts** for 4xx spikes
2. Review **Failed Logins** for usernames and source IPs
3. Use **Search** filter with the username to see broader activity

### Audit user file activity

1. Enter user email in **Search** filter
2. Set **Audit Action** to file-related actions (`file_read`, `file_create`, etc.)
3. Review **Audit Events over Time** for patterns
4. Check **Last Audit Events** table for details

### Investigate sharing activity

1. Set **Audit Action** to `share_created`, `share_removed`, `share_updated`
2. Enter user or resource name in **Search** filter
3. Review **Raw Audit Logs** for full event details

### Correlate user activity with system logs

1. Enter user identifier in **Search** filter
2. Scroll to **All OpenCloud Logs** for full context
3. Cross-reference timestamps with other dashboards
4. → For HTTP details: [Proxy](opencloud-proxy.md)

---

## Troubleshooting

### No audit events displayed

- Verify `audit` service is enabled in OpenCloud (`START_ADDITIONAL_SERVICES` includes `audit`)
- Check if Loki is receiving logs from Alloy
- Try removing all filters

### Login attempts show no data

- Proxy access logs must include `/signin/v1/identifier/_/logon` endpoint
- Check if OpenCloud proxy logs are being collected

### Search not finding expected results

- Search is case-insensitive regex across all log fields
- Try simpler patterns (email address, filename without path)

---

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Overview](opencloud-overview.md) | Prometheus | Quick health check (start here) |
| [Logs](opencloud-logs.md) | Loki | System-wide log analysis |
| [Proxy](opencloud-proxy.md) | Loki | HTTP access log analysis |
| [Activitylog Debug](activitylog.md) | Loki | Activity feed debugging |
