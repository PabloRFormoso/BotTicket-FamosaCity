const Canvas = require('canvas');
const Discord = require('discord.js');
const path = require('path');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const channel = member.guild.channels.cache.get(process.env.ENTRADA_CHANNEL_ID);

        const canvas = Canvas.createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(path.join(__dirname, './background.png'));

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#fff';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' }));

        const x = (canvas.width - 400) / 2;
        const y = (canvas.height - 400) / 2;

        ctx.font = '80px sans';
        ctx.fillStyle = '#fff';
        const text = `${member.user.username} entrou no servidor`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, x + (400 - textWidth) / 2, y + 500);

        ctx.font = '55px sans';
        ctx.fillStyle = '#dedede';
        const memberCounterText = `Membro #${member.guild.memberCount}`;
        const memberCounterTextWidth = ctx.measureText(memberCounterText).width;
        ctx.fillText(memberCounterText, x + (400 - memberCounterTextWidth) / 2, y + 580);

        ctx.beginPath();
        ctx.arc(x + 400 / 2, y + 400 / 2, 400 / 2 + 10, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 400 / 2, y + 400 / 2, 400 / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(avatar, x, y, 400, 400);

        const attachment = new Discord.AttachmentBuilder(await canvas.toBuffer(), { name: 'welcome.png' });

        channel.send({ /* content: `Bem vindo ao Servidor ${member}`,  */ files: [attachment] });
    },
};