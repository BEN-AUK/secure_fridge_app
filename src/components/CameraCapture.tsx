import React, { useEffect, useRef, useState } from 'react';
import './CameraCapture.css';
import { storage, db } from '../services/firebaseConfig';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';

interface CameraCaptureProps {
  fridgeId: string;
  fridgeName: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ fridgeId, fridgeName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 状态管理
  const [error, setError] = useState<string>('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false); // 快门闪烁状态

  useEffect(() => {
    // 1. 初始化相机：强制后置摄像头，请求高清分辨率
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err: any) {
        console.error("相机开启失败:", err);
        setError(`无法访问相机: ${err.name}。请确保使用独立浏览器并授予 HTTPS 权限。`);
      }
    };

    // 2. 实时 GPS 追踪
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS 信号弱:", err.message),
      { enableHighAccuracy: true }
    );

    startCamera();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 核心功能：拍摄、打水印、上传
  const handleCapture = async () => {
    if (!videoRef.current || isUploading) return;

    // --- 1. 立即交互反馈 ---
    setIsCapturing(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setIsCapturing(false), 150); // 150ms 后快门关闭
    // -----------------------

    setIsUploading(true);

    try {
      // 2. 创建画布并处理图像
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("无法创建画布上下文");

      // 绘制原始视频帧
      ctx.drawImage(videoRef.current, 0, 0);

      // --- 3. 注入物理水印 (不可篡改存证) ---
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
      
      ctx.fillStyle = "white";
      ctx.font = "bold 26px Arial";
      const timeStr = new Date().toLocaleString();
      const locStr = gps ? `GPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : "GPS: 信号未锁定";
      
      ctx.fillText(`📍 设备: ${fridgeName}`, 40, canvas.height - 75);
      ctx.fillText(`⏰ ${timeStr}`, 40, canvas.height - 35);
      ctx.font = "20px Monospace";
      ctx.fillText(locStr, 40, canvas.height - 105);
      // ------------------------------------

      // 4. 导出高质量图片
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      
      // 5. 云端同步：仅当 uploadToFirebase 完全执行完毕且无报错时才提示成功
      await uploadToFirebase(imageData);
      alert("✅ 同步成功");
    } catch (err: any) {
      console.error("存证失败:", err);
      alert("❌ 存证失败: " + (err?.message ?? String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  // 云端上传逻辑：强制顺序执行，无内部 try/catch，错误直接抛给 handleCapture
  const uploadToFirebase = async (base64Image: string) => {
    const timestamp = Date.now();
    const fileName = `evidence/${fridgeId}/${timestamp}.jpg`;
    const storageRef = ref(storage, fileName);

    // 步骤 1：必须先 await uploadString 成功，再取 downloadURL
    const uploadResult = await uploadString(storageRef, base64Image, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    const gsAddress = `gs://${storageRef.bucket}/${storageRef.fullPath}`;

    // 步骤 2：再 await addDoc 成功写入 Firestore（含 gs_address）
    await addDoc(collection(db, "logs"), {
      fridge_id: fridgeId,
      photo_url: downloadURL,
      gs_address: gsAddress,
      evidence_metadata: {
        gps_location: gps ? new GeoPoint(gps.lat, gps.lng) : null,
        device_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      },
      server_timestamp: serverTimestamp(),
      status: "pending",
      compliance_status: "on_time"
    });
  };

  return (
    <div className="camera-capture">
      {/* 1. Status HUD (pinned top) */}
      <header className="camera-capture__hud">
        <div className="camera-capture__hud-line">
          {gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS: Signal Searching...'}
        </div>
        <div className="camera-capture__hud-line">DEVICE: {fridgeName}</div>
        <hr className="camera-capture__hud-sep" aria-hidden="true" />
      </header>

      {/* 2. Viewfinder container (video does not push controls off-screen) */}
      <div className="camera-capture__viewfinder">
        <div className="camera-capture__video-wrap">
          {error ? (
            <div className="camera-capture__error">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline />
          )}
        </div>
        {isCapturing && <div className="camera-capture__shutter-flash" aria-hidden="true" />}
      </div>

      {/* 3. Bottom: shutter button + status (fixed, always visible) */}
      <div className="camera-capture__controls">
        <button
          type="button"
          className="camera-capture__btn"
          onClick={handleCapture}
          disabled={isUploading}
          aria-label={isUploading ? 'Uploading' : 'Capture evidence'}
        >
          <div className="camera-capture__btn-glow" />
          <div className="camera-capture__btn-ring" />
          <div className="camera-capture__btn-inner">
            <span className="camera-capture__btn-icon" />
          </div>
        </button>
        {isUploading && (
          <div className="camera-capture__progress" role="progressbar" aria-label="Uploading">
            <div className="camera-capture__progress-bar" />
          </div>
        )}
        <p className="camera-capture__status-text">
          {isUploading ? 'UPLOADING EVIDENCE...' : 'Push to Certify'}
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;