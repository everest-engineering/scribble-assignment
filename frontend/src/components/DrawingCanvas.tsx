import { useCallback, useEffect, useRef, useState } from "react";
import { api, type CanvasPoint, type CanvasStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: CanvasStroke[];
  readOnly: boolean;
  roomCode: string;
  participantId: string;
}

const STROKE_COLOR = "#111827";
const STROKE_WIDTH = 2;
const SYNC_DEBOUNCE_MS = 400;

function drawStrokes(canvas: HTMLCanvasElement | null, strokeList: CanvasStroke[]) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokeList) {
    if (stroke.points.length === 0) {
      continue;
    }

    context.strokeStyle = stroke.color ?? STROKE_COLOR;
    context.lineWidth = stroke.width ?? STROKE_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let index = 1; index < stroke.points.length; index += 1) {
      context.lineTo(stroke.points[index].x, stroke.points[index].y);
    }

    context.stroke();
  }
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

export function DrawingCanvas({
  strokes,
  readOnly,
  roomCode,
  participantId
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localStrokes, setLocalStrokes] = useState<CanvasStroke[]>(strokes);
  const localStrokesRef = useRef(localStrokes);
  const activeStrokeRef = useRef<CanvasStroke | null>(null);
  const isDrawingRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  localStrokesRef.current = localStrokes;
  const displayStrokes = readOnly ? strokes : localStrokes;

  const scheduleSync = useCallback(
    (nextStrokes: CanvasStroke[]) => {
      if (readOnly) {
        return;
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        void api.updateCanvas(roomCode, participantId, nextStrokes).catch(() => undefined);
      }, SYNC_DEBOUNCE_MS);
    },
    [participantId, readOnly, roomCode]
  );

  const flushSync = useCallback(
    (nextStrokes: CanvasStroke[]) => {
      if (readOnly) {
        return;
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      void api.updateCanvas(roomCode, participantId, nextStrokes).catch(() => undefined);
    },
    [participantId, readOnly, roomCode]
  );

  useEffect(() => {
    if (readOnly) {
      return;
    }

    if (!isDrawingRef.current) {
      setLocalStrokes(strokes);
    }
  }, [readOnly, strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    resizeCanvas(canvas);
    drawStrokes(canvas, displayStrokes);

    const observer = new ResizeObserver(() => {
      resizeCanvas(canvas);
      drawStrokes(canvas, displayStrokes);
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [displayStrokes]);

  useEffect(
    () => () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    },
    []
  );

  function toCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): CanvasPoint {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) {
      return { x: 0, y: 0 };
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;

    const point = toCanvasPoint(event);
    const stroke: CanvasStroke = {
      points: [point],
      color: STROKE_COLOR,
      width: STROKE_WIDTH
    };
    activeStrokeRef.current = stroke;

    setLocalStrokes((previous) => {
      const nextStrokes = [...previous, stroke];
      drawStrokes(canvasRef.current, nextStrokes);
      return nextStrokes;
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !isDrawingRef.current || !activeStrokeRef.current) {
      return;
    }

    const point = toCanvasPoint(event);
    activeStrokeRef.current.points.push(point);

    setLocalStrokes((previous) => {
      const nextStrokes = [
        ...previous.slice(0, -1),
        { ...activeStrokeRef.current!, points: [...activeStrokeRef.current!.points] }
      ];
      drawStrokes(canvasRef.current, nextStrokes);
      return nextStrokes;
    });
  }

  function finishStroke() {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    activeStrokeRef.current = null;
    scheduleSync(localStrokesRef.current);
  }

  function handlePointerUp() {
    finishStroke();
  }

  function handleClear() {
    if (readOnly) {
      return;
    }

    setLocalStrokes([]);
    drawStrokes(canvasRef.current, []);
    flushSync([]);
  }

  return (
    <div className="drawing-canvas-wrap">
      <canvas
        ref={canvasRef}
        className={`drawing-canvas${readOnly ? " drawing-canvas--readonly" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {!readOnly ? (
        <div className="button-row button-row--compact drawing-canvas__actions">
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
