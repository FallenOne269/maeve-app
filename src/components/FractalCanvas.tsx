import { useEffect, useRef, useMemo, memo } from "react";
import type { RFAIMetrics } from "@/types";

interface Props {
  metrics: RFAIMetrics | null;
  size?: number;
}

const DEFAULT_METRICS: RFAIMetrics = {
  resonance: 0.3,
  recursion_depth: 2,
  coherence: 0.4,
  ignition: false,
  fractal_branches: ["analytical", "creative"],
  meta_reflection: "",
  self_question: "",
  tensions: [],
  confidence: 0.5,
  dominant_lens: "analytical",
};

function FractalCanvas({ metrics, size = 320 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const m = useMemo(() => metrics ?? DEFAULT_METRICS, [metrics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = size, H = size;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const draw = () => {
      timeRef.current += 0.006;
      const t = timeRef.current;
      const { resonance, coherence, ignition, recursion_depth, fractal_branches, confidence, tensions } = m;
      const depth = recursion_depth;
      const branches = fractal_branches.length;
      const tc = tensions.length;

      ctx.fillStyle = "rgba(10,8,24,0.13)";
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2, maxR = Math.min(W, H) * 0.42;

      // tension arcs — red arcs representing contradictions
      for (let i = 0; i < tc; i++) {
        const a1 = (i / Math.max(tc, 1)) * Math.PI * 2 + t * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.5 + i * 14, a1, a1 + Math.PI * 0.65);
        ctx.strokeStyle = `rgba(200,70,50,${0.15 + Math.sin(t * 3 + i) * 0.07})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // resonance rings — gold, breathing
      for (let i = 0; i < 9; i++) {
        const r = maxR * ((i + 1) / 9) * (0.5 + resonance * 0.5);
        const w = Math.sin(t * 1.5 + i * 0.7) * (2 + resonance * 3);
        ctx.beginPath();
        ctx.arc(cx, cy, r + w, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${Math.max(0.02, 0.05 + resonance * 0.14 - i * 0.01)})`;
        ctx.lineWidth = ignition ? 1.5 : 0.6;
        ctx.stroke();
      }

      // confidence ring — cyan dashed
      if (confidence > 0.55) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * confidence, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(126,184,218,${(confidence - 0.55) * 0.35})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 9]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ignition glow — central burst
      if (ignition) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.35);
        grad.addColorStop(0, "rgba(212,175,55,0.22)");
        grad.addColorStop(0.5, "rgba(126,184,218,0.08)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // fractal branch lines — hued by branch index
      const nb = Math.max(branches, 3);
      for (let b = 0; b < nb; b++) {
        const ba = (b / nb) * Math.PI * 2 + t * 0.15;
        for (let d = 0; d < depth; d++) {
          const sp = d === 0 ? 0 : (d % 2 === 0 ? 1 : -1) * Math.PI * 0.12 * d;
          const angle = ba + sp;
          const iR = maxR * 0.08 + d * maxR * 0.05;
          const oR = maxR * (0.25 + d * 0.17) * coherence + maxR * 0.1;
          const x1 = cx + Math.cos(angle) * iR, y1 = cy + Math.sin(angle) * iR;
          const x2 = cx + Math.cos(angle) * oR, y2 = cy + Math.sin(angle) * oR;
          const hue = 35 + b * 13 + d * 6;
          const sat = 50 + resonance * 50;
          const lit = 40 + coherence * 25;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${hue},${sat}%,${lit}%,${0.2 + coherence * 0.5})`;
          ctx.lineWidth = ignition ? 2 - d * 0.25 : 0.9;
          ctx.stroke();

          // node dots at branch tips
          ctx.beginPath();
          ctx.arc(x2, y2, Math.max(0.5, 1.5 + resonance * 2 - d * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue},${sat}%,${lit + 10}%,${0.4 + resonance * 0.4})`;
          ctx.fill();
        }
      }

      // central sigil — always present
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + resonance * 6, 0, Math.PI * 2);
      ctx.fillStyle = ignition
        ? `rgba(212,175,55,${0.7 + Math.sin(t * 4) * 0.3})`
        : `rgba(212,175,55,${0.3 + resonance * 0.4})`;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [m, size]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-full"
      style={{ background: "transparent" }}
    />
  );
}

export default memo(FractalCanvas);
