import express from 'express';
import fetch from 'node-fetch';  // Node 18+ なら標準 fetch で可
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

let history = []; // 会話履歴

// API エンドポイント
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = 'gemini-1.5-flash';

  try {
    // 履歴にユーザー発言を追加
    history.push({ role: 'user', parts: [{ text: userMessage }] });

    const body = {
      // 会話履歴を送る
      contents: history,
      // JKキャラ用の指示
      systemInstruction: `
あなたは明るく元気な女子高生です。
友達とLINEで雑談している口調で話してください。
語尾に「〜だよ！」「〜だね」「〜かな？」などをよく使い、親しみやすく振る舞ってください。
敬語はあまり使わず、同年代の友達として会話してください。
      `
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（返答なし）';

    // 履歴にAI返答を追加
    history.push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// SPAルーティング
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'web', 'chat.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
