const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.clear();
        let ativy = [
            `🎮・A Famosa City`,
            //`🌐| Divulgue`,
            //`⚜️| DEV Pabliito.jpg`,
        ],
        at = 0;
        setInterval(() => client.user.setPresence({
            activities: [
                {
                    name: `${ativy[at++ % ativy.length]}`,
                    type: ActivityType.Playing,
                    url: 'https://cfx.re/join/964l8b'
                }
            ],
            status: 'online'
        }), 1000 * 5);
                // Mostrar todos os comandos carregados
        if (client.commands) {
            console.log('\n[Comandos carregados]:');
            client.commands.forEach(cmd => {
                console.log(`- ${cmd.data?.name || cmd.name}`);
            });
        }
        console.log(("\n[Info]: ") + `✔️  BOT EM ATIVIDADE!`);
    },
};