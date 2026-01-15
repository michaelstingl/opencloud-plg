# OpenCloud PLG Dashboards

Grafana dashboards for monitoring OpenCloud with the PLG stack (Prometheus + Loki + Grafana).

## Dashboards

### OpenCloud Dashboards

| Dashboard | UID | Datasource | Description | Docs |
|-----------|-----|------------|-------------|------|
| **Overview** | `opencloud-overview` | Prometheus | Quick health check (start here) | [📖](grafana/provisioning/dashboards/opencloud-overview.md) |
| **Logs** | `opencloud-logs` | Loki | Service/Component/Level filter | [📖](grafana/provisioning/dashboards/opencloud-logs.md) |
| **Proxy** | `opencloud-proxy` | Loki | HTTP access logs, traffic analysis | [📖](grafana/provisioning/dashboards/opencloud-proxy.md) |
| **Uploads** | `opencloud-uploads` | Prometheus | File uploads, antivirus, processing | [📖](grafana/provisioning/dashboards/opencloud-uploads.md) |
| **Requests** | `opencloud-requests` | Prometheus | Performance analysis, latency | [📖](grafana/provisioning/dashboards/opencloud-requests.md) |
| Activitylog Debug | `activitylog-debug` | Loki | Event debugging (for upstream issues) | [📖](grafana/provisioning/dashboards/activitylog.md) |

### External Dashboards

Downloaded from Grafana.com during deployment:

| Dashboard | UID | Source | Description | Docs |
|-----------|-----|--------|-------------|------|
| Node Exporter Full | `node-exporter-full` | [#1860](https://grafana.com/grafana/dashboards/1860) | Linux server metrics | [📖](grafana/provisioning/dashboards/node-exporter.md) |
| Prometheus Stats | `prometheus-stats` | [#3662](https://grafana.com/grafana/dashboards/3662) | Prometheus self-monitoring | [📖](grafana/provisioning/dashboards/prometheus-stats.md) |

## Dashboard Navigation

```
                    ┌─────────────────────┐
                    │  OpenCloud Overview │ ← Start here
                    │     (Prometheus)    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Requests   │     │   Uploads   │     │    Logs     │
    │ (Prometheus)│     │ (Prometheus)│     │   (Loki)    │
    └─────────────┘     └─────────────┘     └──────┬──────┘
                                                   │
                               ┌───────────────────┼───────────────────┐
                               │                   │                   │
                               ▼                   ▼                   ▼
                        ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                        │    Proxy    │     │ Activitylog │     │  (filter by │
                        │   (Loki)    │     │   (Loki)    │     │  component) │
                        └─────────────┘     └─────────────┘     └─────────────┘
```

## Structure

```
grafana/
└── provisioning/
    ├── dashboards/
    │   ├── dashboards.yml            # Provisioning config
    │   ├── opencloud-overview.json   # + .md documentation
    │   ├── opencloud-logs.json       # + .md documentation
    │   ├── opencloud-proxy.json      # + .md documentation
    │   ├── opencloud-uploads.json    # + .md documentation
    │   ├── opencloud-requests.json   # + .md documentation
    │   ├── activitylog.json          # + .md documentation
    │   ├── node-exporter.md          # Docs for external dashboard
    │   └── prometheus-stats.md       # Docs for external dashboard
    └── datasources/
        └── datasources.yml           # Prometheus + Loki
scripts/
└── process_dashboard.py              # Download & process external dashboards
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

### External Dashboard Download

External dashboards are downloaded during deployment. To manually download:

```bash
python3 scripts/process_dashboard.py
```

This downloads from Grafana.com and processes them to:
- Set stable UIDs for consistent URLs
- Remove grafana.com metadata
- Replace datasource variables
- Adapt label names for Alloy

## Related

- [OpenCloud](https://github.com/opencloud-eu/opencloud) - The cloud platform
- [OpenCloud Compose](https://github.com/opencloud-eu/opencloud-compose) - Docker Compose deployment

## License

MIT
