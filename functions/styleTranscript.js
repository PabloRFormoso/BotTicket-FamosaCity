function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(d);
}

function formatDuration(start, end) {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return '-';

    let seconds = Math.floor((endMs - startMs) / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

function categoryLabel(reason) {
    const labels = {
        suporte: 'Suporte',
        denuncia: 'Denúncia',
        bug: 'Bug',
        donate: 'Donate'
    };
    return labels[String(reason || '').toLowerCase()] || String(reason || 'Não informado');
}

function cssUrl(url) {
    const value = String(url || '').trim();
    if (!value) return 'none';
    return `url("${value.replace(/"/g, '%22')}")`;
}

function styleTranscript(input, metadata = {}) {
    let html = Buffer.isBuffer(input) ? input.toString('utf8') : String(input ?? '');

    // Remove o cabeçalho padrão do discord-html-transcripts (nome do servidor/canal)
    // e o rodapé padrão "Exported X messages. Powered by...".
    // O transcript passa a usar somente o cabeçalho/rodapé personalizados da Famosa City.
    html = html
        .replace(/<discord-header\b[^>]*>[\s\S]*?<\/discord-header>/gi, '')
        .replace(/<[^>]+>\s*Exported\s+\d+\s+messages?[\s\S]*?Powered by[\s\S]*?<\/[^>]+>/gi, '')
        .replace(/Exported\s+\d+\s+messages?\.\s*Powered by\s*<a[^>]*>discord-html-transcripts<\/a>\.?/gi, '');

    const openedAt = metadata.openedAt || new Date();
    const closedAt = metadata.closedAt || new Date();
    const backgroundUrl = process.env.TRANSCRIPT_BACKGROUND_URL;
    const logoUrl = process.env.TRANSCRIPT_LOGO_URL;

    const css = `
<style id="famosa-transcript-theme">
:root {
    --fc-cyan: #00d9ff;
    --fc-cyan-soft: rgba(0,217,255,.18);
    --fc-blue: #168cff;
    --fc-bg: #020a10;
    --fc-panel: rgba(3,14,22,.88);
    --fc-panel-2: rgba(7,20,31,.92);
    --fc-border: rgba(0,217,255,.28);
    --fc-text: #f4f8fb;
    --fc-muted: #88a3b5;
}
* { box-sizing: border-box; }
html {
    height: 100% !important;
    overflow: hidden !important;
    background: #02070c !important;
}
body {
    height: 100vh !important;
    min-height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    color: var(--fc-text) !important;
    background:
        linear-gradient(180deg, rgba(0,7,13,.54), rgba(0,4,8,.91)),
        radial-gradient(circle at 78% 14%, rgba(0,217,255,.13), transparent 28%),
        radial-gradient(circle at 16% 18%, rgba(23,92,160,.20), transparent 30%),
        ${cssUrl(backgroundUrl)},
        linear-gradient(135deg, #06131f 0%, #020a10 50%, #010508 100%) !important;
    background-size: cover !important;
    background-position: center !important;
    background-attachment: fixed !important;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    padding: 188px 34px 78px 350px !important;
}
body::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(rgba(0,217,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,217,255,.018) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, black, transparent 80%);
    z-index: -1;
}
#famosa-transcript-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 160px;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26px 54px 24px 64px;
    background: linear-gradient(180deg, rgba(2,10,16,.98), rgba(2,10,16,.88) 75%, rgba(2,10,16,0));
    backdrop-filter: blur(10px);
}
.fc-brand {
    display: flex;
    align-items: center;
    gap: 18px;
}
.fc-logo-image {
    width: 205px;
    max-height: 98px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px rgba(0,217,255,.20));
}
.fc-logo-text {
    line-height: .84;
    font-weight: 1000;
    letter-spacing: -4px;
    font-style: italic;
    text-transform: uppercase;
    color: white;
    font-size: 46px;
    text-shadow: 0 4px 0 rgba(255,255,255,.13), 0 0 24px rgba(0,217,255,.10);
}
.fc-logo-text span {
    display: block;
    color: var(--fc-cyan);
    font-size: 34px;
    letter-spacing: -2px;
    margin-left: 56px;
    text-shadow: 0 0 20px rgba(0,217,255,.45);
}
.fc-header-title { text-align: right; }
.fc-header-title strong {
    display: block;
    color: var(--fc-cyan);
    font-size: 17px;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.fc-header-title small {
    display: block;
    color: #b8cad5;
    margin-top: 6px;
    font-size: 13px;
}
#famosa-ticket-sidebar {
    position: fixed;
    z-index: 9997;
    top: 146px;
    left: 44px;
    bottom: 42px;
    width: 280px;
    overflow: auto;
    padding: 24px 22px;
    border: 1px solid var(--fc-border);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(3,15,24,.96), rgba(2,9,15,.92));
    box-shadow: 0 20px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.025);
    backdrop-filter: blur(16px);
}
.fc-sidebar-title {
    display: flex;
    gap: 10px;
    align-items: center;
    color: white;
    font-size: 13px;
    text-transform: uppercase;
    font-weight: 800;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(0,217,255,.28);
    margin-bottom: 16px;
}
.fc-sidebar-title b { color: var(--fc-cyan); font-size: 18px; }
.fc-info { padding: 10px 0 12px; border-bottom: 1px solid rgba(255,255,255,.055); }
.fc-info:last-child { border: 0; }
.fc-info .label {
    display: block;
    color: var(--fc-cyan);
    font-size: 10px;
    letter-spacing: .8px;
    text-transform: uppercase;
    margin-bottom: 4px;
}
.fc-info .value {
    color: #edf7fb;
    font-size: 12.5px;
    line-height: 1.45;
    overflow-wrap: anywhere;
}
#famosa-transcript-content {
    position: relative;
    max-width: 1320px;
    height: calc(100vh - 266px);
    min-height: 320px;
    margin: 0 auto;
    border: 1px solid var(--fc-border);
    border-radius: 18px;
    overflow: hidden !important;
    background: rgba(2,10,16,.68);
    box-shadow: 0 30px 90px rgba(0,0,0,.40);
    backdrop-filter: blur(9px);
}
#famosa-transcript-content > * { max-width: none !important; }
discord-header { display: none !important; }
discord-messages {
    position: absolute !important;
    inset: 0 !important;
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow-x: hidden !important;
    overflow-y: scroll !important;
    overscroll-behavior: contain !important;
    scrollbar-gutter: stable;
    background: transparent !important;
    padding: 14px 18px 24px !important;
}
/* Segurança extra contra o rodapé padrão da biblioteca, caso mude de wrapper. */
discord-messages + div,
discord-messages + footer {
    display: none !important;
}
discord-message {
    display: block !important;
    width: min(76%, 900px) !important;
    margin-top: 9px !important;
    margin-bottom: 9px !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    box-shadow: 0 8px 22px rgba(0,0,0,.16) !important;
}

/* Player: esquerda */
discord-message.fc-player {
    margin-left: 0 !important;
    margin-right: auto !important;
    border: 1px solid rgba(50,112,255,.24) !important;
    border-left: 3px solid rgba(50,112,255,.95) !important;
    background: linear-gradient(90deg, rgba(8,18,38,.97), rgba(5,15,28,.91)) !important;
}

/* Staff: direita */
discord-message.fc-staff {
    margin-left: auto !important;
    margin-right: 0 !important;
    border: 1px solid rgba(0,217,255,.24) !important;
    border-right: 3px solid rgba(0,217,255,.95) !important;
    background: linear-gradient(270deg, rgba(3,31,39,.98), rgba(5,18,27,.92)) !important;
}

/* Bot/terceiros: centro */
discord-message.fc-system {
    width: min(86%, 980px) !important;
    margin-left: auto !important;
    margin-right: auto !important;
    border: 1px solid rgba(255,255,255,.07) !important;
    background: rgba(7,17,26,.90) !important;
}

discord-message.fc-player:hover { border-color: rgba(50,112,255,.45) !important; }
discord-message.fc-staff:hover { border-color: rgba(0,217,255,.45) !important; }
@media (max-width: 820px) {
    discord-message,
    discord-message.fc-player,
    discord-message.fc-staff,
    discord-message.fc-system {
        width: 94% !important;
    }
}
discord-embed { border-radius: 10px !important; overflow: hidden !important; }
a { color: #44e4ff !important; }
::-webkit-scrollbar { width: 9px; height: 9px; }
::-webkit-scrollbar-track { background: rgba(0,0,0,.22); }
::-webkit-scrollbar-thumb { background: rgba(0,217,255,.35); border-radius: 20px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,217,255,.55); }

#famosa-verification {
    position: fixed;
    right: 34px;
    bottom: 18px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 520px;
    padding: 9px 12px;
    border: 1px solid rgba(0,217,255,.34);
    border-radius: 11px;
    background: rgba(2,12,18,.94);
    box-shadow: 0 10px 35px rgba(0,0,0,.34);
    color: #9db4c2;
    font-size: 10px;
    backdrop-filter: blur(12px);
}
#famosa-verification strong { color: #66ecff; font-size: 11px; }
#famosa-verification a { color: #66ecff !important; font-weight: 800; text-decoration: none; }

#famosa-transcript-footer {
    max-width: 1320px;
    height: 42px;
    margin: 10px auto 0;
    padding: 10px 16px;
    text-align: center;
    color: #7892a3;
    font-size: 11px;
}
#famosa-transcript-footer strong { color: var(--fc-cyan); }
@media (max-width: 900px) {
    body { padding: 140px 14px 18px !important; }
    #famosa-transcript-header { height: 125px; padding: 18px 20px; }
    .fc-logo-image { width: 145px; }
    .fc-logo-text { font-size: 30px; letter-spacing: -2px; }
    .fc-logo-text span { font-size: 23px; margin-left: 34px; }
    .fc-header-title strong { font-size: 12px; }
    .fc-header-title small { font-size: 10px; }
    #famosa-ticket-sidebar {
        position: relative;
        top: auto; left: auto; bottom: auto;
        width: auto;
        margin: 0 0 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 16px;
    }
    .fc-sidebar-title { grid-column: 1 / -1; }
    #famosa-transcript-content {
        height: calc(100vh - 390px);
        min-height: 260px;
    }
    #famosa-transcript-footer { display: none; }
}
@media (max-height: 720px) and (min-width: 901px) {
    body { padding-top: 150px !important; padding-bottom: 18px !important; }
    #famosa-transcript-header { height: 125px; }
    #famosa-ticket-sidebar { top: 125px; bottom: 18px; }
    #famosa-transcript-content { height: calc(100vh - 205px); }
    #famosa-transcript-footer { display: none; }
}
</style>`;

    const logo = logoUrl
        ? `<img class="fc-logo-image" src="${escapeHtml(logoUrl)}" alt="Famosa City">`
        : `<div class="fc-logo-text">FAMOSA <span>CITY</span></div>`;

    const chrome = `
<div id="famosa-transcript-header">
    <div class="fc-brand">${logo}</div>
    <div class="fc-header-title">
        <strong>Transcript de Atendimento</strong>
        <small>Famosa City • Suporte Oficial</small>
    </div>
</div>
<aside id="famosa-ticket-sidebar">
    <div class="fc-sidebar-title"><b>▣</b> Informações do Ticket</div>
    <div class="fc-info"><span class="label">Ticket ID</span><span class="value">#${escapeHtml(metadata.ticketId || '-')}</span></div>
    <div class="fc-info"><span class="label">Categoria</span><span class="value">${escapeHtml(categoryLabel(metadata.reason))}</span></div>
    <div class="fc-info"><span class="label">Aberto por</span><span class="value">${escapeHtml(metadata.userName || 'Usuário')}<br>${escapeHtml(metadata.userId || '')}</span></div>
    <div class="fc-info"><span class="label">Atendido por</span><span class="value">${escapeHtml(metadata.staffName || 'Staff')}<br>${escapeHtml(metadata.staffId || '')}</span></div>
    <div class="fc-info"><span class="label">Aberto em</span><span class="value">${escapeHtml(formatDate(openedAt))}</span></div>
    <div class="fc-info"><span class="label">Fechado em</span><span class="value">${escapeHtml(formatDate(closedAt))}</span></div>
    <div class="fc-info"><span class="label">Duração</span><span class="value">${escapeHtml(formatDuration(openedAt, closedAt))}</span></div>
    <div class="fc-info"><span class="label">Canal</span><span class="value">#${escapeHtml(metadata.channelName || '-')}</span></div>
</aside>`;

    const footer = `
<div id="famosa-transcript-footer">
    <strong>Famosa City</strong> • Suporte Oficial<br>
    Este transcript é confidencial e destinado às partes envolvidas no atendimento.
</div>`;

    const verificationBadge = metadata.verificationCode && metadata.verificationUrl
        ? `<div id="famosa-verification"><span>✓ Documento verificável</span><strong>${escapeHtml(metadata.verificationCode)}</strong><a href="${escapeHtml(metadata.verificationUrl)}" target="_blank" rel="noopener">Verificar</a></div>`
        : '';



    const messageSideScript = `
<script id="famosa-message-sides">
(() => {
    const staffId = ${JSON.stringify(String(metadata.staffId || ''))};
    const playerId = ${JSON.stringify(String(metadata.userId || ''))};

    function getAuthorId(message) {
        // discord-html-transcripts usa o atributo profile com o ID do autor.
        const profileId = message.getAttribute('profile');
        if (profileId && /^\d{15,22}$/.test(profileId)) return profileId;

        const candidates = [
            message.getAttribute('profile'),
            message.getAttribute('author'),
            message.getAttribute('author-id'),
            message.getAttribute('authorid'),
            message.getAttribute('user-id'),
            message.getAttribute('userid'),
            message.dataset?.author,
            message.dataset?.authorId,
            message.dataset?.userId
        ].filter(Boolean);

        for (const value of candidates) {
            const match = String(value).match(/\\d{15,22}/);
            if (match) return match[0];
        }

        const raw = message.outerHTML || '';
        if (staffId && raw.includes(staffId)) return staffId;
        if (playerId && raw.includes(playerId)) return playerId;
        return '';
    }

    function classifyMessages() {
        document.querySelectorAll('discord-message').forEach(message => {
            message.classList.remove('fc-player', 'fc-staff', 'fc-system');
            const authorId = getAuthorId(message);

            if (staffId && authorId === staffId) {
                message.classList.add('fc-staff');
            } else if (playerId && authorId === playerId) {
                message.classList.add('fc-player');
            } else {
                message.classList.add('fc-system');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', classifyMessages, { once: true });
    } else {
        classifyMessages();
    }

    setTimeout(classifyMessages, 100);
    setTimeout(classifyMessages, 500);
    setTimeout(classifyMessages, 1200);

    const observer = new MutationObserver(() => classifyMessages());
    const messagesRoot = document.querySelector('discord-messages');
    if (messagesRoot) {
        observer.observe(messagesRoot, { childList: true, subtree: true });
    }
})();
</script>`;

    if (html.includes('</head>')) {
        html = html.replace('</head>', `${css}\n<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMwMjBhMTAiLz48cGF0aCBkPSJNMzIgOCA1NSA1Mkg0M2wtNC04SDI1bC00IDhIOUwzMiA4Wm0wIDIwLTUgMTBoMTBMMzIgMjhaIiBmaWxsPSIjMDBkOWZmIi8+PHBhdGggZD0iTTMyIDggNDMgMjloLTlsLTItNC0yIDRoLTlMMzIgOFoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=">\n</head>`);
    } else {
        html = `${css}${html}`;
    }

    if (html.includes('<body')) {
        html = html.replace(/(<body[^>]*>)/i, `$1\n${chrome}\n<div id="famosa-transcript-content">`);
        html = html.replace(/<\/body>/i, `</div>${footer}${verificationBadge}${messageSideScript}</body>`);
    } else {
        html = `${chrome}<div id="famosa-transcript-content">${html}</div>${footer}${verificationBadge}${messageSideScript}`;
    }

        
    const pageTitle = `Famosa City • Transcript #${metadata.ticketId || ''}`;

    if (html.includes('<title>')) {
        html = html.replace(
            /<title>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(pageTitle)}</title>`
        );
    } else {
        html = html.replace(
            '</head>',
            `<title>${escapeHtml(pageTitle)}</title></head>`
        );
    }

    return Buffer.from(html, 'utf8');
}

module.exports = { styleTranscript };
