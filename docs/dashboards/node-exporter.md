# Node Exporter Full

Comprehensive Linux server metrics from node_exporter.

| | |
|---|---|
| **UID** | `node-exporter-full` |
| **Datasource** | Prometheus |
| **Source** | [Grafana.com #1860](https://grafana.com/grafana/dashboards/1860) |
| **Author** | rfmoz |
| **Revision** | 42 (latest downloaded at deploy time) |

## About

This is an **external dashboard** downloaded from Grafana.com during deployment. It is not maintained in this repository.

During deployment, the dashboard JSON is downloaded and processed to:
- Set a stable UID (`node-exporter-full`) for consistent URLs
- Remove grafana.com metadata (`__inputs`, `__requires`)
- Replace datasource variables (`${DS_PROMETHEUS}` → `prometheus`)
- Adapt label names (`container_name` → `container`) for Alloy

## When to Use

- Monitor server CPU, memory, disk, network
- Investigate system-level performance issues
- Check disk space and I/O patterns
- Analyze network traffic

**Not for:** OpenCloud application metrics → use [Overview](opencloud-overview.md) instead

## Key Panels

The dashboard includes comprehensive panels for:

| Category | Metrics |
|----------|---------|
| **CPU** | Usage, load average, context switches |
| **Memory** | RAM usage, swap, buffers/cache |
| **Disk** | Space, I/O, latency per device |
| **Network** | Traffic, errors, connections |
| **System** | Uptime, kernel, file descriptors |

## Data Requirements

Requires `node_exporter` running on the target host. In the PLG stack, this is included via `monitoring.yml` from opencloud-compose.

### Key Metrics

```promql
node_cpu_seconds_total
node_memory_MemTotal_bytes
node_filesystem_size_bytes
node_network_receive_bytes_total
```

## Upstream Documentation

For detailed panel descriptions and customization options, see:
- [Dashboard on Grafana.com](https://grafana.com/grafana/dashboards/1860)
- [Node Exporter GitHub](https://github.com/prometheus/node_exporter)

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Prometheus Stats](prometheus-stats.md) | Prometheus | Prometheus self-monitoring |
| [Overview](opencloud-overview.md) | Prometheus | OpenCloud application health |
| [Logs](opencloud-logs.md) | Loki | Application logs |
