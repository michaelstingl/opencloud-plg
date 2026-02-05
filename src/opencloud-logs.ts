/**
 * OpenCloud Logs Dashboard
 * Log monitoring for all services and components with flexible filtering.
 * @see docs/dashboards/opencloud-logs.md
 */
import {
  DashboardBuilder,
  RowBuilder,
  QueryVariableBuilder,
  CustomVariableBuilder,
  TextBoxVariableBuilder,
  FieldColorBuilder,
  FieldColorModeId,
  VariableRefresh,
  VariableSort,
} from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as GaugeBuilder } from '@grafana/grafana-foundation-sdk/gauge';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as PiechartBuilder } from '@grafana/grafana-foundation-sdk/piechart';
import { PanelBuilder as LogsBuilder } from '@grafana/grafana-foundation-sdk/logs';
import { PieChartType, PieChartLegendOptionsBuilder } from '@grafana/grafana-foundation-sdk/piechart';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueJustifyMode,
  BigValueTextMode,
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
  VizOrientation,
} from '@grafana/grafana-foundation-sdk/common';
import {
  LOKI_DS,
  lokiQuery,
  lokiInstantQuery,
  greenYellowRed,
  greenYellowOrangeRed,
  greenYellowOrange,
  singleColor,
  colorOverride,
  resetRefId,
} from './shared.js';

// ── Variables ────────────────────────────────────────────────────────

const varService = new QueryVariableBuilder('service')
  .label('Service')
  .datasource(LOKI_DS)
  .query('label_values(service)')
  .refresh(VariableRefresh.OnTimeRangeChanged)
  .multi(true)
  .includeAll(true)
  .allValue('.+')
  .current({ text: 'opencloud', value: 'opencloud' })
  .sort(VariableSort.AlphabeticalAsc);

const varComponent = new CustomVariableBuilder('component')
  .label('Component')
  .values('proxy,storage-system,storage-users,storage-shares,storage-publiclink,auth-service,auth-app,auth-basic,auth-machine,frontend,gateway,graph,groups,users,idm,idp,nats,notifications,ocdav,ocm,postprocessing,sharing,activitylog,settings,thumbnails,app-provider,app-registry,clientlog,antivirus,search,sse,webfinger,collaboration,userlog,eventhistory,invitations,policies,audit')
  .multi(true)
  .includeAll(true)
  .allValue('.+')
  .current({ text: 'proxy', value: 'proxy' });

const varLevel = new QueryVariableBuilder('level')
  .label('Log Level')
  .datasource(LOKI_DS)
  .query('label_values(level)')
  .refresh(VariableRefresh.OnTimeRangeChanged)
  .multi(true)
  .includeAll(true)
  .allValue('.+')
  .current({ text: 'info', value: 'info' })
  .sort(VariableSort.AlphabeticalAsc);

const varSearch = new TextBoxVariableBuilder('search')
  .label('Search')
  .current({ selected: false, text: '', value: '' });

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud Logs')
  .uid('opencloud-logs')
  .description('Log monitoring for all OpenCloud services and components with flexible filtering')
  .tags(['opencloud', 'logs', 'loki'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })
  .withVariable(varService)
  .withVariable(varComponent)
  .withVariable(varLevel)
  .withVariable(varSearch)

  // ── Row: Overview ──────────────────────────────────────────────────
  .withRow(
    new RowBuilder('Overview').id(100).gridPos({ h: 1, w: 24, x: 0, y: 0 }),
  )

  // Log Volume by Level
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(110)
      .title('Log Volume by Level')
      .description('Log volume over time grouped by log level. Spikes in error/warn indicate issues.')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 16, x: 0, y: 1 })
      .withTarget(
        lokiQuery(
          'sum by (level) (count_over_time({service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__auto]))',
          '{{level}}',
        ),
      )
      .drawStyle(GraphDrawStyle.Bars)
      .fillOpacity(80)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(1)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .unit('short')
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom).showLegend(true))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .withOverride(colorOverride('error', 'red'))
      .withOverride(colorOverride('warn', 'orange'))
      .withOverride(colorOverride('warning', 'orange'))
      .withOverride(colorOverride('info', 'blue'))
      .withOverride(colorOverride('debug', 'gray'));
  })())

  // Error Count
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(120)
      .title('Error Count')
      .description('Total errors in selected time range')
      .datasource(LOKI_DS)
      .gridPos({ h: 3, w: 4, x: 16, y: 1 })
      .withTarget(
        lokiQuery('sum(count_over_time({service=~"$service", level="error"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__range]))'),
      )
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(10, 100))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Warning Count
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(130)
      .title('Warning Count')
      .description('Total warnings in selected time range')
      .datasource(LOKI_DS)
      .gridPos({ h: 3, w: 4, x: 20, y: 1 })
      .withTarget(
        lokiQuery('sum(count_over_time({service=~"$service", level=~"warn|warning"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__range]))'),
      )
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowOrange(50, 200))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Total Logs
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(140)
      .title('Total Logs')
      .description('Total log lines in selected time range')
      .datasource(LOKI_DS)
      .gridPos({ h: 3, w: 4, x: 16, y: 4 })
      .withTarget(
        lokiQuery('sum(count_over_time({service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__range]))'),
      )
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(singleColor('blue'))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Error Rate gauge
  .withPanel((() => {
    resetRefId();
    return new GaugeBuilder()
      .id(150)
      .title('Error Rate')
      .description('Percentage of error logs')
      .datasource(LOKI_DS)
      .gridPos({ h: 3, w: 4, x: 20, y: 4 })
      .withTarget(
        lokiQuery('sum(count_over_time({service=~"$service", level="error"} | json | service_extracted=~"$component" [$__range])) / sum(count_over_time({service=~"$service"} | json | service_extracted=~"$component" [$__range])) * 100'),
      )
      .unit('percent')
      .min(0)
      .max(100)
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowOrangeRed(1, 5, 10))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']).fields('').values(false))
      .showThresholdLabels(false)
      .showThresholdMarkers(true);
  })())

  // ── Row: Distribution ──────────────────────────────────────────────
  .withRow(
    new RowBuilder('Distribution').id(200).gridPos({ h: 1, w: 24, x: 0, y: 7 }),
  )

  // Logs by Service (piechart)
  .withPanel((() => {
    resetRefId();
    return new PiechartBuilder()
      .id(210)
      .title('Logs by Service')
      .description('Log distribution by Docker Compose service')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 6, x: 0, y: 8 })
      .withTarget(
        lokiQuery(
          'sum by (service) (count_over_time({service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__range]))',
          '{{service}}',
        ),
      )
      .pieType(PieChartType.Pie)
      .legend(new PieChartLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Right).showLegend(true).values([]).calcs([]))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Logs by Component (piechart)
  .withPanel((() => {
    resetRefId();
    return new PiechartBuilder()
      .id(220)
      .title('Logs by Component')
      .description('Log distribution by OpenCloud internal component')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 6, x: 6, y: 8 })
      .withTarget(
        lokiQuery(
          'sum by (service_extracted) (count_over_time({service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__range]))',
          '{{service_extracted}}',
        ),
      )
      .pieType(PieChartType.Pie)
      .legend(new PieChartLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Right).showLegend(true).values([]).calcs([]))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // Top Components by Errors (stat)
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(230)
      .title('Top Components by Errors')
      .description('Components with most errors - sorted by error count')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 6, x: 12, y: 8 })
      .withTarget(
        lokiInstantQuery(
          'topk(5, sum by (service_extracted) (count_over_time({service=~"$service", level="error"} | json | service_extracted=~"$component" [$__range])))',
          '',
        ),
      )
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowOrangeRed(1000, 10000, 50000))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.None)
      .justifyMode(BigValueJustifyMode.Auto)
      .orientation(VizOrientation.Horizontal)
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']).fields('').values(false))
      .showPercentChange(false)
      .textMode(BigValueTextMode.ValueAndName)
      .wideLayout(true)
      .withTransformation({
        id: 'renameByRegex',
        options: {
          regex: '.*service_extracted="([^"]+)".*',
          renamePattern: '$1',
        },
      });
  })())

  // Log Volume by Component (timeseries)
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(240)
      .title('Log Volume by Component')
      .description('Log volume over time grouped by OpenCloud component')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 6, x: 18, y: 8 })
      .withTarget(
        lokiQuery(
          'sum by (service_extracted) (count_over_time({service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search" [$__auto]))',
          '{{service_extracted}}',
        ),
      )
      .drawStyle(GraphDrawStyle.Line)
      .fillOpacity(20)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal).group('A'))
      .lineWidth(1)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .unit('short')
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom).showLegend(true))
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending));
  })())

  // ── Row: Detailed Logs ─────────────────────────────────────────────
  .withRow(
    new RowBuilder('Detailed Logs').id(300).gridPos({ h: 1, w: 24, x: 0, y: 14 }),
  )

  // Logs panel
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(310)
      .title('Logs')
      .description('Live log stream. Use filters above to narrow results.')
      .datasource(LOKI_DS)
      .gridPos({ h: 12, w: 24, x: 0, y: 15 })
      .withTarget(
        lokiQuery('{service=~"$service", level=~"$level"} | json | service_extracted=~"$component" |~ "(?i)$search"'),
      )
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
