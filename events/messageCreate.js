const fs = require('fs');
const path = require('path');
const Ticket = require('../models/Ticket'); // Importa o modelo de Ticket

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        // Ignora mensagens de bot
        if (message.author.bot) return;
        
        // Verifica se a mensagem está em um canal de ticket
        const ticket = await Ticket.findOne({ channelId: message.channel.id });
        if (!ticket) return;

        // Garante que o diretório de transcripts existe (backup local opcional)
        const transcriptsDir = path.join(__dirname, '../transcripts');
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        // Salva a mensagem no arquivo de transcript (backup local)
        const transcriptPath = path.join(transcriptsDir, `${ticket.channelId}.html`);
        const logMessage = `[${message.createdAt.toISOString()}] [${message.author.tag}] ${message.content}\n`;

        fs.appendFile(transcriptPath, logMessage, (err) => {
            if (err) console.error('Erro ao salvar o transcript local:', err);
        });
    });
};