/**
 * OpenCloud User Activity Dashboard
 * Authentication events, audit trail, and user-specific log analysis.
 * @see docs/dashboards/opencloud-user-activity.md
 */
import {
  DashboardBuilder,
  RowBuilder,
  CustomVariableBuilder,
  TextBoxVariableBuilder,
} from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as PiechartBuilder } from '@grafana/grafana-foundation-sdk/piechart';
import { PanelBuilder as TableBuilder } from '@grafana/grafana-foundation-sdk/table';
import { PanelBuilder as LogsBuilder } from '@grafana/grafana-foundation-sdk/logs';
import { PieChartType, PieChartLegendOptionsBuilder, PieChartLegendValues } from '@grafana/grafana-foundation-sdk/piechart';
import {
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
  colorOverride,
  regexpColorOverride,
  resetRefId,
} from './shared.js';

// ── Variables ────────────────────────────────────────────────────────

const varSearch = new TextBoxVariableBuilder('search')
  .label('Search (Email, UUID, Filename)')
  .current({ selected: false, text: '', value: '' });

const varAction = new CustomVariableBuilder('action')
  .label('Audit Action')
  .values('All : .+,file_read,file_create,file_delete,file_rename,file_trash,file_version,share_created,share_removed,share_updated,space_created,space_deleted,space_disabled,space_enabled,space_shared,space_unshared,user_created,user_deleted,user_feature_changed,group_member_added,group_member_removed,container_created,container_deleted')
  .multi(true)
  .includeAll(true)
  .allValue('.+')
  .current({ text: 'All', value: '.+' });

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud User Activity')
  .uid('opencloud-user-activity')
  .description('User activity tracking: authentication events, audit trail, and detailed logs. Use Search to filter by email, UUID, or filename.')
  .tags(['opencloud', 'users', 'audit', 'activity'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-24h', to: 'now' })
  .withVariable(varSearch)
  .withVariable(varAction)

  // ── Row 1: Authentication ──────────────────────────────────────────
  .withRow(new RowBuilder('Authentication').id(100).gridPos({ h: 1, w: 24, x: 0, y: 0 }))

  // 110 - Login Attempts (Timeseries)
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(110)
      .title('Login Attempts')
      .description('HTTP requests to the login endpoint from proxy access logs, grouped by status code. Spikes in 4xx indicate failed login attempts.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 12, x: 0, y: 1 })
      .withTarget(lokiQuery(
        'sum by (status) (count_over_time({service="opencloud"} | json | service_extracted="proxy" | uri=~"/signin/v1/identifier/_/logon" |~ "(?i)$search" [$__auto]))',
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
      .withOverride(regexpColorOverride('4..', 'red'));
  })())

  // 120 - Failed Logins (Logs)
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(120)
      .title('Failed Logins')
      .description('IDM log entries for invalid credentials. Shows username and source IP of failed authentication attempts.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 12, x: 12, y: 1 })
      .withTarget(lokiQuery('{service="opencloud"} | json | service_extracted=~"idm|idp" |~ "(?i)(invalid credentials|failed|unauthorized)" |~ "(?i)$search"'))
      .dedupStrategy(LogsDedupStrategy.None)
      .enableLogDetails(true)
      .prettifyLogMessage(true)
      .showCommonLabels(false)
      .showLabels(true)
      .showTime(true)
      .sortOrder(LogsSortOrder.Descending)
      .wrapLogMessage(true);
  })())

  // 130 - Self-Service Events (Logs)
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(130)
      .title('Self-Service Events')
      .description('User self-service requests: profile updates, password changes. Filtered from proxy access logs on /graph/v1.0/me endpoints.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 9 })
      .withTarget(lokiQuery('{service="opencloud"} | json | service_extracted="proxy" | uri=~"/graph/v1.0/me.*" |~ "(?i)$search"'))
      .dedupStrategy(LogsDedupStrategy.None)
      .enableLogDetails(true)
      .prettifyLogMessage(true)
      .showCommonLabels(false)
      .showLabels(true)
      .showTime(true)
      .sortOrder(LogsSortOrder.Descending)
      .wrapLogMessage(true);
  })())

  // ── Row 2: Audit Activity ─────────────────────────────────────────
  .withRow(new RowBuilder('Audit Activity').id(200).gridPos({ h: 1, w: 24, x: 0, y: 17 }))

  // 210 - Events over Time (Timeseries)
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(210)
      .title('Audit Events over Time')
      .description('Audit events grouped by action type. Shows file operations, sharing, space management, and user management activity over time.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 16, x: 0, y: 18 })
      .withTarget(lokiQuery(
        'sum by (Action) (count_over_time({service="opencloud"} | json | service_extracted="audit" | Action=~"$action" |~ "(?i)$search" [$__auto]))',
        '{{Action}}',
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
      .withOverride(regexpColorOverride('file_read', 'blue'))
      .withOverride(regexpColorOverride('file_create', 'green'))
      .withOverride(regexpColorOverride('file_delete|file_trash', 'red'))
      .withOverride(regexpColorOverride('share_.*', 'purple'))
      .withOverride(regexpColorOverride('space_.*', 'orange'))
      .withOverride(regexpColorOverride('user_.*|group_.*', 'yellow'));
  })())

  // 220 - Action Distribution (Piechart)
  .withPanel((() => {
    resetRefId();
    return new PiechartBuilder()
      .id(220)
      .title('Action Distribution')
      .description('Distribution of audit event types over the selected time range.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 8, x: 16, y: 18 })
      .withTarget(lokiQuery(
        'sum by (Action) (count_over_time({service="opencloud"} | json | service_extracted="audit" | Action=~"$action" |~ "(?i)$search" [$__range]))',
        '{{Action}}',
      ))
      .pieType(PieChartType.Pie)
      .legend(new PieChartLegendOptionsBuilder().displayMode(LegendDisplayMode.Table).placement(LegendPlacement.Right).showLegend(true).values([PieChartLegendValues.Value, PieChartLegendValues.Percent]).calcs([]))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['sum']).fields('').values(false));
  })())

  // 230 - Last Events (Table)
  .withPanel((() => {
    resetRefId();
    return new TableBuilder()
      .id(230)
      .title('Last Audit Events')
      .description('Recent audit events with action type, message, and user details. Use Search variable to filter by email, UUID, or filename.')
      .datasource(LOKI_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 26 })
      .withTarget(lokiInstantQuery(
        'topk(50, sum by (Action, Message) (count_over_time({service="opencloud"} | json | service_extracted="audit" | Action=~"$action" |~ "(?i)$search" [$__range])))',
        '',
      ))
      .withTransformation({ id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } })
      .withOverride({
        matcher: { id: 'byName', options: 'Time' },
        properties: [{ id: 'custom.hidden', value: true }],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Action' },
        properties: [
          { id: 'custom.width', value: 200 },
          { id: 'displayName', value: 'Action' },
        ],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Message' },
        properties: [
          { id: 'custom.width', value: 500 },
          { id: 'displayName', value: 'Message' },
        ],
      })
      .withOverride({
        matcher: { id: 'byName', options: 'Value' },
        properties: [{ id: 'displayName', value: 'Count' }],
      });
  })())

  // 240 - Raw Audit Logs (Logs)
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(240)
      .title('Raw Audit Logs')
      .description('Raw audit log stream. Use Search variable and Action filter to narrow results.')
      .datasource(LOKI_DS)
      .gridPos({ h: 10, w: 24, x: 0, y: 34 })
      .withTarget(lokiQuery('{service="opencloud"} | json | service_extracted="audit" | Action=~"$action" |~ "(?i)$search"'))
      .dedupStrategy(LogsDedupStrategy.None)
      .enableLogDetails(true)
      .prettifyLogMessage(true)
      .showCommonLabels(false)
      .showLabels(true)
      .showTime(true)
      .sortOrder(LogsSortOrder.Descending)
      .wrapLogMessage(true);
  })())

  // ── Row 3: Detailed Logs ──────────────────────────────────────────
  .withRow(new RowBuilder('Detailed Logs').id(300).gridPos({ h: 1, w: 24, x: 0, y: 44 }))

  // 310 - All Logs (Logs)
  .withPanel((() => {
    resetRefId();
    return new LogsBuilder()
      .id(310)
      .title('All OpenCloud Logs')
      .description('Unfiltered OpenCloud logs. Only filtered by Search variable. Use for correlation when investigating specific user activity.')
      .datasource(LOKI_DS)
      .gridPos({ h: 12, w: 24, x: 0, y: 45 })
      .withTarget(lokiQuery('{service="opencloud"} |~ "(?i)$search"'))
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
