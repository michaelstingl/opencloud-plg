/**
 * OpenCloud Proxy Dashboard
 * HTTP access log analysis for the reverse proxy.
 * @see docs/dashboards/opencloud-proxy.md
 */
import {
  DashboardBuilder,
  RowBuilder,
  CustomVariableBuilder,
  TextBoxVariableBuilder,
  FieldColorBuilder,
  FieldColorModeId,
} from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as PiechartBuilder } from '@grafana/grafana-foundation-sdk/piechart';
import { PanelBuilder as TableBuilder } from '@grafana/grafana-foundation-sdk/table';
import { PanelBuilder as LogsBuilder } from '@grafana/grafana-foundation-sdk/logs';
import { PieChartType, PieChartLegendOptionsBuilder, PieChartLegendValues } from '@grafana/grafana-foundation-sdk/piechart';
import {
  BigValueColorMode,
  BigValueGraphMode,
  GraphDrawStyle,
  LegendDisplayMode,
  LegendPlacement,
  LogsDedupStrategy,
  LogsSortOrder,
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
  LOKI_DS,
  lokiQuery,
  lokiInstantQuery,
  greenYellowOrangeRed,
  singleColor,
  greenRed,
  greenYellowOrange,
  colorOverride,
  regexpColorOverride,
  resetRefId,
} from './shared.js';

// ── Variables ────────────────────────────────────────────────────────

const varMethod = new CustomVariableBuilder('method')
  .label('HTTP Method')
  .values('GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS,PROPFIND,PROPPATCH,MKCOL,COPY,MOVE,LOCK,UNLOCK,REPORT')
  .multi(true)
  .includeAll(true)
  .allValue('.+')
  .current({ text: 'GET', value: 'GET' });

const varStatusFilter = new CustomVariableBuilder('status_filter')
  .label('Status')
  .values('All : .+,2xx : 2..,3xx : 3..,4xx : 4..,5xx : 5..')
  .multi(false)
  .includeAll(false)
  .current({ text: 'All', value: '.+' });

const varPath = new TextBoxVariableBuilder('path')
  .label('Path (regex)')
  .current({ selected: false, text: '.*', value: '.*' });

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud Proxy - HTTP Access Logs')
  .uid('opencloud-proxy')
  .description('HTTP access log analysis for the OpenCloud proxy component with request metrics, error tracking, and path analysis')
  .tags(['opencloud', 'proxy', 'http', 'access-logs'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })
  .withVariable(varMethod)
  .withVariable(varStatusFilter)
  .withVariable(varPath)

  // ── Row: Overview ──────────────────────────────────────────────────
  .withRow(new RowBuilder('Overview').id(100).gridPos({ h: 1, w: 24, x: 0, y: 0 }))

  // Total Requests
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(110)
      .title('Total Requests')
      .description('Total HTTP requests in selected time range')
      .datasource(LOKI_DS)
      .gridPos({ h: 4, w: 8, x: 0, y: 1 })
      .withTarget(lokiQuery('sum(count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__range]))'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('blue'))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Error Rate
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(120)
      .title('Error Rate')
      .description('Percentage of 4xx/5xx responses')
      .datasource(LOKI_DS)
      .gridPos({ h: 4, w: 8, x: 8, y: 1 })
      .withTarget(lokiQuery('sum(count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"[45].." [$__range])) / sum(count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" [$__range])) * 100'))
      .unit('percent')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowOrangeRed(1, 5, 10))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']).fields('').values(false));
  })())

  // Request Rate
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(130)
      .title('Request Rate')
      .description('Requests per second')
      .datasource(LOKI_DS)
      .gridPos({ h: 4, w: 8, x: 16, y: 1 })
      .withTarget(lokiQuery('sum(rate({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__auto]))'))
      .unit('reqps')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('green'))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['mean']).fields('').values(false));
  })())

  // ── Row: Traffic Analysis ──────────────────────────────────────────
  .withRow(new RowBuilder('Traffic Analysis').id(200).gridPos({ h: 1, w: 24, x: 0, y: 5 }))

  // Requests Over Time by Status
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(210)
      .title('Requests Over Time by Status')
      .description('Request volume grouped by HTTP status code')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 6 })
      .withTarget(lokiQuery(
        'sum by (status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__auto]))',
        '{{status}}',
      ))
      .drawStyle(GraphDrawStyle.Bars)
      .fillOpacity(80)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(1)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .unit('short')
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right).showLegend(true).calcs(['sum']))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .withOverride(regexpColorOverride('2..', 'green'))
      .withOverride(regexpColorOverride('3..', 'blue'))
      .withOverride(regexpColorOverride('4..', 'orange'))
      .withOverride(regexpColorOverride('5..', 'red'));
  })())

  // ── Row: Top Lists ─────────────────────────────────────────────────
  .withRow(new RowBuilder('Top Lists').id(300).gridPos({ h: 1, w: 24, x: 0, y: 14 }))

  // Top 10 Paths
  .withPanel((() => {
    resetRefId();
    return new TableBuilder()
      .id(310)
      .title('Top 10 Paths')
      .description('Most frequently accessed paths')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 12, x: 0, y: 15 })
      .withTarget(lokiInstantQuery(
        'topk(10, sum by (uri) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | __error__="" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__range])))',
        '',
      ))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('green'))
      .withTransformation({ id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } })
      .withOverride({
        matcher: { id: 'byName', options: 'Time' },
        properties: [{ id: 'custom.hidden', value: true }],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'uri' },
        properties: [
          { id: 'custom.width', value: 350 },
          { id: 'displayName', value: 'Path' },
        ],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Value' },
        properties: [{ id: 'displayName', value: 'Requests' }],
      });
  })())

  // Top 10 Client IPs
  .withPanel((() => {
    resetRefId();
    return new TableBuilder()
      .id(320)
      .title('Top 10 Client IPs')
      .description('Most active client IP addresses')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 12, x: 12, y: 15 })
      .withTarget(lokiInstantQuery(
        'topk(10, sum by (remote_addr) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__range])))',
        '',
      ))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('green'))
      .withTransformation({ id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } })
      .withOverride({
        matcher: { id: 'byName', options: 'Time' },
        properties: [{ id: 'custom.hidden', value: true }],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'remote_addr' },
        properties: [
          { id: 'custom.width', value: 200 },
          { id: 'displayName', value: 'Client IP' },
        ],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Value' },
        properties: [{ id: 'displayName', value: 'Requests' }],
      });
  })())

  // ── Row: HTTP Methods ──────────────────────────────────────────────
  .withRow(new RowBuilder('HTTP Methods').id(400).gridPos({ h: 1, w: 24, x: 0, y: 23 }))

  // Requests by Method (piechart)
  .withPanel((() => {
    resetRefId();
    return new PiechartBuilder()
      .id(410)
      .title('Requests by Method')
      .description('Distribution of HTTP methods')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 8, x: 0, y: 24 })
      .withTarget(lokiQuery(
        'sum by (method) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__range]))',
        '{{method}}',
      ))
      .pieType(PieChartType.Pie)
      .legend(new PieChartLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right).showLegend(true).values([PieChartLegendValues.Value, PieChartLegendValues.Percent]).calcs([]))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Method Distribution Over Time
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(420)
      .title('Method Distribution Over Time')
      .description('HTTP methods over time')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 16, x: 8, y: 24 })
      .withTarget(lokiQuery(
        'sum by (method) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter" [$__auto]))',
        '{{method}}',
      ))
      .drawStyle(GraphDrawStyle.Line)
      .fillOpacity(20)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(2)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .unit('short')
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom).showLegend(true))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending));
  })())

  // ── Row: Error Analysis ────────────────────────────────────────────
  .withRow(new RowBuilder('Error Analysis').id(500).gridPos({ h: 1, w: 24, x: 0, y: 30 }))

  // 4xx Client Errors
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(510)
      .title('4xx Client Errors')
      .description('Client errors (400-499) over time')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 12, x: 0, y: 31 })
      .withTarget(lokiQuery(
        'sum by (status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"4.." [$__auto]))',
        '{{status}}',
      ))
      .drawStyle(GraphDrawStyle.Bars)
      .fillOpacity(80)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(1)
      .unit('short')
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right).showLegend(true).calcs(['sum']))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .withOverride(regexpColorOverride('40[0134]', 'orange'))
      .withOverride(regexpColorOverride('4(0[5-9]|[1-9].)', 'yellow'));
  })())

  // 5xx Server Errors
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(520)
      .title('5xx Server Errors')
      .description('Server errors (500-599) over time - investigate immediately!')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 12, x: 12, y: 31 })
      .withTarget(lokiQuery(
        'sum by (status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"5.." [$__auto]))',
        '{{status}}',
      ))
      .drawStyle(GraphDrawStyle.Bars)
      .fillOpacity(80)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(1)
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Fixed).fixedColor('red'))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right).showLegend(true).calcs(['sum']))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending));
  })())

  // Top Error Paths (4xx)
  .withPanel((() => {
    resetRefId();
    return new TableBuilder()
      .id(530)
      .title('Top Error Paths (4xx)')
      .description('Paths with most client errors')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 12, x: 0, y: 37 })
      .withTarget(lokiInstantQuery(
        'topk(20, sum by (uri, status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | status=~"4.." [$__range])))',
        '{{uri}} ({{status}})',
      ))
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowOrange(10, 50))
      .withTransformation({ id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } })
      .withOverride({
        matcher: { id: 'byName', options: 'uri' },
        properties: [{ id: 'custom.width', value: 400 }],
      });
  })())

  // Top Error Paths (5xx)
  .withPanel((() => {
    resetRefId();
    return new TableBuilder()
      .id(540)
      .title('Top Error Paths (5xx)')
      .description('Paths with most server errors - high priority!')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 12, x: 12, y: 37 })
      .withTarget(lokiInstantQuery(
        'topk(20, sum by (uri, status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | status=~"5.." [$__range])))',
        '{{uri}} ({{status}})',
      ))
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenRed(1))
      .withTransformation({ id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } })
      .withOverride({
        matcher: { id: 'byName', options: 'uri' },
        properties: [{ id: 'custom.width', value: 400 }],
      });
  })())

  // ── Row: Detailed Logs ─────────────────────────────────────────────
  .withRow(new RowBuilder('Detailed Logs').id(600).gridPos({ h: 1, w: 24, x: 0, y: 43 }))

  // Access Logs
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(610)
      .title('Access Logs')
      .description('HTTP access logs from proxy component')
      .datasource(LOKI_DS)
      .gridPos({ h: 10, w: 24, x: 0, y: 44 })
      .withTarget(lokiQuery('{service="opencloud"} | json | service_extracted="proxy" | method=~"$method" | uri=~"$path" | status=~"$status_filter"'))
      .dedupStrategy(LogsDedupStrategy.None)
      .enableLogDetails(true)
      .prettifyLogMessage(true)
      .showCommonLabels(false)
      .showLabels(true)
      .showTime(true)
      .sortOrder(LogsSortOrder.Descending)
      .wrapLogMessage(true);
  })());

console.log(JSON.stringify(dashboard.build(), null, 2));
