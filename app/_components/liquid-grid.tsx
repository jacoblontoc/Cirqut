"use client";

import { useEffect, useRef, type CSSProperties } from "react";

interface LiquidGridProps {
  mode?: "lines" | "dots";
  background?: string;
  lineColor?: string;
  glowColor?: string;
  cellSize?: number;
  lineWidth?: number;
  radius?: number;
  intensity?: number;
  collide?: boolean;
  clickRipple?: boolean;
  style?: CSSProperties;
}

const DEFAULTS = {
  mode: "dots" as const,
  background: "#000000",
  lineColor: "#FFFFFF4D",
  glowColor: "#FFFFFF",
  cellSize: 16,
  lineWidth: 1,
  radius: 58,
  intensity: 100,
  collide: true,
  clickRipple: true,
};

const DAMPING = 0.97;
const WAVE_HEIGHT = 14;
const STEP = 8;
const MAX_CELLS = 150;
const PAD = 20;
const WAVE_C = Math.SQRT1_2;
const MUR_K = (WAVE_C - 1) / (WAVE_C + 1);
const ABSORB_MAX = 0.6;

function parseColor(color: unknown): [number, number, number] {
  const value = String(color || "").trim();
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];

  const hex = value.replace("#", "");
  const expanded = hex.length === 3 ? hex.split("").map((character) => character + character).join("") : hex;
  const number = Number.parseInt(expanded, 16) || 0;
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function settingsFor(props: LiquidGridProps) {
  const weight = clamp(props.lineWidth, 1, 10, DEFAULTS.lineWidth);
  return {
    mode: props.mode ?? DEFAULTS.mode,
    background: props.background ?? DEFAULTS.background,
    lineColor: props.lineColor ?? DEFAULTS.lineColor,
    glowColor: props.glowColor ?? DEFAULTS.glowColor,
    cellSize: clamp(props.cellSize, 8, 120, DEFAULTS.cellSize),
    lineWidth: weight / 2,
    dotRadius: weight,
    radius: clamp(props.radius, 20, 600, DEFAULTS.radius),
    hoverStrength: (clamp(props.intensity, 0, 100, DEFAULTS.intensity) / 100) * 0.6,
    collide: props.collide ?? DEFAULTS.collide,
    click: props.clickRipple ?? DEFAULTS.clickRipple,
  };
}

type GridSettings = ReturnType<typeof settingsFor>;

function OriginkitLiquidGrid(props: LiquidGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    propsRef.current = props;
    repaintRef.current?.();
  }, [props]);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) return;
    const canvas: HTMLCanvasElement = canvasNode;
    const contextNode = canvas.getContext("2d");
    if (!contextNode) return;
    const context: CanvasRenderingContext2D = contextNode;

    const ripple = {
      current: new Float32Array(0),
      previous: new Float32Array(0),
      width: 0,
      height: 0,
      rippleWidth: 0,
      rippleHeight: 0,
      gridWidth: 0,
      gridHeight: 0,
      live: false,
    };

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (ripple.width === width && ripple.height === height) return;

      ripple.width = width;
      ripple.height = height;
      const scale = Math.min(1 / 3, MAX_CELLS / Math.max(width, height));
      ripple.rippleWidth = Math.max(4, Math.floor(width * scale));
      ripple.rippleHeight = Math.max(4, Math.floor(height * scale));
      ripple.gridWidth = ripple.rippleWidth + PAD * 2;
      ripple.gridHeight = ripple.rippleHeight + PAD * 2;
      ripple.current = new Float32Array(ripple.gridWidth * ripple.gridHeight);
      ripple.previous = new Float32Array(ripple.gridWidth * ripple.gridHeight);
      ripple.live = true;
    }

    function addDrop(centerX: number, centerY: number, radius: number, strength: number, collide: boolean) {
      const { width, height, rippleWidth, rippleHeight, gridWidth, gridHeight, current } = ripple;
      if (!width || !gridWidth) return;
      const gridX = (centerX / width) * rippleWidth + PAD;
      const gridY = (centerY / height) * rippleHeight + PAD;
      const gridRadius = Math.max(1, radius * (rippleWidth / width));
      const lowX = collide ? PAD + 1 : 1;
      const lowY = collide ? PAD + 1 : 1;
      const highX = collide ? PAD + rippleWidth - 2 : gridWidth - 2;
      const highY = collide ? PAD + rippleHeight - 2 : gridHeight - 2;

      for (let y = Math.max(lowY, Math.floor(gridY - gridRadius)); y <= Math.min(highY, Math.ceil(gridY + gridRadius)); y++) {
        for (let x = Math.max(lowX, Math.floor(gridX - gridRadius)); x <= Math.min(highX, Math.ceil(gridX + gridRadius)); x++) {
          const distance = Math.sqrt((x - gridX) ** 2 + (y - gridY) ** 2);
          if (distance < gridRadius) current[y * gridWidth + x] += (1 - distance / gridRadius) ** 2 * strength;
        }
      }
      ripple.live = true;
    }

    function openEdges() {
      const { gridWidth, gridHeight, current, previous } = ripple;
      const last = gridHeight - 1;
      const right = gridWidth - 1;

      for (let x = 0; x < gridWidth; x++) {
        const top = x;
        const bottom = last * gridWidth + x;
        current[top] = previous[gridWidth + x] + MUR_K * (current[gridWidth + x] - previous[top]);
        current[bottom] = previous[(last - 1) * gridWidth + x] + MUR_K * (current[(last - 1) * gridWidth + x] - previous[bottom]);
      }
      for (let y = 0; y < gridHeight; y++) {
        const left = y * gridWidth;
        const rightIndex = left + right;
        current[left] = previous[left + 1] + MUR_K * (current[left + 1] - previous[left]);
        current[rightIndex] = previous[rightIndex - 1] + MUR_K * (current[rightIndex - 1] - previous[rightIndex]);
      }

      for (let y = 0; y < gridHeight; y++) {
        const edgeY = Math.min(y, last - y);
        for (let x = 0; x < gridWidth; x++) {
          const distance = Math.min(edgeY, x, right - x);
          if (distance >= PAD) {
            if (right - PAD <= x) break;
            x = right - PAD;
            continue;
          }
          const amount = 1 - distance / PAD;
          const factor = 1 - ABSORB_MAX * amount * amount;
          const index = y * gridWidth + x;
          current[index] *= factor;
          previous[index] *= factor;
        }
      }
    }

    let lastCollide: boolean | null = null;
    function updateRipple(collide: boolean) {
      const { gridWidth, gridHeight, rippleWidth, rippleHeight, current, previous } = ripple;
      if (lastCollide !== null && lastCollide !== collide) {
        current.fill(0);
        previous.fill(0);
        lastCollide = collide;
        ripple.live = false;
        return;
      }

      lastCollide = collide;
      const startX = collide ? PAD + 1 : 1;
      const startY = collide ? PAD + 1 : 1;
      const endX = collide ? PAD + rippleWidth - 1 : gridWidth - 1;
      const endY = collide ? PAD + rippleHeight - 1 : gridHeight - 1;
      let energy = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const index = y * gridWidth + x;
          const value = ((current[(y - 1) * gridWidth + x] + current[(y + 1) * gridWidth + x] + current[y * gridWidth + x - 1] + current[y * gridWidth + x + 1]) * 0.5 - previous[index]) * DAMPING;
          previous[index] = value;
          energy += value * value;
          count++;
        }
      }

      ripple.current = previous;
      ripple.previous = current;
      if (!collide) openEdges();
      if (energy < count * 2e-6) {
        ripple.live = false;
        ripple.current.fill(0);
        ripple.previous.fill(0);
      }
    }

    function sample(centerX: number, centerY: number) {
      const { width, height, rippleWidth, rippleHeight, gridWidth, gridHeight, current } = ripple;
      if (!rippleWidth || !width) return 0;
      const gridX = (centerX / width) * rippleWidth + PAD;
      const gridY = (centerY / height) * rippleHeight + PAD;
      const x = Math.floor(gridX);
      const y = Math.floor(gridY);
      if (x < 0 || x >= gridWidth - 1 || y < 0 || y >= gridHeight - 1) return 0;
      const offsetX = gridX - x;
      const offsetY = gridY - y;
      return current[y * gridWidth + x] * (1 - offsetX) * (1 - offsetY)
        + current[y * gridWidth + x + 1] * offsetX * (1 - offsetY)
        + current[(y + 1) * gridWidth + x] * (1 - offsetX) * offsetY
        + current[(y + 1) * gridWidth + x + 1] * offsetX * offsetY;
    }

    let pointsX = new Float32Array(0);
    let pointsY = new Float32Array(0);
    let pointStrength = new Float32Array(0);
    function fitScratch(size: number) {
      if (pointsX.length >= size) return;
      pointsX = new Float32Array(size);
      pointsY = new Float32Array(size);
      pointStrength = new Float32Array(size);
    }

    const buckets = 4;
    const fullGlow = 4;
    const tau = Math.PI * 2;

    function drawFrame(settings: GridSettings) {
      const { width, height } = ripple;
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      if (settings.background && settings.background !== "rgba(0,0,0,0)") {
        context.fillStyle = settings.background;
        context.fillRect(0, 0, width, height);
      }

      const cellSize = settings.cellSize;
      const base = new Path2D();
      const glow = Array.from({ length: buckets }, () => new Path2D());
      const [red, green, blue] = parseColor(settings.glowColor);

      if (settings.mode === "dots") {
        const rows = Math.ceil(height / cellSize);
        const offsetY = (height - rows * cellSize) / 2;
        const columns = Math.ceil(width / cellSize);
        const offsetX = (width - columns * cellSize) / 2;

        for (let row = 0; row <= rows; row++) {
          const baseY = offsetY + row * cellSize;
          for (let column = 0; column <= columns; column++) {
            const centerX = offsetX + column * cellSize;
            const displacement = sample(centerX, baseY) * WAVE_HEIGHT;
            const centerY = baseY + displacement;
            base.moveTo(centerX + settings.dotRadius, centerY);
            base.arc(centerX, centerY, settings.dotRadius, 0, tau);

            const strength = Math.min(1, Math.abs(displacement) / fullGlow);
            if (strength < 0.06) continue;
            const bucket = Math.min(buckets - 1, Math.floor(strength * buckets));
            const radius = settings.dotRadius * (1 + strength * 0.6);
            glow[bucket].moveTo(centerX + radius, centerY);
            glow[bucket].arc(centerX, centerY, radius, 0, tau);
          }
        }

        context.fillStyle = settings.lineColor;
        context.fill(base);
        glow.forEach((path, index) => {
          const strength = (index + 1) / buckets;
          context.fillStyle = strength >= 1 ? `rgb(${red},${green},${blue})` : `rgba(${red},${green},${blue},${strength.toFixed(2)})`;
          context.fill(path);
        });
        return;
      }

      fitScratch(Math.floor(Math.max(width, height) / STEP) + 2);
      function emit(count: number) {
        base.moveTo(pointsX[0], pointsY[0]);
        for (let index = 1; index < count; index++) base.lineTo(pointsX[index], pointsY[index]);
        for (let index = 1; index < count; index++) {
          const strength = Math.max(pointStrength[index], pointStrength[index - 1]);
          if (strength < 0.06) continue;
          const bucket = Math.min(buckets - 1, Math.floor(strength * buckets));
          glow[bucket].moveTo(pointsX[index - 1], pointsY[index - 1]);
          glow[bucket].lineTo(pointsX[index], pointsY[index]);
        }
      }

      const rows = Math.ceil(height / cellSize);
      const offsetY = (height - rows * cellSize) / 2;
      for (let row = 0; row <= rows; row++) {
        const baseY = offsetY + row * cellSize;
        let count = 0;
        for (let x = 0; x <= width; x += STEP) {
          const centerX = Math.min(x, width);
          const displacement = sample(centerX, baseY) * WAVE_HEIGHT;
          pointsX[count] = centerX;
          pointsY[count] = baseY + displacement;
          pointStrength[count] = Math.min(1, Math.abs(displacement) / fullGlow);
          count++;
        }
        emit(count);
      }

      const columns = Math.ceil(width / cellSize);
      const offsetX = (width - columns * cellSize) / 2;
      for (let column = 0; column <= columns; column++) {
        const baseX = offsetX + column * cellSize;
        let count = 0;
        for (let y = 0; y <= height; y += STEP) {
          const centerY = Math.min(y, height);
          const displacement = sample(baseX, centerY) * WAVE_HEIGHT;
          pointsX[count] = baseX + displacement;
          pointsY[count] = centerY;
          pointStrength[count] = Math.min(1, Math.abs(displacement) / fullGlow);
          count++;
        }
        emit(count);
      }

      context.lineWidth = settings.lineWidth;
      context.strokeStyle = settings.lineColor;
      context.stroke(base);
      context.lineCap = "round";
      context.lineJoin = "round";
      glow.forEach((path, index) => {
        const strength = (index + 1) / buckets;
        context.strokeStyle = strength >= 1 ? `rgb(${red},${green},${blue})` : `rgba(${red},${green},${blue},${strength.toFixed(2)})`;
        context.lineWidth = settings.lineWidth * (1 + strength * 0.9);
        context.stroke(path);
      });
      context.lineCap = "butt";
      context.lineJoin = "miter";
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const paint = () => {
      resize();
      drawFrame(settingsFor(propsRef.current));
    };
    repaintRef.current = paint;
    paint();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        repaintRef.current = null;
        resizeObserver.disconnect();
      };
    }

    let rect = canvas.getBoundingClientRect();
    function toLocal(clientX: number, clientY: number) {
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    let queued: { x: number; y: number } | null = null;
    function onMove(event: MouseEvent) {
      queued = toLocal(event.clientX, event.clientY);
    }
    function onClick(event: MouseEvent) {
      const settings = settingsFor(propsRef.current);
      if (!settings.click) return;
      const local = toLocal(event.clientX, event.clientY);
      if (local) addDrop(local.x, local.y, settings.radius * 1.6, 2.5, settings.collide);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);

    let frame = 0;
    function loop() {
      rect = canvas.getBoundingClientRect();
      const settings = settingsFor(propsRef.current);
      if (ripple.width > 0 && ripple.height > 0) {
        if (queued) {
          addDrop(queued.x, queued.y, settings.radius, settings.hoverStrength, settings.collide);
          queued = null;
        }
        if (ripple.live) {
          updateRipple(settings.collide);
          drawFrame(settings);
        }
      }
      frame = window.requestAnimationFrame(loop);
    }
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      repaintRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none", ...props.style }} />;
}

const PRESET_PROPS = { cellSize: 76, intensity: 8 };

export default function LiquidGrid(props: LiquidGridProps) {
  return <OriginkitLiquidGrid {...PRESET_PROPS} {...props} />;
}
