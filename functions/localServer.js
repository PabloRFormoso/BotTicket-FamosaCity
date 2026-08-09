const express = require('express');
const fs = require('fs');
const path = require('path');

// Servidor simples para servir transcrições (GRATUITO)
// Adicionar no package.json: "express": "^4.18.0"

const app = express();
const PORT = process.env.TRANSCRIPT_PORT || 3001;
const TRANSCRIPTS_DIR = path.join(__dirname, '../transcripts');

// Middleware para servir arquivos estáticos
app.use('/transcripts', express.static(TRANSCRIPTS_DIR));

// Middleware para adicionar headers de segurança
app.use('/transcripts', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'text/html; charset=utf-8');
    next();
});

// Rota para listar transcrições (opcional)
app.get('/api/transcripts', (req, res) => {
    try {
        const files = fs.readdirSync(TRANSCRIPTS_DIR)
            .filter(file => file.endsWith('.html'))
            .map(file => ({
                name: file,
                url: `http://localhost:${PORT}/transcripts/${file}`,
                created: fs.statSync(path.join(TRANSCRIPTS_DIR, file)).birthtime
            }));
        
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
});

/**
 * Salva transcrição localmente e retorna URL do servidor local
 * @param {Buffer} buffer - Buffer do arquivo HTML
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} - URL local do arquivo
 */
async function saveToLocalServer(buffer, fileName) {
    try {
        // Garante que o diretório existe
        if (!fs.existsSync(TRANSCRIPTS_DIR)) {
            fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
        }

        // Salva o arquivo
        const filePath = path.join(TRANSCRIPTS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        // Retorna URL local
        const localUrl = `http://localhost:${PORT}/transcripts/${fileName}`;
        
        console.log(`Arquivo salvo localmente: ${localUrl}`);
        return localUrl;
        
    } catch (error) {
        console.error('Erro ao salvar arquivo local:', error);
        throw error;
    }
}

// Inicia servidor apenas se não estiver rodando
function startTranscriptServer() {
    app.listen(PORT, () => {
        console.log(`🌐 Servidor de transcrições rodando em http://localhost:${PORT}`);
        console.log(`📁 Servindo arquivos de: ${TRANSCRIPTS_DIR}`);
    });
}

module.exports = { 
    saveToLocalServer, 
    startTranscriptServer,
    app 
};
