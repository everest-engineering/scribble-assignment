import React, { useEffect, useRef, useState } from "react";
import { useRoomState } from "../state/roomStore";
import { api } from "../services/api";
import { createCanvasEventSender } from "../services/drawing";

export function DrawerCanvas() {
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const [sender, setSender] = useState<any>(null);

  const isDrawer = !!(room && participantId && room.drawerId === participantId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    // guard for test environments where canvas.getContext is not implemented
    if (typeof (canvas as any).getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#111827";
    ctxRef.current = ctx;
  }, []);

  // replay canvas events when room snapshot updates (drawer snapshot includes events)
  useEffect(() => {
    const events = (room?.canvasEvents ?? []) as any[];
    const ctx = ctxRef.current;
    if (!ctx) return;
    // clear
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const ev of events) {
      if (ev.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (ev.type === "draw") {
        const p = ev.payload;
        // payload may be a segment { x,y }
        if (Array.isArray(p)) {
          for (let i = 1; i < p.length; i++) {
            const a = p[i - 1];
            const b = p[i];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }
  }, [room?.canvasEvents]);

  useEffect(() => {
    if (!room || !participantId) return;
    if (isDrawer) {
      const s = createCanvasEventSender(
        room.code,
        participantId,
        api.postCanvasEvent
      );
      setSender(s);
      return () => {
        s.stop();
      };
    }
    return undefined;
  }, [room?.code, participantId, isDrawer]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const me = e as React.MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawer) return;
    drawing.current = true;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // start a small segment buffer
    (drawerBuffer as any).push({ x: pos.x, y: pos.y });
  }

  let drawerBuffer: Array<{ x: number; y: number }> = [];

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawer) return;
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    drawerBuffer.push({ x: pos.x, y: pos.y });
    // batch locally: flush if large
    if (drawerBuffer.length > 20 && sender) {
      sender.send({ type: "draw", payload: drawerBuffer.splice(0) });
    }
  }

  function handlePointerUp() {
    if (!isDrawer) return;
    drawing.current = false;
    if (drawerBuffer.length > 0 && sender) {
      sender.send({ type: "draw", payload: drawerBuffer.splice(0) });
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", minHeight: 500, background: "white" }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      aria-label="drawer-canvas"
    />
  );
}

export default DrawerCanvas;
