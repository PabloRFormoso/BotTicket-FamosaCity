const { Events, ActivityType } = require("discord.js");

const SITE = process.env.FAMOSA_SITE || "famosacity.com.br";
const INTERVAL = 40 * 1000;

const CUSTOM_EMOJI = {
    name: "logoazul",
    id: "1540838148513202326"
};

function setPresenceSafe(client, presence) {
    try {
        client.user.setPresence(presence);
    } catch (error) {
        const fallback = {
            ...presence,
            activities: presence.activities.map((activity) => {
                const copy = { ...activity };
                delete copy.emoji;
                return copy;
            })
        };

        try {
            client.user.setPresence(fallback);
        } catch (fallbackError) {
            console.error(
                "[PRESENCE] Erro ao atualizar presença do Ticket:",
                fallbackError.message
            );
        }
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {
        let index = 0;

        const activities = [
            {
                type: ActivityType.Custom,
                name: "A Famosa City",
                state: "A Famosa City • Suporte Online",
                emoji: CUSTOM_EMOJI
            },
            {
                type: ActivityType.Watching,
                name: "Problemas? Abra um ticket"
            },
            {
                type: ActivityType.Playing,
                name: "Staff • A Famosa City"
            },
            {
                type: ActivityType.Watching,
                name: SITE
            }
        ];

        const update = () => {
            const activity = activities[index % activities.length];

            setPresenceSafe(client, {
                activities: [activity],
                status: "online"
            });

            index++;
        };

        update();
        setInterval(update, INTERVAL);

        console.log(`[PRESENCE] Ticket: presença iniciada para ${client.user.tag}`);
    }
};
