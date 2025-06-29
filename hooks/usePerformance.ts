import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  frameRate: number;
  interactionTime: number;
}

interface PerformanceData {
  componentName: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

export const usePerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const startRenderTimer = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTimer = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    InteractionManager.runAfterInteractions(() => {
      setMetrics(prev => ({
        ...prev,
        renderTime,
        timestamp: Date.now(),
      }));
    });
  }, []);

  const measureInteraction = useCallback((interactionName: string, fn: () => void) => {
    const startTime = performance.now();
    fn();
    const interactionTime = performance.now() - startTime;
    
    console.log(`[Performance] ${componentName} - ${interactionName}: ${interactionTime.toFixed(2)}ms`);
    
    setMetrics(prev => ({
      ...prev,
      interactionTime,
    }));
  }, [componentName]);

  const logPerformance = useCallback((data: Partial<PerformanceMetrics>) => {
    console.log(`[Performance] ${componentName}:`, data);
  }, [componentName]);

  return {
    metrics,
    startRenderTimer,
    endRenderTimer,
    measureInteraction,
    logPerformance,
  };
};

export const useFrameRate = () => {
  const [frameRate, setFrameRate] = useState<number>(60);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  useEffect(() => {
    const measureFrameRate = () => {
      const now = performance.now();
      frameCount.current++;

      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
        setFrameRate(fps);
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }, []);

  return frameRate;
};

export const useMemoryUsage = () => {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if (global.performance?.memory) {
        const memory = global.performance.memory;
        const usageMB = memory.usedJSHeapSize / (1024 * 1024);
        setMemoryUsage(usageMB);
      }
    };

    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}; 