// src/utils/dataSeeder.ts
import { db } from '../services/firebaseConfig';
import { doc, setDoc, serverTimestamp, GeoPoint, FieldValue } from 'firebase/firestore';

// 1. 定义严谨的数据接口 (Interfaces)
export interface FridgeData {
  name: string;
  location: string;
  temp_threshold: { min: number; max: number };
  schedule_windows: string[];
  created_at: FieldValue;
}

export interface LogData {
  fridge_id: string;
  operator_uid: string;
  photo_url: string;
  evidence_metadata: {
    gps_location: GeoPoint;
    device_timestamp: string;
    user_agent: string;
  };
  server_timestamp: FieldValue;
  ai_analysis: { temperature: number; confidence: number };
  status: 'normal' | 'abnormal' | 'pending';
  compliance_status: 'on_time' | 'expired';
  correction: string | null;
}

// 2. 导出可复用的播种函数
export const seedDatabase = async (): Promise<void> => {
  try {
    // 注入 Fridge 数据
    const fridgeData: FridgeData = {
      name: "后厨1号冷柜",
      location: "一楼厨房内场",
      temp_threshold: { min: 0, max: 5 },
      schedule_windows: ["08:00-09:00", "14:00-15:00", "20:00-21:00"],
      created_at: serverTimestamp()
    };
    await setDoc(doc(db, "fridges", "TEST_001"), fridgeData);

    // 注入 Log 数据
    const logData: LogData = {
      fridge_id: "TEST_001",
      operator_uid: "mock_anonymous_uid_123",
      photo_url: "gs://mock-bucket/mock-photo.jpg",
      evidence_metadata: {
        gps_location: new GeoPoint(39.9042, 116.4074),
        device_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      },
      server_timestamp: serverTimestamp(),
      ai_analysis: { temperature: 4.2, confidence: 0.98 },
      status: "normal",
      compliance_status: "on_time",
      correction: null
    };
    await setDoc(doc(db, "logs", "MOCK_LOG_001"), logData);

    // 注入 User 数据
    await setDoc(doc(db, "users", "MOCK_OWNER_UID"), {
      role: "owner",
      fcm_tokens: ["mock_device_token_abc123"],
      last_active: serverTimestamp()
    });

    console.log("✅ 数据库三大核心表结构初始化成功！");
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    throw error; // 将错误向上抛出，交由 UI 处理
  }
};