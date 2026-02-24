// src/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import { auth } from './services/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { useQrScanner } from './hooks/useQrScanner';
import CameraCapture from './components/CameraCapture';

const READER_ELEMENT_ID = 'reader-element';

const App: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [appStage, setAppStage] = useState<'HOME' | 'SCANNING' | 'CAPTURING'>('HOME');
  const [currentFridgeId, setCurrentFridgeId] = useState<string | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qrScanner = useQrScanner();

  useEffect(() => {
    const trySignIn = () => {
      signInAnonymously(auth)
        .then(() => {
          setIsAuthed(true);
        })
        .catch((err) => {
          console.error('Anonymous sign-in failed:', err);
          retryTimeoutRef.current = setTimeout(trySignIn, 5000);
        });
    };

    trySignIn();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    if (!isAuthed) {
      alert('SYSTEM OFFLINE: Please check your internet connection.');
      return;
    }
    setAppStage('SCANNING');
  };

  const handleScanSuccess = (decodedText: string) => {
    let id = decodedText;
    try {
      const data = JSON.parse(decodedText);
      id = data.id || decodedText; // 如果是 JSON 则取 id 字段
    } catch (e) {
      // 如果不是 JSON，直接使用原始文本作为 ID
    }
    qrScanner.stop();
    setCurrentFridgeId(id);
    setAppStage('CAPTURING');
  };

  const handleBackFromScan = async () => {
    await qrScanner.stop();
    setAppStage('HOME');
  };

  useEffect(() => {
    if (appStage !== 'SCANNING') return;
    qrScanner.start(READER_ELEMENT_ID, (decodedText) => handleScanSuccess(decodedText));
    return () => {
      qrScanner.stop();
    };
  }, [appStage]);

  const handleCaptureComplete = () => {
    setCurrentFridgeId(null);
    setAppStage('HOME');
  };

  if (appStage === 'CAPTURING' && currentFridgeId) {
    return (
      <CameraCapture
        fridgeId={currentFridgeId}
        onComplete={handleCaptureComplete}
      />
    );
  }

  if (appStage === 'SCANNING') {
    return (
      <div className="home-container home-container--scanning">
        <header className="home-header">
          <h1 className="home-title">准备扫码...</h1>
        </header>
        <div className="qr-reader-wrap">
          <div className="scanner-container">
            <div id={READER_ELEMENT_ID} />
            <div className="scanner-overlay" aria-hidden="true">
              <div className="scanner-frame">
                <div className="scanner-line" />
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="back-button"
          onClick={handleBackFromScan}
        >
          ← BACK TO HOME
        </button>
        <footer className="status-footer">
          <p>READY TO SCAN</p>
          <p className={isAuthed ? 'device-info' : 'device-info device-info--connecting'}>
            {isAuthed ? 'DEVICE: ONLINE' : 'DEVICE: CONNECTING...'}
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* 顶部标题：分成两行显示，增加视觉张力 */}
      <header className="home-header">
        <h1 className="home-title">
          WELCOME TO<br />
          <span className="highlight">SECURE FRIDGE</span>
        </h1>
      </header>

      {/* 中间波形图装饰：动态荧光绿条形，中心最高、两侧渐矮，随机节奏 */}
      <div className="waveform-container">
        {[...Array(20)].map((_, i) => {
          const distFromCenter = Math.abs(i - 9.5);
          const barMax = 10 + 40 * (1 - distFromCenter / 9.5);
          return (
            <div
              key={i}
              className="waveform-bar"
              style={
                {
                  '--bar-max': `${barMax}px`,
                  animationDelay: `${(i * 0.06 + (i % 4) * 0.08)}s`,
                  animationDuration: `${0.35 + (i % 5) * 0.12}s`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      {/* 核心圆形按钮：未登录时点击提示，已登录进入 SCANNING */}
      <div className="button-wrapper">
        <button type="button" className="start-button" onClick={handleStart}>
          <div className="button-inner">
            <span className="button-text-main">START</span>
            <span className="button-text-sub">RECORDING</span>
          </div>
        </button>
      </div>

      {/* 底部静态状态栏：未登录显示 CONNECTING 并红色 */}
      <footer className="status-footer">
        <p>READY TO SCAN</p>
        <p className={isAuthed ? 'device-info' : 'device-info device-info--connecting'}>
          {isAuthed ? 'DEVICE: ONLINE' : 'DEVICE: CONNECTING...'}
        </p>
      </footer>
    </div>
  );
};

export default App;
