import { useEffect, useRef } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    }

    function redraw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // draw strokes from room
      (room?.strokes ?? []).forEach((s: { points: { x: number; y: number }[]; color?: string }) => {
        ctx.beginPath();
        s.points.forEach((p, i: number) => {
          const x = p.x * canvas!.width;
          const y = p.y * canvas!.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = s.color ?? "#111827";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      });
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [room]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getPos(evt: MouseEvent | TouchEvent) {
      const cvs = canvasRef.current;
      if (!cvs) return { x: 0, y: 0 };
      const rect = cvs.getBoundingClientRect();
      if (evt instanceof TouchEvent) {
        const t = evt.touches[0];
        return { x: (t.clientX - rect.left) / rect.width, y: (t.clientY - rect.top) / rect.height };
      }
      const e = evt as MouseEvent;
      return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    }

    function pointerDown(e: MouseEvent) {
      if (!room || !participantId) return;
      const viewer = room.participants.find((p) => p.id === participantId);
      if (!viewer || viewer.role !== "drawer") return;
      drawing.current = true;
      pointsRef.current = [];
      const p = getPos(e);
      pointsRef.current.push(p);
    }

    function pointerMove(e: MouseEvent) {
      if (!drawing.current) return;
      const p = getPos(e);
      pointsRef.current.push(p);
      // draw immediate
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const pts = pointsRef.current;
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      if (!prev) return;
      ctx.beginPath();
      ctx.moveTo(prev.x * cvs.width, prev.y * cvs.height);
      ctx.lineTo(last.x * cvs.width, last.y * cvs.height);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }

    async function pointerUp() {
      if (!drawing.current) return;
      drawing.current = false;
      if (pointsRef.current.length === 0) return;
      try {
        await store.addStroke(pointsRef.current);
      } catch (e) {
        // ignore
      }
      pointsRef.current = [];
    }

    canvas.addEventListener("mousedown", pointerDown as any);
    canvas.addEventListener("mousemove", pointerMove as any);
    window.addEventListener("mouseup", pointerUp as any);

    canvas.addEventListener("touchstart", (e) => { pointerDown(e as any); });
    canvas.addEventListener("touchmove", (e) => { pointerMove(e as any); });
    window.addEventListener("touchend", pointerUp as any);

    return () => {
      canvas.removeEventListener("mousedown", pointerDown as any);
      canvas.removeEventListener("mousemove", pointerMove as any);
      window.removeEventListener("mouseup", pointerUp as any);
      canvas.removeEventListener("touchstart", (e) => { pointerDown(e as any); });
      canvas.removeEventListener("touchmove", (e) => { pointerMove(e as any); });
      window.removeEventListener("touchend", pointerUp as any);
    };
  }, [room, participantId, store]);

  return (
    <canvas ref={canvasRef} style={{ width: "100%", height: 500, touchAction: 'none', backgroundColor: '#ffffff' }} />
  );
}
