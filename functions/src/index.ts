import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();


export const analyzeTemperature = functions
    .runWith({ secrets: ["GEMINI_API_KEY"] }) // 重点：声明使用这个密钥
    .firestore.document("logs/{docId}")
    .onCreate(async (snapshot, context) => {
        console.log("=== 函数版本 v2.0 启动 ===");
        const data = snapshot.data();
        console.log("当前 gs_address:", data?.gs_address);
        // 只有当有图片 URL 时才处理
        if (!data || !data.gs_address) return null;

        try {
            // 重点：从 process.env 直接读取，Firebase 会自动帮你注入
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // 核心 Prompt：告诉 AI 它要干什么
            const prompt = "你是一个专业的医疗设备审计员。请识别这张冰箱照片中温度计的数字。只返回数字（例如：4.2）。如果看不清，请返回 ERROR。";

            // 解析 gs:// 路径获取 bucket 名和文件名
            const gsPath = data.gs_address; // 例如 gs://mock-bucket/mock-photo.jpg
            console.log(gsPath);
            console.log(data.gs_address);
            const bucketName = gsPath.split("gs://")[1].split("/")[0];
            const filePath = gsPath.split(`gs://${bucketName}/`)[1];

            const bucket = admin.storage().bucket(bucketName);
            const [fileBuffer] = await bucket.file(filePath).download();
            const base64Data = fileBuffer.toString("base64");
            // ---------------------------------------

            // 调用 Gemini 1.5 Flash
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg",
                    },
                },
            ]);

            const text = result.response.text().trim();

            // 将识别结果写回数据库，并把状态改为已审核 (approved)
            return snapshot.ref.update({
                detected_temp: text !== "ERROR" ? parseFloat(text) : null,
                status: text !== "ERROR" ? "approved" : "failed_ai",
                ai_raw_response: text,
                analyzed_at: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error("AI 识别详细报错:", error);
            return snapshot.ref.update({ status: "error_ai" });
        }
    });