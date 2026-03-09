const { onRequest } = require('firebase-functions/v2/https');
const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');

admin.initializeApp();

exports.generate = onRequest(
    {
        cors: true,
        region: 'europe-west1',
        maxInstances: 3,
        timeoutSeconds: 300,
        memory: '512MiB',
    },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        /* ---- Auth: verify Firebase ID token ---- */
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing authorization header' });
            return;
        }
        try {
            await admin.auth().verifyIdToken(authorization.split('Bearer ')[1]);
        } catch {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        /* ---- Validate body ---- */
        const { prompt, model } = req.body;
        if (typeof prompt !== 'string' || !prompt.trim()) {
            res.status(400).json({ error: 'Missing or empty prompt' });
            return;
        }
        if (typeof model !== 'string' || !model.trim()) {
            res.status(400).json({ error: 'Missing model' });
            return;
        }

        /* ---- SSE headers ---- */
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {
            const vertexAI = new VertexAI({
                project: 'soundenglish-homework',
                location: 'europe-west1',
            });
            const generativeModel = vertexAI.getGenerativeModel({ model });

            const request = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            };
            const streamResult = await generativeModel.generateContentStream(request);

            for await (const chunk of streamResult.stream) {
                const text =
                    chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } catch (err) {
            if (res.headersSent) {
                res.write(
                    `data: ${JSON.stringify({ error: err.message })}\n\n`
                );
                res.end();
            } else {
                res.status(500).json({ error: err.message });
            }
        }
    }
);
