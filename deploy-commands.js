const { REST, Routes, ApplicationCommandType } = require('discord.js');
require('dotenv').config();

console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);

// Lista de comandos de aplicação (/)
const commands = [
    {
        name: 'ticket',
        description: 'Abre um ticket de suporte',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Iniciando a atualização dos comandos de aplicação (/)');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('Comandos de aplicação (/) registrados com sucesso');
    } catch (error) {
        console.error(error);
    }
})();