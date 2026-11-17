import { useEffect, useRef } from "react";

export function triggerXpCelebration(amount: number | string, label?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("joseph-xp-awarded", {
        detail: { amount, label },
      })
    );
  }
}

interface PhysicsBubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  amount: number | string;
  label?: string;
  birthTime: number;
  lifeMs: number;
  seed: number;
  squash: number;
  squashAngle: number;
}

export function XpBubbleEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<PhysicsBubble[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI crisp retina scaling
    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Continuous 60fps/120fps physics simulation loop
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dtMs = Math.min(now - lastTime, 32); // cap frame delta to 32ms
      const dt = dtMs / 16.666; // normalized to 60fps step
      lastTime = now;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      const bubbles = bubblesRef.current;

      // 1. Natural pairwise elastic collision physics ("bounce off the other")
      for (let i = 0; i < bubbles.length; i++) {
        const b1 = bubbles[i];
        for (let j = i + 1; j < bubbles.length; j++) {
          const b2 = bubbles[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = b1.radius + b2.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist; // collision normal x
            const ny = dy / dist; // collision normal y
            const overlap = minDist - dist;

            // Soft positional separation so bubbles never overlap or stick
            const sep = overlap * 0.52;
            b1.x -= nx * sep;
            b1.y -= ny * sep;
            b2.x += nx * sep;
            b2.y += ny * sep;

            // Velocity along collision normal
            const relVx = b1.vx - b2.vx;
            const relVy = b1.vy - b2.vy;
            const vn = relVx * nx + relVy * ny;

            // Bounce elastically if colliding
            if (vn > 0) {
              const restitution = 0.82; // elastic bounce coefficient
              const impulse = ((1 + restitution) * vn) / (1 / b1.mass + 1 / b2.mass);

              b1.vx -= (impulse / b1.mass) * nx;
              b1.vy -= (impulse / b1.mass) * ny;
              b2.vx += (impulse / b2.mass) * nx;
              b2.vy += (impulse / b2.mass) * ny;

              // Elastic deformation / squash on collision impact
              b1.squash = 0.86;
              b2.squash = 0.86;
              b1.squashAngle = Math.atan2(ny, nx);
              b2.squashAngle = Math.atan2(ny, nx);
            }
          }
        }
      }

      // 2. Integration: Natural buoyancy, organic fluid sway, boundary reflections
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const age = now - b.birthTime;

        // Lifespan expiration: exactly 5 seconds
        if (age >= b.lifeMs || b.y + b.radius < -120) {
          bubbles.splice(i, 1);
          continue;
        }

        // Natural buoyancy acceleration: gentle upward pull
        b.vy -= 0.02 * dt;
        // Clamp vertical speed: buoyant, never sinks like a rock
        if (b.vy < -3.2) b.vy = -3.2;
        if (b.vy > -0.7) b.vy = -0.7;

        // Natural organic fluid sway (air current turbulence)
        const sway = Math.sin((now - b.birthTime) * 0.0028 + b.seed) * 0.18;
        b.vx += sway * 0.08 * dt;
        b.vx *= Math.pow(0.985, dt); // fluid horizontal drag

        // Position update
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Viewport side wall bounces
        if (b.x - b.radius < 4) {
          b.x = b.radius + 4;
          b.vx = Math.abs(b.vx) * 0.75;
        } else if (b.x + b.radius > width - 4) {
          b.x = width - b.radius - 4;
          b.vx = -Math.abs(b.vx) * 0.75;
        }

        // Elastic recovery from collision squash back to round circle
        b.squash += (1.0 - b.squash) * (0.12 * dt);

        // Alpha envelope over 5.0 seconds (smooth fade in, sustained presence, gentle fade out)
        let alpha = 0.95;
        if (age < 350) {
          alpha = (age / 350) * 0.95;
        } else if (age > 4100) {
          alpha = Math.max(0, 0.95 * ((b.lifeMs - age) / 900));
        }

        // 3. Draw realistic optical glass bubble with light navy blue rim and text
        const r = b.radius;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Apply elastic squash transform around bubble center
        ctx.translate(b.x, b.y);
        ctx.rotate(b.squashAngle);
        ctx.scale(1 / b.squash, b.squash);
        ctx.rotate(-b.squashAngle);

        // Translucent glass refraction gradient using transparent versions of #24248f
        const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.06, 0, 0, r);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
        grad.addColorStop(0.35, "rgba(36, 36, 143, 0.08)");
        grad.addColorStop(0.70, "rgba(36, 36, 143, 0.18)");
        grad.addColorStop(1, "rgba(36, 36, 143, 0.32)");

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Exact App Theme Navy Border Rim (#24248f)
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(36, 36, 143, 0.72)";
        ctx.stroke();

        // Top-Left Specular Reflection Glint
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.34, r * 0.28, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
        ctx.fill();

        // Bottom-Right Subtle Caustic Glow in Brand Navy
        ctx.beginPath();
        ctx.ellipse(r * 0.30, r * 0.28, r * 0.20, r * 0.12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(36, 36, 143, 0.40)";
        ctx.fill();

        // Restore context to unrotated state for crystal-sharp text rendering
        ctx.restore();

        // Draw Exact Brand Navy Typography Inside Bubble (#24248f)
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(b.x, b.y);

        const fontSize = r < 19 ? 10 : 11.5;
        ctx.font = `850 ${fontSize}px "Manrope Variable", -apple-system, sans-serif`;
        ctx.fillStyle = "#24248f"; // Exact brand navy
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 2;
        ctx.fillText(`+${b.amount}xp`, 0, 0.5);

        // Optional appreciation anchor badge floating with primary bubble
        if (b.label) {
          ctx.shadowBlur = 0;
          ctx.font = `800 9px "Manrope Variable", -apple-system, sans-serif`;
          const textMetrics = ctx.measureText(b.label);
          const pillW = textMetrics.width + 14;
          const pillH = 18;
          const pillY = r + 6;

          ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
          ctx.strokeStyle = "rgba(36, 36, 143, 0.50)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-pillW / 2, pillY, pillW, pillH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#24248f";
          ctx.fillText(b.label, 0, pillY + pillH / 2);
        }

        ctx.restore();
      }

      // Keep animation running as long as bubbles are active, or pause to save CPU
      if (bubbles.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
        ctx.clearRect(0, 0, width, height);
      }
    };

    // Event listener: spawns plenty of small circular bubbles that bounce off each other
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ amount: number | string; label?: string }>;
      const { amount, label } = customEvent.detail || { amount: 10 };

      const now = performance.now();
      const count = Math.floor(22 + Math.random() * 7); // 22 to 28 bubbles
      const width = window.innerWidth;
      const height = window.innerHeight;

      const newBubbles: PhysicsBubble[] = [];

      for (let i = 0; i < count; i++) {
        // Organic horizontal distribution across screen width
        const x = 30 + Math.random() * (width - 60);
        // Staggered spawn heights near bottom so they rise as a fluid cluster
        const y = height + 10 + Math.random() * 70;
        // Natural initial upward velocity (varied speeds)
        const vy = -(1.5 + Math.random() * 1.3);
        const vx = (Math.random() - 0.5) * 1.2;
        // Small, delicate spheres (34px to 46px diameter -> radius 17px to 23px)
        const radius = Math.floor(17 + Math.random() * 6);
        const mass = Math.pow(radius / 20, 2);

        newBubbles.push({
          id: `${now}-${i}`,
          x,
          y,
          vx,
          vy,
          radius,
          mass,
          amount,
          label: i === 0 ? label : undefined,
          birthTime: now,
          lifeMs: 5000, // 5 seconds float
          seed: Math.random() * 100,
          squash: 1.0,
          squashAngle: 0,
        });
      }

      bubblesRef.current.push(...newBubbles);

      // Start loop if not already running
      if (!animFrameRef.current) {
        lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("joseph-xp-awarded", handleEvent);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("joseph-xp-awarded", handleEvent);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
      }}
    />
  );
}
