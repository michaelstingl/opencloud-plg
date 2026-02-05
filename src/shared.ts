import { DataqueryBuilder as PrometheusQueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { DataqueryBuilder as LokiQueryBuilder } from '@grafana/grafana-foundation-sdk/loki';
import {
  ThresholdsConfigBuilder,
  ThresholdsMode,
  type DataSourceRef,
  type DynamicConfigValue,
} from '@grafana/grafana-foundation-sdk/dashboard';

// ── Datasources ──────────────────────────────────────────────────────

export const PROMETHEUS_DS: DataSourceRef = { type: 'prometheus', uid: 'prometheus' };
export const LOKI_DS: DataSourceRef = { type: 'loki', uid: 'loki' };

// ── Query Helpers ────────────────────────────────────────────────────

let refIdCounter = 0;

export function resetRefId(): void {
  refIdCounter = 0;
}

function nextRefId(): string {
  const id = String.fromCharCode(65 + refIdCounter); // A, B, C, ...
  refIdCounter++;
  return id;
}

export function promQuery(expr: string, legend?: string): PrometheusQueryBuilder {
  const q = new PrometheusQueryBuilder()
    .expr(expr)
    .refId(nextRefId());
  if (legend) q.legendFormat(legend);
  return q;
}

export function promInstantQuery(expr: string, legend?: string): PrometheusQueryBuilder {
  const q = new PrometheusQueryBuilder()
    .expr(expr)
    .instant()
    .refId(nextRefId());
  if (legend) q.legendFormat(legend);
  return q;
}

export function lokiQuery(expr: string, legend?: string): LokiQueryBuilder {
  const q = new LokiQueryBuilder()
    .expr(expr)
    .refId(nextRefId());
  if (legend) q.legendFormat(legend);
  return q;
}

export function lokiInstantQuery(expr: string, legend?: string): LokiQueryBuilder {
  const q = new LokiQueryBuilder()
    .expr(expr)
    .instant(true)
    .refId(nextRefId());
  if (legend) q.legendFormat(legend);
  return q;
}

// ── Threshold Factories ──────────────────────────────────────────────

export function greenYellowRed(yellow: number, red: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'green' },
      { value: yellow, color: 'yellow' },
      { value: red, color: 'red' },
    ]);
}

export function greenYellowOrangeRed(yellow: number, orange: number, red: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'green' },
      { value: yellow, color: 'yellow' },
      { value: orange, color: 'orange' },
      { value: red, color: 'red' },
    ]);
}

export function greenYellowOrange(yellow: number, orange: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'green' },
      { value: yellow, color: 'yellow' },
      { value: orange, color: 'orange' },
    ]);
}

export function redYellowGreen(yellow: number, green: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'red' },
      { value: yellow, color: 'yellow' },
      { value: green, color: 'green' },
    ]);
}

export function greenRed(red: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'green' },
      { value: red, color: 'red' },
    ]);
}

export function greenYellow(yellow: number): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color: 'green' },
      { value: yellow, color: 'yellow' },
    ]);
}

export function singleColor(color: string): ThresholdsConfigBuilder {
  return new ThresholdsConfigBuilder()
    .mode(ThresholdsMode.Absolute)
    .steps([
      { value: null as unknown as number, color },
    ]);
}

// ── Override Helpers ─────────────────────────────────────────────────

export function colorOverride(name: string, color: string): {
  matcher: { id: string; options: string };
  properties: DynamicConfigValue[];
} {
  return {
    matcher: { id: 'byName', options: name },
    properties: [
      { id: 'color', value: { fixedColor: color, mode: 'fixed' } },
    ],
  };
}

export function regexpColorOverride(pattern: string, color: string): {
  matcher: { id: string; options: string };
  properties: DynamicConfigValue[];
} {
  return {
    matcher: { id: 'byRegexp', options: pattern },
    properties: [
      { id: 'color', value: { fixedColor: color, mode: 'fixed' } },
    ],
  };
}
