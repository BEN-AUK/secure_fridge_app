// src/components/AdminSeeder.tsx
import React, { useState } from 'react';
import { seedDatabase } from '../utils/dataSeeder';

const AdminSeeder: React.FC = () => {
  const [status, setStatus] = useState<string>('等待执行...');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSeed = async () => {
    setIsLoading(true);
    setStatus('正在注入数据，请稍候...');
    try {
      await seedDatabase();
      setStatus('✅ 数据库注入成功！请前往 Firebase 控制台查看。');
    } catch (error: any) {
      setStatus(`❌ 注入失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-6">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl text-center border border-gray-700 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-white">开发者后台 (Admin)</h1>
        <p className="text-sm text-gray-400 mb-8">用于重置或注入 Firestore 测试数据</p>
        
        <button 
          onClick={handleSeed}
          disabled={isLoading}
          className={`w-full py-4 font-bold rounded-lg transition-all ${
            isLoading ? 'bg-gray-600 text-gray-300' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
          }`}
        >
          {isLoading ? '注入中...' : '⚠️ 覆盖注入测试数据'}
        </button>
        
        <div className="mt-6 p-4 bg-black rounded text-sm font-mono text-green-400 break-words">
          {status}
        </div>
      </div>
    </div>
  );
};

export default AdminSeeder;