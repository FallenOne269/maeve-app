import { memo } from "react";
import type { RFAIMetrics } from "@/types";

interface Props {
  metrics: RFAIMetrics;
}

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-widest text-maeve-muted font-mono">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-maeve-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MetricsBar({ metrics }: Props) {
  const { resonance, coherence, confidence, ignition, dominant_lens, recursion_depth, self_question } = metrics;

  return (
    <div className="border-t border-maeve-border bg-maeve-panel px-5 py-3 space-y-2">
      <div className="grid grid-cols-3 gap-3">
        <Gauge label="Resonance" value={resonance} color="#D4AF37" />
        <Gauge label="Coherence" value={coherence} color="#7EB8DA" />
        <Gauge label="Confidence" value={confidence} color="#9B8EC4" />
      </div>
      <div className="flex items-center justify-between text-xs font-mono pt-0.5">
        <div className="flex items-center gap-3 text-maeve-muted">
          <span>
            depth <span className="text-maeve-gold">{recursion_depth}</span>
          </span>
          <span>
            lens <span className="text-maeve-cyan">{dominant_lens}</span>
          </span>
        </div>
        {ignition && (
          <span className="text-maeve-gold animate-pulse tracking-widest uppercase text-xs">
            ⚡ ignition
          </span>
        )}
      </div>
      {self_question && (
        <p className="text-xs text-maeve-muted font-mono italic truncate" title={self_question}>
          ↳ {self_question}
        </p>
      )}
    </div>
  );
}

export default memo(MetricsBar);
