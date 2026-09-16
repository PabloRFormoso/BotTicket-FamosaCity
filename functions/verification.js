const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
}

function createVerificationCode() {
    // 12 bytes = 96 bits aleatórios. Ex.: A1B2-C3D4-E5F6-A7B8-C9D0-E1F2
    return crypto.randomBytes(12).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
}

function createTranscriptHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getVerificationUrl(code) {
    const transcriptBase = normalizeBaseUrl(process.env.TRANSCRIPT_BASE_URL);
    const customBase = normalizeBaseUrl(process.env.TRANSCRIPT_VERIFY_BASE_URL);
    const base = customBase || `${transcriptBase}/verificar`;
    return `${base}/${encodeURIComponent(code)}.html`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

function buildVerificationPage(data) {
    const {
        verificationCode,
        transcriptHash,
        transcriptUrl,
        ticketId,
        userId,
        userName,
        staffId,
        staffName,
        reason,
        closedAt
    } = data;

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>A Famosa City • Transcript Oficial</title>\n<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMwMjBhMTAiLz48cGF0aCBkPSJNMzIgOCA1NSA1Mkg0M2wtNC04SDI1bC00IDhIOUwzMiA4Wm0wIDIwLTUgMTBoMTBMMzIgMjhaIiBmaWxsPSIjMDBkOWZmIi8+PHBhdGggZD0iTTMyIDggNDMgMjloLTlsLTItNC0yIDRoLTlMMzIgOFoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=">
<style>
:root{--cyan:#00d9ff;--bg:#02070c;--panel:#06131d;--text:#eef8fb;--muted:#8aa4b5}
*{box-sizing:border-box} body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px;background:
radial-gradient(circle at 20% 10%,rgba(0,217,255,.14),transparent 32%),
linear-gradient(145deg,#061622,#02070c 58%,#010407);font-family:Inter,system-ui,Segoe UI,sans-serif;color:var(--text)}
.card{width:min(760px,100%);border:1px solid rgba(0,217,255,.28);border-radius:20px;background:rgba(3,14,22,.93);
box-shadow:0 30px 100px rgba(0,0,0,.48);overflow:hidden}
.head{padding:28px 30px;border-bottom:1px solid rgba(0,217,255,.18);display:flex;justify-content:space-between;gap:20px;align-items:center}
.brand{font-weight:900;font-style:italic;font-size:25px}.brand span{color:var(--cyan)}
.ok{color:#75f6b4;border:1px solid rgba(117,246,180,.32);background:rgba(117,246,180,.08);padding:9px 13px;border-radius:999px;font-weight:800;font-size:12px}
.body{padding:28px 30px}.title{font-size:24px;font-weight:900;margin:0 0 6px}.sub{color:var(--muted);margin-bottom:26px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.item{padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.025)}
.label{display:block;color:var(--cyan);font-size:10px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}.value{font-size:13px;overflow-wrap:anywhere}
.hash{margin-top:14px;padding:15px;border-radius:12px;background:#01070b;border:1px solid rgba(0,217,255,.18);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;overflow-wrap:anywhere}
.actions{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}.btn{display:inline-block;text-decoration:none;color:#001018;background:var(--cyan);font-weight:900;padding:11px 16px;border-radius:10px}.note{margin-top:24px;color:var(--muted);font-size:12px;line-height:1.55}
@media(max-width:620px){.grid{grid-template-columns:1fr}.head{align-items:flex-start;flex-direction:column}}
</style>
</head>
<body>
<div class="card">
<div class="head"><div class="brand">A FAMOSA <span>CITY</span></div><div class="ok">✓ REGISTRO OFICIAL</div></div>
<div class="body">
<h1 class="title">Transcript Oficial</h1>
<div class="sub">O conteudo de todas os atendimentos do ticket são armazenados no momento do encerramento do atendimento.</div>
<div class="grid">
<div class="item"><span class="label">Código</span><span class="value">${escapeHtml(verificationCode)}</span></div>
<div class="item"><span class="label">Ticket</span><span class="value">#${escapeHtml(ticketId)}</span></div>
<div class="item"><span class="label">Aberto por</span><span class="value">${escapeHtml(userName)} (${escapeHtml(userId)})</span></div>
<div class="item"><span class="label">Finalizado por</span><span class="value">${escapeHtml(staffName)} (${escapeHtml(staffId)})</span></div>
<div class="item"><span class="label">Categoria</span><span class="value">${escapeHtml(reason || '-')}</span></div>
<div class="item"><span class="label">Finalizado em</span><span class="value">${escapeHtml(formatDate(closedAt))}</span></div>
</div>
<span class="label" style="margin-top:18px">SHA-256 do HTML oficial</span>
<div class="hash">${escapeHtml(transcriptHash)}</div>
<div class="actions"><a class="btn" href="${escapeHtml(transcriptUrl)}">Abrir transcript oficial</a></div>
<div class="note">Qualquer alterações feitas afetam apenas a cópia exibida naquele navegador. O arquivo oficial continua armazenado nos arquivos da cidade. Para conferir uma prova ou print, abra esta página pelo código de verificação e compare os dados do atendimento.</div>
</div>
</div>
</body>
</html>`;
}

async function saveVerificationPage(code, html) {
    const transcriptsPath = String(process.env.XAMPP_TRANSCRIPTS_PATH || '').trim();
    if (!transcriptsPath) throw new Error('XAMPP_TRANSCRIPTS_PATH não configurado no .env');

    const verifyDir = path.join(transcriptsPath, 'verificar');
    await fs.promises.mkdir(verifyDir, { recursive: true });

    const safeCode = String(code).replace(/[^A-F0-9-]/gi, '');
    if (!safeCode || safeCode !== code) throw new Error('Código de verificação inválido');

    await fs.promises.writeFile(path.join(verifyDir, `${safeCode}.html`), html, 'utf8');

    try {
        await fs.promises.writeFile(path.join(verifyDir, '.htaccess'), 'Options -Indexes\n', { flag: 'wx' });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }

    return getVerificationUrl(code);
}

module.exports = {
    createVerificationCode,
    createTranscriptHash,
    getVerificationUrl,
    buildVerificationPage,
    saveVerificationPage
};
