# OpenCloud PLG Dashboards

Grafana dashboards for monitoring OpenCloud with the PLG stack (Prometheus + Loki + Grafana).

## Dashboards

| Dashboard | UID | Description | Docs |
|-----------|-----|-------------|------|
| **OpenCloud Logs** | `opencloud-logs` | Service/Component/Level filter, error tracking | [📖](grafana/provisioning/dashboards/opencloud-logs.md) |
| **OpenCloud Proxy** | `opencloud-proxy` | HTTP access logs, request analysis | [📖](grafana/provisioning/dashboards/opencloud-proxy.md) |
| OpenCloud Overview | `opencloud-overview` | Quick health check: requests, errors, latency | [📖](grafana/provisioning/dashboards/opencloud-overview.md) |
| OpenCloud Uploads | `opencloud-uploads` | File uploads, antivirus scanning, processing | [📖](grafana/provisioning/dashboards/opencloud-uploads.md) |
| OpenCloud Requests | `opencloud-requests` | Performance analysis, latency heatmap | [📖](grafana/provisioning/dashboards/opencloud-requests.md) |
| Activitylog Debug | `activitylog-debug` | Event debugging | [📖](grafana/provisioning/dashboards/activitylog.md) |

## Structure

```
grafana/
└── provisioning/
    ├── dashboards/
    │   ├── dashboards.yml       # Provisioning config
    │   ├── opencloud-logs.json
    │   ├── opencloud-proxy.json
    │   ├── opencloud-overview.json
    │   ├── opencloud-uploads.json
    │   ├── opencloud-requests.json
    │   └── activitylog.json
    └── datasources/
        └── datasources.yml      # Prometheus + Loki
```

## Usage

These dashboards are designed for use with:
- **OpenCloud** metrics (Prometheus)
- **OpenCloud** logs (Loki via Grafana Alloy)

### Requirements

- Grafana 10.x or 11.x
- Prometheus datasource (UID: `prometheus`)
- Loki datasource (UID: `loki`)

### Installation

Copy the `grafana/provisioning/` folder to your Grafana provisioning directory.

Or import dashboards manually via Grafana UI → Dashboards → Import → Upload JSON.

## Related

- [OpenCloud](https://github.com/opencloud-eu/opencloud) - The cloud platform
- [OpenCloud Compose](https://github.com/opencloud-eu/opencloud-compose) - Docker Compose deployment

## License

MIT
