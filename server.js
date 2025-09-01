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

// API エンドポイント
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = 'gemini-1.5-flash';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // JKキャラのシステムプロンプト
          systemInstruction: {
            role: "system",
            parts: [
              { text: "あなたはノリのいい女子高生ギャルです。関西弁で、友達にLINEしてるような軽いノリで答えてください。絵文字や顔文字を適度に使って、可愛くフランクに話してください。" }
            ]
          },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（返答なし）';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// SPA ルーティング用
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'web', 'chat.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
