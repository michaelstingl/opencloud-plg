/**
 * Activitylog Debug Dashboard
 * Debug activitylog service and NATS/JetStream event processing.
 * @see docs/dashboards/activitylog.md
 */
import { DashboardBuilder, RowBuilder } from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as LogsBuilder } from '@grafana/grafana-foundation-sdk/logs';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueJustifyMode,
  BigValueTextMode,
  GraphDrawStyle,
  LogsSortOrder,
  StackingMode,
  VisibilityMode,
  LegendDisplayMode,
  LegendPlacement,
  ReduceDataOptionsBuilder,
  StackingConfigBuilder,
  VizLegendOptionsBuilder,
} from '@grafana/grafana-foundation-sdk/common';
import {
  LOKI_DS,
  lokiQuery,
  greenRed,
  greenYellow,
  greenYellowOrange,
  greenYellowRed,
  colorOverride,
  resetRefId,
} from './shared.js';

// ── Stat panel factory ───────────────────────────────────────────────

function statPanel(
  id: number,
  title: string,
  expr: string,
  thresholds: ReturnType<typeof greenRed>,
  gridPos: { h: number; w: number; x: number; y: number },
): StatBuilder {
  resetRefId();
  return new StatBuilder()
    .id(id)
    .title(title)
    .datasource(LOKI_DS)
    .gridPos(gridPos)
    .withTarget(lokiQuery(expr))
    .colorMode(BigValueColorMode.Value)
    .graphMode(BigValueGraphMode.None)
    .justifyMode(BigValueJustifyMode.Auto)
    .textMode(BigValueTextMode.Auto)
    .reduceOptions(
      new ReduceDataOptionsBuilder()
        .calcs(['lastNotNull'])
        .fields('')
        .values(false),
    )
    .unit('short')
    .thresholds(thresholds);
}

// ── Logs panel factory ───────────────────────────────────────────────

function logsPanel(
  id: number,
  title: string,
  expr: string,
  gridPos: { h: number; w: number; x: number; y: number },
): LogsBuilder {
  resetRefId();
  return new LogsBuilder()
    .id(id)
    .title(title)
    .datasource(LOKI_DS)
    .gridPos(gridPos)
    .withTarget(lokiQuery(expr))
    .showTime(true)
    .showLabels(false)
    .showCommonLabels(false)
    .wrapLogMessage(true)
    .prettifyLogMessage(true)
    .enableLogDetails(true)
    .sortOrder(LogsSortOrder.Descending);
}

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud Activitylog Debug')
  .uid('activitylog-debug')
  .description('Monitor activitylog service, NATS, and event processing for upstream issue tracking')
  .tags(['opencloud', 'activitylog', 'nats', 'debug'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })

  // ── Row: NATS / JetStream ──────────────────────────────────────────
  .withRow(
    new RowBuilder('NATS / JetStream (Loki)')
      .id(100)
      .gridPos({ h: 1, w: 24, x: 0, y: 0 }),
  )

  .withPanel(
    statPanel(110, 'NATS Errors (24h)',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"nats"` | json | level=`error` [24h]))',
      greenRed(1),
      { h: 4, w: 6, x: 0, y: 1 },
    ),
  )

  .withPanel(
    statPanel(120, 'NATS Warnings (24h)',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"nats"` | json | level=`warn` [24h]))',
      greenYellowOrange(1, 10),
      { h: 4, w: 6, x: 6, y: 1 },
    ),
  )

  .withPanel(
    statPanel(130, 'NATS Config Warnings (24h)',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `nats configuration` [24h]))',
      greenYellow(1),
      { h: 4, w: 6, x: 12, y: 1 },
    ),
  )

  .withPanel(
    statPanel(140, 'Filestore Warnings (24h)',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"nats"` |= `Filestore` [24h]))',
      greenYellow(1),
      { h: 4, w: 6, x: 18, y: 1 },
    ),
  )

  .withPanel(
    logsPanel(150, 'NATS Service Logs',
      '{container="opencloud-opencloud-1"} |= `"service":"nats"` | json | level=~`error|warn`',
      { h: 8, w: 24, x: 0, y: 5 },
    ),
  )

  // ── Row: Activitylog Errors ────────────────────────────────────────
  .withRow(
    new RowBuilder('Activitylog Errors (Loki)')
      .id(200)
      .gridPos({ h: 1, w: 24, x: 0, y: 13 }),
  )

  .withPanel(
    statPanel(210, 'Activitylog Errors (Last 24h)',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"activitylog"` |= `error` [24h]))',
      greenYellowRed(1, 10),
      { h: 4, w: 6, x: 0, y: 14 },
    ),
  )

  .withPanel(
    statPanel(220, 'Event Processing Errors',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"activitylog"` |= `could not process event` [24h]))',
      greenRed(1),
      { h: 4, w: 6, x: 6, y: 14 },
    ),
  )

  .withPanel(
    statPanel(230, 'Store Errors',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"activitylog"` |~ `error.*(store|activities)` [24h]))',
      greenRed(1),
      { h: 4, w: 6, x: 12, y: 14 },
    ),
  )

  .withPanel(
    statPanel(240, 'Unknown Events',
      'sum(count_over_time({container="opencloud-opencloud-1"} |= `"service":"activitylog"` |= `event not registered` [24h]))',
      greenYellow(1),
      { h: 4, w: 6, x: 18, y: 14 },
    ),
  )

  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(250)
      .title('Error Rate Over Time')
      .datasource(LOKI_DS)
      .gridPos({ h: 6, w: 24, x: 0, y: 18 })
      .withTarget(
        lokiQuery(
          'sum by (level) (count_over_time({container="opencloud-opencloud-1"} |= `"service":"activitylog"` | json | level=~`error|warn` [$__interval]))',
          '{{level}}',
        ),
      )
      .drawStyle(GraphDrawStyle.Bars)
      .fillOpacity(50)
      .stacking(new StackingConfigBuilder().mode(StackingMode.Normal))
      .legend(
        new VizLegendOptionsBuilder()
          .showLegend(true)
          .displayMode(LegendDisplayMode.List)
          .placement(LegendPlacement.Bottom),
      )
      .showPoints(VisibilityMode.Never)
      .withOverride(colorOverride('error', 'red'))
      .withOverride(colorOverride('warn', 'yellow'));
  })())

  .withPanel(
    logsPanel(260, 'All Activitylog Errors',
      '{container="opencloud-opencloud-1"} |= `"service":"activitylog"` | json | level=~`error|warn`',
      { h: 8, w: 24, x: 0, y: 24 },
    ),
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
