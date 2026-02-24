import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 替换为你最新的 API KEY (确保引号内无空格)
const API_KEY = "AIzaSyB-ttV4bQiua7ClwyJO5St8PvfiXwbOa9E"; 

const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName) {
  console.log(`\n--- Testing Model: ${modelName} ---`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // 使用简单的英文 prompt 避免 ByteString 编码问题
    const result = await model.generateContent("Hello, can you hear me?");
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS [${modelName}]: ${text.substring(0, 40)}...`);
  } catch (error) {
    console.error(`❌ FAILED [${modelName}]: ${error.message}`);
  }
}

async function run() {
  console.log("🚀 Starting Gemini High-Version Compatibility Test...");
  
  // 根据你的 curl 结果，测试以下几个明确出现在列表中的模型
  const modelsToTest = [
    "gemini-2.0-flash",       // 列表中的 2.0 版本
    "gemini-2.0-flash-001",   // 列表中的 2.0 稳定版
    "gemini-2.5-flash",       // 列表中的 2.5 版本
    "gemini-2.5-pro"          // 列表中的 2.5 Pro 版本
  ];

  for (const name of modelsToTest) {
    await testModel(name);
  }

  console.log("\n✨ Test completed. Please use the 'SUCCESS' one in your Cloud Functions.");
}

run();