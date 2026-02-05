/**
 * OpenCloud Overview Dashboard
 * Quick health check — request rate, error rate, latency, transfers.
 * @see docs/dashboards/opencloud-overview.md
 */
import { DashboardBuilder, FieldColorBuilder, FieldColorModeId } from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as GaugeBuilder } from '@grafana/grafana-foundation-sdk/gauge';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  GraphDrawStyle,
  LegendDisplayMode,
  LegendPlacement,
  ReduceDataOptionsBuilder,
  StackingConfigBuilder,
  StackingMode,
  TooltipDisplayMode,
  SortOrder,
  VisibilityMode,
  VizLegendOptionsBuilder,
  VizTooltipOptionsBuilder,
} from '@grafana/grafana-foundation-sdk/common';
import {
  PROMETHEUS_DS,
  promQuery,
  greenYellowRed,
  singleColor,
  colorOverride,
  resetRefId,
} from './shared.js';

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud Overview')
  .uid('opencloud-overview')
  .description('Quick health check for OpenCloud. Shows key metrics at a glance: request rate, error rate, latency, and active transfers.')
  .tags(['opencloud', 'overview'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })

  // ── Row 1: Stat panels ─────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(10)
      .title('Requests/s')
      .description('HTTP requests per second at the OpenCloud proxy. Measures current system load. Normal: 1-50 req/s for small teams. Yellow >100, Red >500 indicates high load or possible attack.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 6, x: 0, y: 0 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_requests_total[5m]))', 'Requests/s'))
      .unit('reqps')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(100, 500))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  .withPanel((() => {
    resetRefId();
    return new GaugeBuilder()
      .id(20)
      .title('Error Rate')
      .description('Percentage of failed requests (5xx errors, timeouts). Green <1% is normal. Yellow 1-5% indicates issues. Red >5% requires immediate investigation - check logs in Loki dashboard.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 6, x: 6, y: 0 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_errors_total[5m])) / sum(rate(opencloud_proxy_requests_total[5m])) * 100', 'Error %'))
      .unit('percent')
      .min(0)
      .max(10)
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(1, 5))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .showThresholdLabels(false)
      .showThresholdMarkers(true);
  })())

  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(30)
      .title('P95 Latency')
      .description('95% of all requests complete faster than this value. Reflects user experience for most users. Green <500ms is good. Yellow 0.5-2s is acceptable. Red >2s means noticeable delays for users.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 6, x: 12, y: 0 })
      .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P95'))
      .unit('s')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(0.5, 2))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(40)
      .title('Goroutines')
      .description('Number of active goroutines in the OpenCloud process. Normal: 500-1500. Steadily increasing value without decline may indicate a goroutine leak. Yellow >2000, Red >5000 requires investigation.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 6, x: 18, y: 0 })
      .withTarget(promQuery('sum(go_goroutines{job="opencloud"})', 'Goroutines'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(2000, 5000))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // ── Request Rate & Errors ──────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(50)
      .title('Request Rate & Errors')
      .description('Correlation between load and errors over time. Green line = requests (left axis), red line = errors (right axis). Do errors rise proportionally with requests? System is overloaded. Errors without request spike indicate other problems.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 4 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_requests_total[5m]))', 'Requests/s'))
      .withTarget(promQuery('sum(rate(opencloud_proxy_errors_total[5m]))', 'Errors/s'))
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(2)
      .fillOpacity(10)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride({
        matcher: { id: 'byName', options: 'Errors/s' },
        properties: [
          { id: 'color', value: { fixedColor: 'red', mode: 'fixed' } },
          { id: 'custom.axisPlacement', value: 'right' },
          { id: 'custom.fillOpacity', value: 0 },
          { id: 'custom.lineWidth', value: 2 },
        ],
      })
      .withOverride(colorOverride('Requests/s', 'green'));
  })())

  // ── Latency Percentiles ────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(60)
      .title('Latency Percentiles')
      .description('Response times by percentile: P50 (median, green) = typical user. P95 (yellow) = slow requests. P99 (red) = worst case. Large gap between P50 and P99 indicates outliers - check Request Details dashboard.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 12, x: 0, y: 12 })
      .withTarget(promQuery('histogram_quantile(0.50, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P50'))
      .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P95'))
      .withTarget(promQuery('histogram_quantile(0.99, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P99'))
      .unit('s')
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(2)
      .fillOpacity(0)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride(colorOverride('P50', 'green'))
      .withOverride(colorOverride('P95', 'yellow'))
      .withOverride(colorOverride('P99', 'red'));
  })())

  // ── Active Transfers ───────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(70)
      .title('Active Transfers')
      .description('Active file transfers: Uploads (blue), Downloads (purple), Processing (orange). Processing = files being processed after upload (antivirus, indexing). High processing values may indicate slow ClamAV.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 12, x: 12, y: 12 })
      .withTarget(promQuery('sum(reva_upload_active)', 'Uploads'))
      .withTarget(promQuery('sum(reva_download_active)', 'Downloads'))
      .withTarget(promQuery('sum(reva_upload_processing)', 'Processing'))
      .unit('short')
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(2)
      .fillOpacity(20)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride(colorOverride('Uploads', 'blue'))
      .withOverride(colorOverride('Downloads', 'purple'))
      .withOverride(colorOverride('Processing', 'orange'));
  })())

  // ── Upload Pipeline ────────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(80)
      .title('Upload Pipeline')
      .description('Upload lifecycle per minute: Initiated → Transfer Complete → Scanned (antivirus) → Finalized or Aborted. Gap between stages shows drop-off. Many Aborted = problem with uploads or antivirus.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 16, x: 0, y: 20 })
      .withTarget(promQuery('sum(rate(reva_upload_sessions_initiated[5m])) * 60', 'Initiated'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_scanned[5m])) * 60', 'Scanned'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_finalized[5m])) * 60', 'Finalized'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_aborted[5m])) * 60', 'Aborted'))
      .unit('short')
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(1)
      .fillOpacity(30)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride(colorOverride('Initiated', 'blue'))
      .withOverride(colorOverride('Scanned', 'yellow'))
      .withOverride(colorOverride('Finalized', 'green'))
      .withOverride(colorOverride('Aborted', 'red'));
  })())

  // ── Event Queues ───────────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(90)
      .title('Event Queues')
      .description('Async processing queues. Postprocessing = upload post-processing (antivirus, thumbnails). Search = search index updates. Values >0 are normal during activity but should not keep increasing. Yellow >10, Red >100 = backlog building up.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 8, x: 16, y: 20 })
      .withTarget(promQuery('sum(opencloud_postprocessing_events_unprocessed)', 'Postprocessing'))
      .withTarget(promQuery('sum(opencloud_search_events_unprocessed)', 'Search'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(10, 100))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .textMode(BigValueTextMode.Auto);
  })())

  // ── Memory Usage ───────────────────────────────────────────────────

  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(100)
      .title('Memory Usage')
      .description('Heap memory usage of OpenCloud process. Normal: 50-200 MB. Yellow >512 MB, Red >1 GB. Steadily increasing value without decline after GC indicates memory leak. If issues persist: restart container.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 8, x: 16, y: 24 })
      .withTarget(promQuery('sum(go_memstats_heap_alloc_bytes{job="opencloud"})', 'Heap'))
      .unit('bytes')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(536870912, 1073741824))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })());

console.log(JSON.stringify(dashboard.build(), null, 2));
