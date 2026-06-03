import { useEffect, useRef, useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { DrawingAction } from "../services/api";

interface Point {
  x: number;
  y: number;
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { room, participantId } = useRoomState();
  const roomStore = useRoomStore();
  const isDrawer = room?.drawerId === participantId;
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Render everything when drawing state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";

    if (room?.drawingState) {
      room.drawingState.forEach(action => {
        if (action.type === "CLEAR") {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (action.type === "DRAW" && action.data) {
           const path: Point[] = action.data.path;
           if (path && path.length > 0) {
             ctx.beginPath();
             ctx.moveTo(path[0].x, path[0].y);
             for (let i = 1; i < path.length; i++) {
               ctx.lineTo(path[i].x, path[i].y);
             }
             ctx.stroke();
           }
        }
      });
    }

    // Render current path for smoother local drawing
    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [room?.drawingState, currentPath]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Scale coordinates based on actual rendered size vs internal resolution
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handlePointerUp = async () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 0) {
      const action: DrawingAction = {
        type: "DRAW",
        data: { path: currentPath },
        timestamp: Date.now()
      };
      // Send to server without awaiting to avoid blocking
      roomStore.submitDrawing(action).catch(console.error);
    }
    setCurrentPath([]);
  };

  const clearCanvas = async () => {
    if (!isDrawer) return;
    const action: DrawingAction = {
      type: "CLEAR",
      timestamp: Date.now()
    };
    roomStore.submitDrawing(action).catch(console.error);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: '100%' }}>
      {isDrawer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="button button--secondary" onClick={clearCanvas}>
            Clear Canvas
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          touchAction: 'none',
          cursor: isDrawer ? 'crosshair' : 'default'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
