import { VisualizerMode } from '../types';

// Helper to map a value from one range to another
const map = (value: number, x1: number, y1: number, x2: number, y2: number) => 
  (value - x1) * (y2 - x2) / (y1 - x1) + x2;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

export interface VisualizerState {
  particles: Particle[];
  explosions: Explosion[];
  beatThreshold: number;
}

export const drawVisualizer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: VisualizerMode,
  dataArray: Uint8Array,
  bufferLength: number,
  state: VisualizerState,
  sensitivity: number = 1.0
) => {
  // Clear canvas
  // For particle modes, we want a trail effect, so we use a semi-transparent fill
  if (mode === VisualizerMode.PARTICLES || mode === VisualizerMode.ORB || mode === VisualizerMode.BEAT_PARTICLES) {
     ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Slate-950 with opacity for trails
     ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const centerX = width / 2;
  const centerY = height / 2;

  switch (mode) {
    case VisualizerMode.BARS:
      drawBars(ctx, width, height, dataArray, bufferLength);
      break;
    case VisualizerMode.WAVE:
      drawWave(ctx, width, height, dataArray, bufferLength);
      break;
    case VisualizerMode.CIRCULAR:
      drawCircular(ctx, centerX, centerY, dataArray, bufferLength);
      break;
    case VisualizerMode.ORB:
      drawOrb(ctx, centerX, centerY, dataArray, bufferLength, sensitivity);
      break;
    case VisualizerMode.PARTICLES:
      drawGridParticles(ctx, width, height, dataArray, bufferLength);
      break;
    case VisualizerMode.BEAT_PARTICLES:
      drawBeatParticles(ctx, width, height, dataArray, bufferLength, state, sensitivity);
      break;
  }
};

const drawBars = (ctx: CanvasRenderingContext2D, width: number, height: number, data: Uint8Array, bufferLength: number) => {
  const barWidth = (width / bufferLength) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    barHeight = data[i] * (height / 255) * 0.8; // Scale to fit
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, '#3b82f6'); // blue-500
    gradient.addColorStop(0.5, '#8b5cf6'); // violet-500
    gradient.addColorStop(1, '#ec4899'); // pink-500

    ctx.fillStyle = gradient;
    
    // Draw rounded top bar
    ctx.beginPath();
    ctx.roundRect(x, height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    // Reflection (optional cool effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, height - barHeight, barWidth, 2);

    x += barWidth + 2;
  }
};

const drawWave = (ctx: CanvasRenderingContext2D, width: number, height: number, data: Uint8Array, bufferLength: number) => {
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#22d3ee'; // cyan-400
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#22d3ee';

  ctx.beginPath();
  const sliceWidth = width * 1.0 / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = data[i] / 128.0;
    const y = v * height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;
};

const drawCircular = (ctx: CanvasRenderingContext2D, cx: number, cy: number, data: Uint8Array, bufferLength: number) => {
  const radius = Math.min(cx, cy) * 0.4;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  const bars = 180; // Reduce bars for circular
  const step = Math.floor(bufferLength / bars);

  for (let i = 0; i < bars; i++) {
    const value = data[i * step];
    const angle = map(i, 0, bars, 0, Math.PI * 2);
    const h = map(value, 0, 255, 0, Math.min(cx, cy) * 0.5);

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + h);
    const y2 = cy + Math.sin(angle) * (radius + h);

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, '#6366f1'); // indigo
    gradient.addColorStop(1, '#a855f7'); // purple

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
};

const drawOrb = (ctx: CanvasRenderingContext2D, cx: number, cy: number, data: Uint8Array, bufferLength: number, sensitivity: number = 1.0) => {
  // Get bass frequencies (lower end of spectrum)
  let bass = 0;
  for(let i = 0; i < 20; i++) {
    bass += data[i];
  }
  bass = bass / 20; // Average bass value

  // Apply sensitivity to the scaling effect
  // Higher sensitivity = larger expansion for the same bass
  const scale = map(bass, 0, 255, 0.8, 1.4 * sensitivity);
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  
  // Glow
  const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.2, 'rgba(236, 72, 153, 0.6)'); // Pink
  gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.3)'); // Indigo
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 150, 0, Math.PI * 2);
  ctx.fill();

  // Draw wireframe circle based on frequencies
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  
  for(let i = 0; i < bufferLength; i += 10) {
      const angle = map(i, 0, bufferLength, 0, Math.PI * 2);
      const r = 80 + map(data[i], 0, 255, 0, 40 * sensitivity); // React more wildly if sensitive
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
};

const drawGridParticles = (ctx: CanvasRenderingContext2D, width: number, height: number, data: Uint8Array, bufferLength: number) => {
    // Static grid particles
    const rows = 20;
    const cols = 40;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const index = Math.floor(map(c + r * cols, 0, rows * cols, 0, bufferLength));
            const val = data[index];
            
            if (val > 50) {
                const x = c * cellW + cellW / 2;
                const y = r * cellH + cellH / 2;
                const size = map(val, 0, 255, 1, cellH * 0.8);
                
                ctx.beginPath();
                ctx.fillStyle = `hsla(${index % 360}, 70%, 60%, ${val / 255})`;
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};

const drawBeatParticles = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    data: Uint8Array, 
    bufferLength: number,
    state: VisualizerState,
    sensitivity: number = 1.0
) => {
    // Analyze bass/beat for trigger
    let bass = 0;
    // Calculate average bass (low frequencies)
    for(let i = 0; i < 15; i++) {
        bass += data[i];
    }
    bass = bass / 15;

    // Use additive blending for "glowing" look
    ctx.globalCompositeOperation = 'lighter';

    // Dynamic threshold logic
    const baseThreshold = 170;
    const effectiveThreshold = Math.max(80, baseThreshold - ((sensitivity - 1) * 70));
    
    // Beat Detected
    if (bass > effectiveThreshold && bass > state.beatThreshold) {
        // 1. Determine a central "Explosion" point
        const boomX = Math.random() * width;
        const boomY = Math.random() * height;
        const colorPalette = ['#f472b6', '#c084fc', '#818cf8', '#22d3ee', '#34d399', '#fbbf24', '#f87171'];
        const explosionColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

        // 2. Add a shockwave ring
        if (state.explosions) {
            state.explosions.push({
                x: boomX,
                y: boomY,
                radius: 1,
                alpha: 1.0,
                color: explosionColor
            });
        }

        // 3. Spawn particles radiating FROM the boom point
        const spawnCount = Math.floor(map(bass, effectiveThreshold, 255, 8, 20 * sensitivity));
        
        for(let i=0; i<spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 5 + 3) * sensitivity; // Fast initial speed
            const size = (Math.random() * 8 + 3) * sensitivity;

            state.particles.push({
                x: boomX,
                y: boomY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                color: explosionColor,
                size: size
            });
        }
    }
    
    // Smooth decay for beat threshold
    state.beatThreshold = bass * 0.90;
    if (state.beatThreshold < 100) state.beatThreshold = 100;

    // --- Update & Draw Shockwaves ---
    if (state.explosions) {
        for (let i = state.explosions.length - 1; i >= 0; i--) {
            const exp = state.explosions[i];
            
            // Expand
            exp.radius += 5 * sensitivity;
            exp.alpha -= 0.05;

            if (exp.alpha <= 0) {
                state.explosions.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.strokeStyle = exp.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = exp.alpha;
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // --- Update & Draw Particles ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        
        // Physics: High friction to simulate air resistance (fast start, slow stop)
        p.vx *= 0.92; 
        p.vy *= 0.92;
        
        p.life -= 0.02; // Fade out

        if (p.life <= 0) {
            state.particles.splice(i, 1);
            continue;
        }

        ctx.beginPath();
        ctx.fillStyle = p.color;
        
        // Size pulsation
        const currentSize = p.size * p.life; 
        
        ctx.globalAlpha = p.life;
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Reset composite operation and alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
};