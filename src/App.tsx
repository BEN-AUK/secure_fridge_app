// src/App.tsx
import React, { useEffect, useState } from 'react';
import { db, auth } from './services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import CameraCapture from './components/CameraCapture';
import AdminSeeder from './components/AdminSeeder'; // 引入刚才写的开发者页面
import type { FridgeData } from './utils/dataSeeder';

const App: React.FC = () => {
  // 核心状态
  const [viewMode, setViewMode] = useState<'admin' | 'app' | 'loading'>('loading');
  
  // 业务状态
  const [fridge, setFridge] = useState<FridgeData | null>(null);
  const [fridgeId, setFridgeId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);
      
      // 1. 拦截开发者模式
      if (params.get('mode') === 'admin') {
        setViewMode('admin');
        return;
      }

      // 2. 正常业务：静默匿名登录
      try {
        await signInAnonymously(auth);
        
        const token = params.get('token');
        if (!token) {
          setErrorMsg('⚠️ 请扫描冰箱上的有效二维码进入系统');
          setViewMode('app');
          return;
        }

        // 去数据库校验该冰箱 Token
        const docRef = doc(db, "fridges", token);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFridge(docSnap.data() as FridgeData);
          setFridgeId(token);
        } else {
          setErrorMsg('❌ 无效的二维码：该设备未在系统中注册');
        }
      } catch (error) {
        console.error("初始化错误:", error);
        setErrorMsg('系统连接错误，请刷新重试');
      } finally {
        setViewMode('app');
      }
    };

    initApp();
  }, []);

  // 渲染分发逻辑
  if (viewMode === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">正在连接核心系统...</div>;
  }

  // 👉 如果是开发者模式，渲染刚才的黑底注入页面
  if (viewMode === 'admin') {
    return <AdminSeeder />;
  }

  // 👉 正常用户的错误提示
  if (errorMsg) {
    return <div className="p-10 text-center font-bold text-red-600 mt-20">{errorMsg}</div>;
  }

  // 👉 正常用户的打卡界面
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center">
      <header className="w-full bg-white p-4 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-800">SecureFridge 打卡终端</h1>
        {fridge && <p className="text-sm text-green-600">设备已锁定: {fridge.name}</p>}
      </header>

      {fridge && <CameraCapture fridgeId={fridgeId} fridgeName={fridge.name} />}
    </div>
  );
};

export default App;