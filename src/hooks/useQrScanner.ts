import { useEffect, useRef } from 'react';
import { qrScannerService } from '../services/qrScannerService';

/**
 * 封装扫码服务，在组件卸载时自动 stop，避免摄像头常亮。
 * 返回的 start 与 service 的 startScanner 一致；stop 供需要提前关闭时使用。
 */
export function useQrScanner() {
  const startedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        qrScannerService.stopScanner();
        startedRef.current = false;
      }
    };
  }, []);

  const start = async (elementId: string, onSuccess: (text: string) => void) => {
    startedRef.current = true;
    await qrScannerService.startScanner(elementId, onSuccess);
  };

  const stop = () => {
    startedRef.current = false;
    qrScannerService.stopScanner();
  };

  return { start, stop };
}
