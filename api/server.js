const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.get('/health', (req, res) => res.send('Proxy is running!'));
app.get('/v1/models', (req, res) => res.json({ object: "list", data: [] }));

app.post('/v1/chat/completions', async (req, res) => {
    try {
        const nvidiaApiKey = process.env.NVIDIA_API_KEY;
        if (!nvidiaApiKey) {
            return res.status(500).json({ error: "NVIDIA_API_KEY is missing" });
        }

        const modelName = req.body.model || "deepseek-ai/deepseek-r1";

        const nvidiaResponse = await fetch('https://nvidia.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${nvidiaApiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: req.body.messages,
                temperature: req.body.temperature || 0.7,
                top_p: req.body.top_p || 1,
                max_tokens: req.body.max_tokens || 4096,
                stream: false
            })
        });

        const data = await nvidiaResponse.json();
        if (!nvidiaResponse.ok) return res.status(nvidiaResponse.status).json(data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

module.exports = app;

