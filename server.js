// server.js
import express from 'express';
import fetch from 'node-fetch'; // Node 18+ は標準 fetch で可
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // .env を読み込む

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSON のパース
app.use(express.json());

// 静的ファイル（フロント）配信
app.use(express.static(path.join(__dirname, 'web')));

// 会話履歴管理
let history = [];

// API エンドポイント
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY が設定されていません' });
  }

  // ユーザー発言を履歴に追加
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    contents: history,
    systemInstruction: `
あなたは明るく元気な女子高生です。
友達とLINEで雑談している口調で返してください。
語尾に「〜だよ！」「〜だね」「〜かな？」などをよく使い、親しみやすく振る舞ってください。
敬語は使わず、同年代の友達として会話してください。
    `
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（返答なし）';

    // AI返答を履歴に追加
    history.push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// SPA 用ルーティング（全て chat.html に返す）
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'web', 'chat.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
