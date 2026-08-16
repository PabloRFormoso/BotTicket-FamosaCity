const fs = require('fs');
const path = require('path');

function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
}

async function uploadToXampp(buffer, fileName) {
    const transcriptsPath = String(process.env.XAMPP_TRANSCRIPTS_PATH || '').trim();
    const baseUrl = normalizeBaseUrl(process.env.TRANSCRIPT_BASE_URL);

    if (!transcriptsPath) {
        throw new Error('XAMPP_TRANSCRIPTS_PATH não configurado no .env');
    }

    if (!baseUrl) {
        throw new Error('TRANSCRIPT_BASE_URL não configurado no .env');
    }

    await fs.promises.mkdir(transcriptsPath, { recursive: true });

    // Impede que o nome recebido consiga escapar da pasta de transcripts.
    const safeFileName = path.basename(fileName);
    if (!safeFileName || safeFileName !== fileName) {
        throw new Error('Nome de arquivo de transcript inválido');
    }

    const destination = path.join(transcriptsPath, safeFileName);
    await fs.promises.writeFile(destination, buffer);

    // Evita listagem de diretório no Apache/XAMPP.
    const htaccessPath = path.join(transcriptsPath, '.htaccess');
    try {
        await fs.promises.writeFile(
            htaccessPath,
            'Options -Indexes\n',
            { flag: 'wx' }
        );
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }

    return `${baseUrl}/${encodeURIComponent(safeFileName)}`;
}

function validateXamppConfig() {
    const missing = [];

    if (!String(process.env.XAMPP_TRANSCRIPTS_PATH || '').trim()) {
        missing.push('XAMPP_TRANSCRIPTS_PATH');
    }

    if (!String(process.env.TRANSCRIPT_BASE_URL || '').trim()) {
        missing.push('TRANSCRIPT_BASE_URL');
    }

    if (missing.length) {
        throw new Error(`Configurações do XAMPP faltando no .env: ${missing.join(', ')}`);
    }
}

module.exports = {
    uploadToXampp,
    validateXamppConfig
};
