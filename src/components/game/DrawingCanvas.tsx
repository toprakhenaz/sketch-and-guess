
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, RefreshCcw } from 'lucide-react'; // RefreshCcw for undo

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
  onDrawEnd?: (dataUrl: string) => void; // Callback when drawing action ends
  disabled?: boolean; // To disable drawing
}

export interface DrawingCanvasRef {
  getDrawingAsDataURL: (type?: string, quality?: number) => string | undefined;
  clearCanvas: () => void;
  loadDrawingFromDataURL: (dataUrl: string) => void;
  undoLastStroke: () => void;
}

const DrawingCanvas = React.forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width = 500, height = 400, lineWidth = 5, strokeColor = '#000000', backgroundColor = 'white', onDrawEnd, disabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);


    const initializeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = strokeColor;
      context.lineWidth = lineWidth;
      contextRef.current = context;

      // Fill canvas with background color
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory(); // Save initial state
    }, [width, height, lineWidth, strokeColor, backgroundColor]);

    useEffect(() => {
      initializeCanvas();
    }, [initializeCanvas]);
    
    const saveHistory = useCallback(() => {
        if (contextRef.current && canvasRef.current) {
            const imageData = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHistory(prev => [...prev.slice(-10), imageData]); // Keep last 10 states for undo
        }
    }, []);

    const undoLastStroke = useCallback(() => {
        if (history.length > 1) { // Keep initial state
            const newHistory = history.slice(0, -1);
            const lastState = newHistory[newHistory.length - 1];
            if (contextRef.current && lastState) {
                contextRef.current.putImageData(lastState, 0, 0);
            }
            setHistory(newHistory);
            if (onDrawEnd && canvasRef.current) {
              onDrawEnd(canvasRef.current.toDataURL('image/png', 0.95));
            }
        }
    }, [history, onDrawEnd]);


    const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { offsetX: number, offsetY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();

      if (event.nativeEvent instanceof MouseEvent) {
        return { offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY };
      } else if (event.nativeEvent instanceof TouchEvent && event.nativeEvent.touches.length > 0) {
          return { 
            offsetX: event.nativeEvent.touches[0].clientX - rect.left,
            offsetY: event.nativeEvent.touches[0].clientY - rect.top
          };
      }
      return null;
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      const coords = getCoordinates(event);
      if (!coords || !contextRef.current) return;
      
      saveHistory(); // Save state before new stroke begins

      const { offsetX, offsetY } = coords;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      if (event.cancelable) event.preventDefault();
    };

    const finishDrawing = () => {
      if (disabled || !isDrawing) return;
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
      
      if (onDrawEnd && canvasRef.current) {
        onDrawEnd(canvasRef.current.toDataURL('image/png', 0.95)); // Use lower quality for faster sync
      }
      saveHistory(); // Save state after stroke is finished
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled || !isDrawing || !contextRef.current) return;
      const coords = getCoordinates(event);
      if (!coords) return;
      const { offsetX, offsetY } = coords;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      if (event.cancelable) event.preventDefault();
    };

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = strokeColor; // Reset stroke style
        context.lineWidth = lineWidth;
        setHistory([]); // Clear history
        saveHistory(); // Save cleared state
        if (onDrawEnd) {
          onDrawEnd(canvas.toDataURL('image/png', 0.95));
        }
      }
    }, [backgroundColor, strokeColor, lineWidth, onDrawEnd, saveHistory]);

    const getDrawingAsDataURL = useCallback((type = 'image/png', quality = 0.95): string | undefined => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        
        // This section ensures background is applied if it's not transparent
        // It's generally better if canvas always has its background drawn
        const context = contextRef.current;
        if(context && backgroundColor !== 'transparent') {
            const existingCompositeOperation = context.globalCompositeOperation;
            const existingFillStyle = context.fillStyle;
            
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL(type, quality);
            
            // Restore previous composite operation and fill style
            // This also means we need to redraw the current drawing on top if it was cleared
            // This part is tricky and might be simplified if background is always opaque
            // For now, we assume the initial fill in useEffect/initializeCanvas is sufficient
            // and the user will handle drawing on top of it.

            context.globalCompositeOperation = existingCompositeOperation;
            // context.fillStyle = existingFillStyle; // This might not be needed if we redraw

            // To correctly restore, one might need to re-apply the last history state
            // if it was modified by the fillRect.
            // However, if `destination-over` is used, current drawing stays on top.
            
            return dataUrl;
        }
        return canvas.toDataURL(type, quality);
      }, [backgroundColor]);

    const loadDrawingFromDataURL = useCallback((dataUrl: string) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            const image = new Image();
            image.onload = () => {
                // Clear canvas first with background color
                context.fillStyle = backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
                // Then draw the loaded image
                context.drawImage(image, 0, 0);
                saveHistory();
            };
            image.src = dataUrl;
        }
    }, [backgroundColor, saveHistory]);


    React.useImperativeHandle(ref, () => ({
      getDrawingAsDataURL,
      clearCanvas,
      loadDrawingFromDataURL,
      undoLastStroke,
    }));

    return (
      <div className="flex flex-col items-center space-y-2">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing} 
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          className={`border border-gray-300 rounded-md shadow-sm ${disabled ? 'cursor-not-allowed bg-muted' : 'cursor-crosshair bg-white'}`}
          style={{ touchAction: 'none' }} // Prevent page scroll on touch devices
          data-ai-hint="drawing area multiplayer"
        />
        {!disabled && (
          <div className="flex space-x-2">
            <Button onClick={clearCanvas} variant="outline" size="sm">
              <Eraser className="mr-2 h-4 w-4" />
              Temizle
            </Button>
            <Button onClick={undoLastStroke} variant="outline" size="sm" disabled={history.length <= 1}>
                <RefreshCcw className="mr-2 h-4 w-4 transform scale-x-[-1]" />
                Geri Al
            </Button>
          </div>
        )}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
export { DrawingCanvas };
