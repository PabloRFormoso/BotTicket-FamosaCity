const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const logger = require('./functions/logger');
const connectDB = require('./database/db');
const { initializeUploadService } = require('./functions/uploadManager');

dotenv.config();

const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'MONGO_URI'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error('📝 Verifique o arquivo .env ou as configurações do Railway');
    process.exit(1);
}

console.log('✅ Variáveis de ambiente carregadas');

require('events').EventEmitter.defaultMaxListeners = 100;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping
    ]
});

function loadEvents(discordClient) {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));

        if (!event?.name || typeof event.execute !== 'function') {
            console.warn(`⚠️ Evento ignorado: ${file}`);
            continue;
        }

        const handler = (...args) => event.execute(...args);
        event.once
            ? discordClient.once(event.name, handler)
            : discordClient.on(event.name, handler);

        console.log(`✅ Evento carregado: ${file}`);
    }
}

function loadCommands(discordClient) {
    const commandsPath = path.join(__dirname, 'commands');

    // Somente arquivos .js diretamente dentro de /commands são carregados.
    // Banco, models e utilitários ficam fora dessa pasta.
    const commandFiles = fs.readdirSync(commandsPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => entry.name);

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));

            if (typeof command !== 'function') {
                console.warn(`⚠️ Comando ignorado: ${file}`);
                continue;
            }

            command(discordClient);
            console.log(`✅ Comando carregado: ${file}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar comando ${file}:`, error);
            throw error;
        }
    }
}

async function startBot() {
    try {
        await connectDB();

        loadEvents(client);
        loadCommands(client);
        initializeUploadService();

        await client.login(process.env.DISCORD_TOKEN);
        logger.info('Bot logado com sucesso!');
        console.log('✅ Bot conectado ao Discord');
    } catch (error) {
        logger.error(`Erro ao iniciar o bot: ${error.message}`);
        console.error('❌ Erro ao iniciar o bot:', error);
        process.exit(1);
    }
}

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startBot();
