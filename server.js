// server.js
import express from 'express';
import fetch from 'node-fetch'; // Node 18+ なら標準 fetch で可
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// 会話履歴を保持（最新10件だけ）
let history = [];

// API エンドポイント
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = 'gemini-1.5-flash';

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY が設定されていません' });
  }

  // ユーザーの発言を履歴に追加
  history.push({ role: 'user', parts: [{ text: userMessage }] });
  if (history.length > 10) history.shift();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history,
          systemInstruction: `
あなたは明るく元気な女子高生です。
友達とLINEで雑談しているように、タメ口でフランクに話してください。
語尾に「〜だよ！」「〜だね」「〜かな？」をよく使い、かわいらしい雰囲気を意識してください。
          `,
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（返答なし）';

    // AIの返答を履歴に追加
    history.push({ role: 'model', parts: [{ text: reply }] });
    if (history.length > 10) history.shift();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// SPA ルーティング
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'web', 'chat.html'));
});

app.listen(PORT, () => console.log(`✅ JKチャットが起動しました → http://localhost:${PORT}`));
