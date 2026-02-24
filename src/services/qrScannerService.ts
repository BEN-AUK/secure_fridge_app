/**
 * 扫码服务：单例封装 html5-qrcode，避免多实例导致摄像头冲突。
 */
import { Html5Qrcode } from 'html5-qrcode';

let scanner: Html5Qrcode | null = null;

const DEFAULT_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
};

/**
 * 获取首选摄像头 ID（优先后置）。
 */
async function getPreferredCameraId(): Promise<string> {
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras || cameras.length === 0) {
    throw new Error('No camera found');
  }
  const back = cameras.find((c) => c.label.toLowerCase().includes('back'));
  return (back ?? cameras[0]).id;
}

export const qrScannerService = {
  /**
   * 启动扫码：绑定到指定容器，扫码成功时回调 onSuccess。
   * 若已有实例会先 stop 再创建新实例，保证单例。
   */
  async startScanner(
    elementId: string,
    onSuccess: (decodedText: string) => void
  ): Promise<void> {
    if (scanner) {
      await this.stopScanner();
    }
    scanner = new Html5Qrcode(elementId);
    const cameraId = await getPreferredCameraId();
    await scanner.start(
      cameraId,
      DEFAULT_CONFIG,
      (decodedText) => onSuccess(decodedText),
      () => {}
    );
  },

  /**
   * 停止扫码并释放摄像头。
   */
  async stopScanner(): Promise<void> {
    if (scanner) {
      try {
        await scanner.stop();
      } finally {
        scanner = null;
      }
    }
  },

  /**
   * 是否已有运行中的实例（供外部查询，可选）。
   */
  isRunning(): boolean {
    return scanner != null;
  },
};
