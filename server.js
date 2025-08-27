  import express from 'express';
  import fetch from 'node-fetch';

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

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
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          }),
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（返答なし）';
      res.json({ reply });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'エラーが発生しました' });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
