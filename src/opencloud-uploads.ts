import {
  DashboardBuilder,
  RowBuilder,
  FieldColorBuilder,
  FieldColorModeId,
  ThresholdsConfigBuilder,
  ThresholdsMode,
} from '@grafana/grafana-foundation-sdk/dashboard';
import { PanelBuilder as StatBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { PanelBuilder as GaugeBuilder } from '@grafana/grafana-foundation-sdk/gauge';
import { PanelBuilder as TimeseriesBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as BarGaugeBuilder } from '@grafana/grafana-foundation-sdk/bargauge';
import {
  BarGaugeDisplayMode,
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
  VizOrientation,
  VizTooltipOptionsBuilder,
} from '@grafana/grafana-foundation-sdk/common';
import {
  PROMETHEUS_DS,
  promQuery,
  greenYellowRed,
  redYellowGreen,
  singleColor,
  colorOverride,
  resetRefId,
} from './shared.js';

// ── Dashboard ────────────────────────────────────────────────────────

const dashboard = new DashboardBuilder('OpenCloud Upload Pipeline')
  .uid('opencloud-uploads')
  .description('Deep dive into file uploads, antivirus scanning with ClamAV, and async processing queues. Use this dashboard to troubleshoot upload failures and identify bottlenecks.')
  .tags(['opencloud', 'uploads', 'antivirus'])
  .timezone('browser')
  .refresh('auto')
  .time({ from: 'now-1h', to: 'now' })

  // ── Row: Key Indicators ────────────────────────────────────────────
  .withRow(new RowBuilder('Key Indicators').id(100).gridPos({ h: 1, w: 24, x: 0, y: 0 }))

  // Active Uploads
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(110)
      .title('Active Uploads')
      .description('Currently active file uploads. Shows how many files are being uploaded right now. High values during off-hours may indicate backup jobs or sync clients. Yellow >10, Red >50.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 0, y: 1 })
      .withTarget(promQuery('sum(reva_upload_active)', 'Active'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(10, 50))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Processing
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(120)
      .title('Processing')
      .description('Files in post-upload processing (antivirus scan, thumbnail generation, search indexing). High values indicate ClamAV is slow or backlog is building. Should return to 0 shortly after uploads complete.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 4, y: 1 })
      .withTarget(promQuery('sum(reva_upload_processing)', 'Processing'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(
        new ThresholdsConfigBuilder()
          .mode(ThresholdsMode.Absolute)
          .steps([
            { value: null as unknown as number, color: 'blue' },
            { value: 20, color: 'yellow' },
            { value: 100, color: 'red' },
          ]),
      )
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Active Downloads
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(130)
      .title('Active Downloads')
      .description('Currently active file downloads. High values indicate heavy read activity. Downloads are less resource-intensive than uploads since no post-processing is needed.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 8, y: 1 })
      .withTarget(promQuery('sum(reva_download_active)', 'Downloads'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(
        new ThresholdsConfigBuilder()
          .mode(ThresholdsMode.Absolute)
          .steps([
            { value: null as unknown as number, color: 'purple' },
            { value: 50, color: 'yellow' },
            { value: 200, color: 'red' },
          ]),
      )
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Upload Success Rate
  .withPanel((() => {
    resetRefId();
    return new GaugeBuilder()
      .id(140)
      .title('Upload Success Rate')
      .description('Percentage of uploads that complete successfully (finalized / initiated). Green >98% is healthy. Yellow 90-98% needs attention. Red <90% indicates serious issues - check antivirus logs or storage.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 12, y: 1 })
      .withTarget(promQuery('(sum(increase(reva_upload_sessions_finalized[5m])) / sum(increase(reva_upload_sessions_initiated[5m]))) * 100', 'Success %'))
      .unit('percent')
      .min(0)
      .max(100)
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(redYellowGreen(90, 98))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .showThresholdLabels(false)
      .showThresholdMarkers(true);
  })())

  // Postprocessing Queue
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(150)
      .title('Postprocessing Queue')
      .description('Events waiting to be processed after upload (antivirus, thumbnails). Should normally be 0-5. Growing queue indicates processing can\'t keep up - check ClamAV performance or disk I/O.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 16, y: 1 })
      .withTarget(promQuery('sum(opencloud_postprocessing_events_unprocessed)', 'Unprocessed'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(10, 50))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // Search Queue
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(160)
      .title('Search Queue')
      .description('Events waiting to update the search index. New files need to be indexed for search. Growing queue may indicate search service issues. Check search logs if persistently high.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 4, x: 20, y: 1 })
      .withTarget(promQuery('sum(opencloud_search_events_unprocessed)', 'Unprocessed'))
      .unit('short')
      .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
      .thresholds(greenYellowRed(10, 50))
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.Area);
  })())

  // ── Row: Upload Pipeline ───────────────────────────────────────────
  .withRow(new RowBuilder('Upload Pipeline').id(200).gridPos({ h: 1, w: 24, x: 0, y: 5 }))

  // Upload Pipeline Flow
  .withPanel((() => {
    resetRefId();
    return new TimeseriesBuilder()
      .id(210)
      .title('Upload Pipeline Flow')
      .description('Upload session lifecycle per minute: Initiated (upload started) → Transfer Complete (all bytes received) → Scanned (ClamAV check) → Finalized (success) or Aborted (failed). Watch for gaps between stages - indicates where uploads get stuck.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 8, w: 24, x: 0, y: 6 })
      .withTarget(promQuery('sum(rate(reva_upload_sessions_initiated[5m])) * 60', 'Initiated'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_bytes_received[5m])) * 60', 'Transfer Complete'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_scanned[5m])) * 60', 'Scanned (AV)'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_finalized[5m])) * 60', 'Finalized'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_aborted[5m])) * 60', 'Aborted'))
      .withTarget(promQuery('sum(rate(reva_upload_sessions_restarted[5m])) * 60', 'Restarted'))
      .withTarget(promQuery('sum(rate(opencloud_postprocessing_finished[5m])) * 60', 'Postprocessing Done'))
      .unit('short')
      .drawStyle(GraphDrawStyle.Line)
      .lineWidth(2)
      .fillOpacity(20)
      .pointSize(5)
      .showPoints(VisibilityMode.Never)
      .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
      .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
      .withOverride(colorOverride('Initiated', 'blue'))
      .withOverride(colorOverride('Transfer Complete', 'light-blue'))
      .withOverride(colorOverride('Scanned (AV)', 'yellow'))
      .withOverride(colorOverride('Finalized', 'green'))
      .withOverride(colorOverride('Aborted', 'red'))
      .withOverride(colorOverride('Restarted', 'orange'))
      .withOverride(colorOverride('Postprocessing Done', 'semi-dark-green'));
  })())

  // ── Row: Upload Statistics ─────────────────────────────────────────
  .withRow(new RowBuilder('Upload Statistics').id(300).gridPos({ h: 1, w: 24, x: 0, y: 14 }))

  // Uploads in Selected Range
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(310)
      .title('Uploads in Selected Range')
      .description('Upload counts for the time range selected above (e.g., \'Last 1 hour\'). Shows activity in your selected window. Compare stages to identify where uploads fail: Initiated → Transfer Complete → Scanned → Finalized.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 12, x: 0, y: 15 })
      .withTarget(promQuery('sum(increase(reva_upload_sessions_initiated[$__range]))', 'Initiated'))
      .withTarget(promQuery('sum(increase(reva_upload_sessions_bytes_received[$__range]))', 'Transfer Complete'))
      .withTarget(promQuery('sum(increase(reva_upload_sessions_scanned[$__range]))', 'Scanned'))
      .withTarget(promQuery('sum(increase(reva_upload_sessions_finalized[$__range]))', 'Finalized'))
      .withTarget(promQuery('sum(increase(reva_upload_sessions_aborted[$__range]))', 'Aborted'))
      .unit('short')
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.None)
      .textMode(BigValueTextMode.ValueAndName)
      .withOverride(colorOverride('Finalized', 'green'))
      .withOverride(colorOverride('Aborted', 'red'));
  })())

  // Upload Totals (since start)
  .withPanel((() => {
    resetRefId();
    return new StatBuilder()
      .id(320)
      .title('Upload Totals (since start)')
      .description('Cumulative upload counts since container restart. Shows overall system health over entire uptime. Useful for success rate calculation: Finalized/Initiated. If Transfer Complete < Initiated: network issues. If Scanned < Finalized: AV bypass.')
      .datasource(PROMETHEUS_DS)
      .gridPos({ h: 4, w: 12, x: 12, y: 15 })
      .withTarget(promQuery('sum(reva_upload_sessions_initiated)', 'Initiated'))
      .withTarget(promQuery('sum(reva_upload_sessions_bytes_received)', 'Transfer Complete'))
      .withTarget(promQuery('sum(reva_upload_sessions_scanned)', 'Scanned'))
      .withTarget(promQuery('sum(reva_upload_sessions_finalized)', 'Finalized'))
      .withTarget(promQuery('sum(reva_upload_sessions_aborted)', 'Aborted'))
      .withTarget(promQuery('sum(reva_upload_sessions_deleted)', 'Deleted'))
      .unit('short')
      .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
      .colorMode(BigValueColorMode.Value)
      .graphMode(BigValueGraphMode.None)
      .textMode(BigValueTextMode.ValueAndName)
      .withOverride(colorOverride('Finalized', 'green'))
      .withOverride(colorOverride('Aborted', 'red'));
  })())

  // ── Row: Transfer Activity (collapsed) ─────────────────────────────
  .withRow(
    new RowBuilder('Transfer Activity')
      .id(400)
      .gridPos({ h: 1, w: 24, x: 0, y: 19 })
      .collapsed(true)
      // Active Transfers Over Time
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(410)
          .title('Active Transfers Over Time')
          .description('Concurrent transfers stacked over time. Uploads (blue), Downloads (purple), Processing (orange), Assimilation (green = PosixFS metadata sync). Helps identify peak usage times and correlate with performance issues.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 12, x: 0, y: 20 })
          .withTarget(promQuery('sum(reva_upload_active)', 'Uploads'))
          .withTarget(promQuery('sum(reva_download_active)', 'Downloads'))
          .withTarget(promQuery('sum(reva_upload_processing)', 'Processing'))
          .withTarget(promQuery('sum(reva_assimilation_active_tasks)', 'Assimilation'))
          .unit('short')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(30)
          .pointSize(5)
          .showPoints(VisibilityMode.Never)
          .stacking(new StackingConfigBuilder().mode(StackingMode.Normal))
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
          .withOverride(colorOverride('Uploads', 'blue'))
          .withOverride(colorOverride('Downloads', 'purple'))
          .withOverride(colorOverride('Processing', 'orange'))
          .withOverride(colorOverride('Assimilation', 'light-green'));
      })())
      // Event Queue Depth
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(420)
          .title('Event Queue Depth')
          .description('Async event queue backlog over time. Unprocessed = waiting to be handled. Redelivered = events that failed and are being retried. Rising redelivered count indicates persistent failures - check service logs.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 8, w: 12, x: 12, y: 20 })
          .withTarget(promQuery('sum(opencloud_postprocessing_events_unprocessed)', 'Postprocessing Unprocessed'))
          .withTarget(promQuery('sum(opencloud_postprocessing_events_redelivered)', 'Postprocessing Redelivered'))
          .withTarget(promQuery('sum(opencloud_postprocessing_events_outstanding_acks)', 'Postprocessing Outstanding Acks'))
          .withTarget(promQuery('sum(opencloud_search_events_unprocessed)', 'Search Unprocessed'))
          .withTarget(promQuery('sum(opencloud_search_events_redelivered)', 'Search Redelivered'))
          .unit('short')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(20)
          .pointSize(5)
          .showPoints(VisibilityMode.Never)
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
          .withOverride(colorOverride('Postprocessing Unprocessed', 'yellow'))
          .withOverride(colorOverride('Postprocessing Redelivered', 'orange'))
          .withOverride(colorOverride('Postprocessing Outstanding Acks', 'red'))
          .withOverride(colorOverride('Search Unprocessed', 'blue'))
          .withOverride(colorOverride('Search Redelivered', 'purple'));
      })()),
  )

  // ── Row: Processing Performance (collapsed) ────────────────────────
  .withRow(
    new RowBuilder('Processing Performance')
      .id(500)
      .gridPos({ h: 1, w: 24, x: 0, y: 20 })
      .collapsed(true)
      // Thumbnail Generation
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(510)
          .title('Thumbnail Generation')
          .description('Time to generate image/document thumbnails. P50 (green) = typical. P95 (yellow) = slow. P99 (red) = worst case. Slow thumbnails affect file browser responsiveness. Large files or complex documents take longer.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 6, w: 8, x: 0, y: 21 })
          .withTarget(promQuery('histogram_quantile(0.50, sum(rate(opencloud_thumbnails_getthumbnail_duration_seconds_bucket[5m])) by (le))', 'P50'))
          .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_thumbnails_getthumbnail_duration_seconds_bucket[5m])) by (le))', 'P95'))
          .withTarget(promQuery('histogram_quantile(0.99, sum(rate(opencloud_thumbnails_getthumbnail_duration_seconds_bucket[5m])) by (le))', 'P99'))
          .unit('s')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(10)
          .pointSize(5)
          .showPoints(VisibilityMode.Auto)
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
          .withOverride(colorOverride('P50', 'green'))
          .withOverride(colorOverride('P95', 'yellow'))
          .withOverride(colorOverride('P99', 'red'));
      })())
      // Postprocessing Duration
      .withPanel((() => {
        resetRefId();
        return new TimeseriesBuilder()
          .id(520)
          .title('Postprocessing Duration')
          .description('Time to complete async postprocessing (antivirus, thumbnails, search indexing). P50 = typical. P95 = slow. P99 = worst case. High values indicate processing bottlenecks.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 6, w: 8, x: 8, y: 21 })
          .withTarget(promQuery('histogram_quantile(0.50, sum(rate(opencloud_postprocessing_duration_seconds_bucket[5m])) by (le))', 'P50'))
          .withTarget(promQuery('histogram_quantile(0.95, sum(rate(opencloud_postprocessing_duration_seconds_bucket[5m])) by (le))', 'P95'))
          .withTarget(promQuery('histogram_quantile(0.99, sum(rate(opencloud_postprocessing_duration_seconds_bucket[5m])) by (le))', 'P99'))
          .unit('s')
          .drawStyle(GraphDrawStyle.Line)
          .lineWidth(2)
          .fillOpacity(10)
          .pointSize(5)
          .showPoints(VisibilityMode.Auto)
          .tooltip(new VizTooltipOptionsBuilder().mode(TooltipDisplayMode.Multi).sort(SortOrder.Descending))
          .legend(new VizLegendOptionsBuilder().displayMode(LegendDisplayMode.List).placement(LegendPlacement.Bottom))
          .withOverride(colorOverride('P50', 'green'))
          .withOverride(colorOverride('P95', 'yellow'))
          .withOverride(colorOverride('P99', 'red'));
      })())
      // Drop-off Analysis
      .withPanel((() => {
        resetRefId();
        return new BarGaugeBuilder()
          .id(530)
          .title('Drop-off Analysis (selected range)')
          .description('Upload success rates for selected time range. Shows % of uploads completing each stage. All bars should be near 100%. Low \'Transfer Complete\' = network issues. Low \'AV Scanned\' = ClamAV rejections. Low \'Finalized\' = post-processing failures.')
          .datasource(PROMETHEUS_DS)
          .gridPos({ h: 6, w: 8, x: 16, y: 21 })
          .withTarget(promQuery('(sum(increase(reva_upload_sessions_bytes_received[$__range])) / sum(increase(reva_upload_sessions_initiated[$__range]))) * 100', 'Transfer Complete'))
          .withTarget(promQuery('(sum(increase(reva_upload_sessions_scanned[$__range])) / sum(increase(reva_upload_sessions_initiated[$__range]))) * 100', 'AV Scanned'))
          .withTarget(promQuery('(sum(increase(reva_upload_sessions_finalized[$__range])) / sum(increase(reva_upload_sessions_initiated[$__range]))) * 100', 'Finalized'))
          .unit('percent')
          .min(0)
          .max(100)
          .colorScheme(new FieldColorBuilder().mode(FieldColorModeId.Thresholds))
          .thresholds(redYellowGreen(80, 95))
          .reduceOptions(new ReduceDataOptionsBuilder().calcs(['lastNotNull']))
          .orientation(VizOrientation.Horizontal)
          .displayMode(BarGaugeDisplayMode.Gradient)
          .showUnfilled(true);
      })()),
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
