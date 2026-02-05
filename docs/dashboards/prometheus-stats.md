# Prometheus 2.0 Overview

Self-monitoring dashboard for Prometheus itself.

| | |
|---|---|
| **UID** | `prometheus-stats` |
| **Datasource** | Prometheus |
| **Source** | [Grafana.com #3662](https://grafana.com/grafana/dashboards/3662) |
| **Author** | jeremy b |
| **Revision** | 2 (latest downloaded at deploy time) |

## About

This is an **external dashboard** downloaded from Grafana.com during deployment. It is not maintained in this repository.

During deployment, the dashboard JSON is downloaded and processed to:
- Set a stable UID (`prometheus-stats`) for consistent URLs
- Remove grafana.com metadata (`__inputs`, `__requires`)
- Replace datasource variables (`${DS_PROMETHEUS}` → `prometheus`)
- Adapt label names (`container_name` → `container`) for Alloy

## When to Use

- Monitor Prometheus health and performance
- Check scrape target status
- Investigate query performance issues
- Verify data ingestion rates

**Not for:** Server metrics → use [Node Exporter](node-exporter.md) instead

## Key Panels

| Category | Metrics |
|----------|---------|
| **Targets** | Scrape duration, up/down status |
| **Storage** | TSDB size, chunks, samples |
| **Queries** | Query duration, active queries |
| **Ingestion** | Samples ingested per second |

## Data Requirements

Prometheus exposes metrics about itself at `/metrics`. No additional configuration needed.

### Key Metrics

```promql
prometheus_tsdb_head_samples_appended_total
prometheus_target_scrape_pool_targets
prometheus_engine_query_duration_seconds
prometheus_tsdb_storage_blocks_bytes
```

## Upstream Documentation

For detailed panel descriptions, see:
- [Dashboard on Grafana.com](https://grafana.com/grafana/dashboards/3662)
- [Prometheus Docs: Monitoring](https://prometheus.io/docs/prometheus/latest/querying/api/#tsdb-stats)

## Related Dashboards

| Dashboard | Datasource | Use for |
|-----------|------------|---------|
| [Node Exporter](node-exporter.md) | Prometheus | Server system metrics |
| [Overview](opencloud-overview.md) | Prometheus | OpenCloud application health |
| [Logs](opencloud-logs.md) | Loki | Application logs |
