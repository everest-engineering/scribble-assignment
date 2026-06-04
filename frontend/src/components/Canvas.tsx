import React, { useRef, useEffect, useState } from 'react';

interface CanvasProps {
  isDrawer: boolean;
  drawerName?: string;
  onDraw: (data: any) => void;
  onClear: () => void;
  initialData?: any;
}

export const Canvas: React.FC<CanvasProps> = ({ isDrawer, drawerName, onDraw, onClear, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeSetRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !sizeSetRef.current) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      sizeSetRef.current = true;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 5;
        contextRef.current = context;
      }
    }

    const context = contextRef.current;
    if (context && canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (initialData && Array.isArray(initialData)) {
            context.beginPath();
            initialData.forEach((point: any) => {
                if (point.isStart) {
                    context.moveTo(point.x, point.y);
                } else {
                    context.lineTo(point.x, point.y);
                }
            });
            context.stroke();
        }
    }
  }, [initialData]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      onClear();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      offsetX: (clientX - rect.left) * scaleX,
      offsetY: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !contextRef.current) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    onDraw([{ x: offsetX, y: offsetY, isStart: true }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || !contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    onDraw([{ x: offsetX, y: offsetY, isStart: false }]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Canvas {drawerName ? `- ${drawerName} is drawing` : ''}</h3>
        {isDrawer && <button onClick={clearCanvas}>Clear Canvas</button>}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ 
            border: '1px solid black', 
            width: '100%', 
            height: '400px', 
            cursor: isDrawer ? 'crosshair' : 'default',
            pointerEvents: isDrawer ? 'auto' : 'none'
        }}
      />
    </div>
  );
};
