# OpenCloud PLG Dashboards

Grafana dashboards for monitoring OpenCloud with the PLG stack (Prometheus + Loki + Grafana).

## Dashboards

| Dashboard | UID | Description |
|-----------|-----|-------------|
| **OpenCloud Logs** | `opencloud-logs` | Service/Component/Level filter, error tracking |
| **OpenCloud Proxy** | `opencloud-proxy` | HTTP access logs, request analysis |
| OpenCloud Overview | `opencloud-overview` | Quick health check: requests, errors, latency |
| OpenCloud Uploads | `opencloud-uploads` | File uploads, antivirus scanning, processing |
| OpenCloud Requests | `opencloud-requests` | Performance analysis, latency heatmap |
| Activitylog Debug | `activitylog-debug` | Event debugging |

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
