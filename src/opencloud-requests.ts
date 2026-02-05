import {
  DashboardBuilder,
  RowBuilder,
  FieldColorBuilder,
  FieldColorModeId,
} from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as HeatmapBuilder } from '@grafana/grafana-foundation-sdk/heatmap';
import { PanelBuilder as BarGaugeBuilder } from '@grafana/grafana-foundation-sdk/bargauge';
import {
  HeatmapColorMode,
  HeatmapColorScale,
  HeatmapColorOptionsBuilder,
  FilterValueRangeBuilder,
  RowsHeatmapOptionsBuilder,
  YAxisConfigBuilder,
} from '@grafana/grafana-foundation-sdk/heatmap';
import {
  AxisPlacement,
  BarGaugeDisplayMode,
  BigValueColorMode,
  BigValueGraphMode,
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
  VizOrientation,
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

const dashboard = new DashboardBuilder('OpenCloud Request Details')
  .uid('opencloud-requests')
  .description('Performance analysis dashboard. Use this to investigate latency issues, identify slow services, and correlate load with resource usage. Start here when users report slowness.')
  .tags(['opencloud', 'requests', 'performance'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })

  // ── Row: Key Indicators ────────────────────────────────────────────
  .withRow(new RowBuilder('Key Indicators').id(100).gridPos({ h: 1, w: 24, x: 0, y: 0 }))

  // Total Requests/s
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(110)
      .title('Total Requests/s')
      .description('Total HTTP requests per second across all services. Baseline for understanding current load. Compare with historical values to identify traffic patterns or anomalies.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 0, y: 1 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_requests_total[5m]))', 'Total'))
      .unit('reqps')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('green'))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Error Rate
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(120)
      .title('Error Rate')
      .description('Percentage of failed requests. Should be <1% under normal conditions. Spikes here warrant immediate investigation in Loki logs.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 4, y: 1 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_errors_total[5m])) / sum(rate(opencloud_proxy_requests_total[5m])) * 100', 'Error %'))
      .unit('percent')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(1, 5))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // P50 Latency
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(130)
      .title('P50 Latency')
      .description('Median response time - what the typical user experiences. Should be <100ms for snappy UI. Higher values indicate general slowness affecting everyone.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 8, y: 1 })
      .withTarget(promQuery('histogram_quantile(0.50, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P50'))
      .unit('s')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(0.1, 0.5))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // P95 Latency
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(140)
      .title('P95 Latency')
      .description('95th percentile - slow requests affecting 5% of users. Gap between P50 and P95 shows consistency. Large gap = some requests are much slower than others.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 12, y: 1 })
      .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P95'))
      .unit('s')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(0.5, 2))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // P99 Latency
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(150)
      .title('P99 Latency')
      .description('99th percentile - worst case for almost all users. Very high P99 with normal P50 indicates occasional slow operations (large file ops, complex searches, or resource contention).')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 16, y: 1 })
      .withTarget(promQuery('histogram_quantile(0.99, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P99'))
      .unit('s')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(1, 5))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Errors/s
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(160)
      .title('Errors/s')
      .description('Absolute error count per second. More useful than % when traffic is low. Even 1 error/s during low traffic periods could be 50% error rate.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 20, y: 1 })
      .withTarget(promQuery('sum(rate(opencloud_proxy_errors_total[5m]))', 'Errors'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(1, 10))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // ── Row: Latency Analysis ──────────────────────────────────────────
  .withRow(new RowBuilder('Latency Analysis').id(200).gridPos({ h: 1, w: 24, x: 0, y: 5 }))

  // Latency Heatmap
  .withPanel((() => {
    resetRefId();
    return new HeatmapBuilder()
      .id(210)
      .title('Latency Heatmap')
      .description('Latency distribution visualization. Darker colors = more requests at that latency. Look for: consistent band (good), spreading pattern (degradation), bimodal distribution (two different request types). Hover for exact counts.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 6 })
      .withTarget((() => {
        const q = promQuery('sum(increase(opencloud_proxy_duration_seconds_bucket[1m])) by (le)', '{{le}}');
        q.format('heatmap' as any);
        return q;
      })())
      .calculate(false)
      .cellGap(1)
      .color(
        new HeatmapColorOptionsBuilder()
          .mode(HeatmapColorMode.Scheme)
          .scheme('Oranges')
          .fill('dark-orange')
          .scale(HeatmapColorScale.Exponential)
          .exponent(0.5)
          .steps(64)
          .reverse(false),
      )
      .filterValues(new FilterValueRangeBuilder().le(1e-9))
      .rowsFrame(new RowsHeatmapOptionsBuilder().layout('auto' as any))
      .showLegend()
      .mode(TooltipDisplayMode.Single)
      .showYHistogram()
      .yAxis(
        new YAxisConfigBuilder()
          .unit('s')
          .axisPlacement(AxisPlacement.Left)
          .reverse(false),
      )
      .exemplarsColor('rgba(255,0,255,0.7)');
  })())

  // Latency Percentiles Over Time
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(220)
      .title('Latency Percentiles Over Time')
      .description('Track how latency changes over time. Parallel lines = consistent performance. Diverging lines = some requests getting slower. Sudden jumps correlate with deployments, traffic spikes, or external issues.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 12, x: 0, y: 14 })
      .withTarget(promQuery('histogram_quantile(0.50, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P50'))
      .withTarget(promQuery('histogram_quantile(0.90, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P90'))
      .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P95'))
      .withTarget(promQuery('histogram_quantile(0.99, sum(rate(opencloud_proxy_duration_seconds_bucket[5m])) by (le))', 'P99'))
      .unit('s')
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(2)
      .fillOpacity(10)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride(colorOverride('P50', 'green'))
      .withOverride(colorOverride('P90', 'yellow'))
      .withOverride(colorOverride('P95', 'orange'))
      .withOverride(colorOverride('P99', 'red'));
  })())

  // Request Rate vs Errors
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(230)
      .title('Request Rate vs Errors')
      .description('Does load cause errors? If errors spike when requests spike, system is overwhelmed. If errors spike without request spike, something else is wrong (disk full, external service down, bug).')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 12, x: 12, y: 14 })
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
        matcher: { id: 'byName', options: 'Requests/s' },
        properties: [
          { id: 'color', value: { fixedColor: 'green', mode: 'fixed' } },
          { id: 'unit', value: 'reqps' },
        ],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Errors/s' },
        properties: [
          { id: 'color', value: { fixedColor: 'red', mode: 'fixed' } },
          { id: 'custom.axisPlacement', value: 'right' },
          { id: 'unit', value: 'short' },
        ],
      });
  })())

  // ── Row: Service Breakdown (collapsed) ─────────────────────────────
  .withRow(
    new RowBuilder('Service Breakdown')
      .id(300)
      .gridPos({ h: 1, w: 24, x: 0, y: 22 })
      .collapsed(true)
      // HTTP Requests by Service
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(310)
          .title('HTTP Requests by Service')
          .description('External-facing HTTP services. Frontend = web UI/API. WebDAV = file sync clients (desktop/mobile apps). OCM = Open Cloud Mesh federation. Helps identify which interface is under load.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 12, x: 0, y: 23 })
          .withTarget(promQuery('sum(rate(opencloud_frontend_http_requests_total[5m]))', 'Frontend'))
          .withTarget(promQuery('sum(rate(ocis_ocdav_http_requests_total[5m]))', 'WebDAV'))
          .withTarget(promQuery('sum(rate(opencloud_ocm_http_requests_total[5m]))', 'OCM'))
          .withTarget(promQuery('sum(rate(opencloud_storage_system_http_requests_total[5m]))', 'Storage System'))
          .unit('reqps')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(20)
          .pointSize(5)
          .showPoints(VisibilityMode.Never)
          .stacking(new StackingConfigBuilder().mode(StackingMode.Normal))
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom));
      })())
      // gRPC Requests by Service
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(320)
          .title('gRPC Requests by Service')
          .description('Internal microservice communication. Gateway = central router. Users/Groups = identity lookups. Sharing = share operations. High traffic on one service may indicate bottleneck or inefficient queries.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 12, x: 12, y: 23 })
          .withTarget(promQuery('sum(rate(opencloud_gateway_grpc_requests_total[5m]))', 'Gateway'))
          .withTarget(promQuery('sum(rate(opencloud_users_grpc_requests_total[5m]))', 'Users'))
          .withTarget(promQuery('sum(rate(opencloud_groups_grpc_requests_total[5m]))', 'Groups'))
          .withTarget(promQuery('sum(rate(opencloud_sharing_grpc_requests_total[5m]))', 'Sharing'))
          .withTarget(promQuery('sum(rate(opencloud_storage_users_grpc_requests_total[5m]))', 'Storage Users'))
          .withTarget(promQuery('sum(rate(opencloud_auth_service_grpc_requests_total[5m]))', 'Auth Service'))
          .unit('reqps')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(20)
          .pointSize(5)
          .showPoints(VisibilityMode.Never)
          .stacking(new StackingConfigBuilder().mode(StackingMode.Normal))
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom));
      })()),
  )

  // ── Row: Endpoint Analysis (collapsed) ─────────────────────────────
  .withRow(
    new RowBuilder('Endpoint Analysis')
      .id(400)
      .gridPos({ h: 1, w: 24, x: 0, y: 23 })
      .collapsed(true)
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(410)
          .title('Microservice Latency by Endpoint')
          .description('Average latency per internal API endpoint. Shows top 10 slowest. Useful for identifying which specific operations are slow. RoleService, PermissionService calls happen on every request - keep them fast.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 24, x: 0, y: 24 })
          .withTarget(promQuery('topk(10, sum by (micro_endpoint) (rate(micro_request_duration_seconds_sum[5m])) / sum by (micro_endpoint) (rate(micro_request_duration_seconds_count[5m])))', '{{micro_endpoint}}'))
          .unit('s')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(0)
          .pointSize(5)
          .showPoints(VisibilityMode.Auto)
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right));
      })()),
  )

  // ── Row: Resource Correlation (collapsed) ──────────────────────────
  .withRow(
    new RowBuilder('Resource Correlation')
      .id(500)
      .gridPos({ h: 1, w: 24, x: 0, y: 24 })
      .collapsed(true)
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(510)
          .title('Request Rate vs Memory')
          .description('Correlation analysis for memory leaks. Memory should stay relatively stable regardless of load. If heap grows with requests and doesn\'t drop back after load decreases, investigate memory leak. Goroutines should also stay bounded.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 24, x: 0, y: 25 })
          .withTarget(promQuery('sum(rate(opencloud_proxy_requests_total[5m]))', 'Requests/s'))
          .withTarget(promQuery('sum(go_memstats_heap_alloc_bytes{job="opencloud"})', 'Heap Memory'))
          .withTarget(promQuery('sum(go_goroutines{job="opencloud"})', 'Goroutines'))
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(10)
          .pointSize(5)
          .showPoints(VisibilityMode.Never)
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
          .withOverride({
            matcher: { id: 'byName', options: 'Requests/s' },
            properties: [
              { id: 'color', value: { fixedColor: 'green', mode: 'fixed' } },
              { id: 'unit', value: 'reqps' },
            ],
          })
          .withOverride({
            matcher: { id: 'byName', options: 'Heap Memory' },
            properties: [
              { id: 'color', value: { fixedColor: 'blue', mode: 'fixed' } },
              { id: 'custom.axisPlacement', value: 'right' },
              { id: 'unit', value: 'bytes' },
            ],
          })
          .withOverride({
            matcher: { id: 'byName', options: 'Goroutines' },
            properties: [
              { id: 'color', value: { fixedColor: 'purple', mode: 'fixed' } },
              { id: 'custom.axisPlacement', value: 'right' },
              { id: 'unit', value: 'short' },
            ],
          });
      })()),
  )

  // ── Row: Service Totals (collapsed) ────────────────────────────────
  .withRow(
    new RowBuilder('Service Totals')
      .id(600)
      .gridPos({ h: 1, w: 24, x: 0, y: 25 })
      .collapsed(true)
      // Service Requests (selected range)
      .withPanel((() => {
        resetRefId();
        return new BarGaugeBuilder()
          .id(610)
          .title('Service Requests (selected range)')
          .description('Request counts for the selected time range. Shows which services were most active in your selected window. Useful for investigating specific time periods.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 6, w: 12, x: 0, y: 26 })
          .withTarget(promQuery('sum(increase(opencloud_frontend_http_requests_total[$__range]))', 'Frontend HTTP'))
          .withTarget(promQuery('sum(increase(ocis_ocdav_http_requests_total[$__range]))', 'WebDAV'))
          .withTarget(promQuery('sum(increase(opencloud_gateway_grpc_requests_total[$__range]))', 'Gateway gRPC'))
          .withTarget(promQuery('sum(increase(opencloud_storage_users_grpc_requests_total[$__range]))', 'Storage Users gRPC'))
          .withTarget(promQuery('sum(increase(opencloud_sharing_grpc_requests_total[$__range]))', 'Sharing gRPC'))
          .withTarget(promQuery('sum(increase(opencloud_users_grpc_requests_total[$__range]))', 'Users gRPC'))
          .unit('short')
          .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
          .orientation(VizOrientation.Horizontal)
          .displayMode(BarGaugeDisplayMode.Gradient)
          .showUnfilled(true);
      })())
      // Service Totals (since start)
      .withPanel((() => {
        resetRefId();
        return new BarGaugeBuilder()
          .id(620)
          .title('Service Totals (since start)')
          .description('Cumulative request counts since container restart. Shows overall traffic distribution over entire uptime. Useful for capacity planning and understanding service load ratios.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 6, w: 12, x: 12, y: 26 })
          .withTarget(promQuery('sum(opencloud_frontend_http_requests_total)', 'Frontend HTTP'))
          .withTarget(promQuery('sum(ocis_ocdav_http_requests_total)', 'WebDAV'))
          .withTarget(promQuery('sum(opencloud_gateway_grpc_requests_total)', 'Gateway gRPC'))
          .withTarget(promQuery('sum(opencloud_storage_users_grpc_requests_total)', 'Storage Users gRPC'))
          .withTarget(promQuery('sum(opencloud_sharing_grpc_requests_total)', 'Sharing gRPC'))
          .withTarget(promQuery('sum(opencloud_users_grpc_requests_total)', 'Users gRPC'))
          .unit('short')
          .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
          .orientation(VizOrientation.Horizontal)
          .displayMode(BarGaugeDisplayMode.Gradient)
          .showUnfilled(true);
      })()),
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
