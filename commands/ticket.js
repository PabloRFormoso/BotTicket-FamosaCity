const {
    StringSelectMenuBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    ChannelType,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require("discord.js");
const Ticket = require('../models/Ticket');
const TicketHistory = require('../models/TicketHistory');
const Rating = require('../models/Rating');
const crypto = require('crypto');
const discordTranscripts = require('discord-html-transcripts'); // Biblioteca para transcrição de canais
const { uploadTranscript } = require('../functions/uploadManager'); // Sistema unificado de upload
const { styleTranscript } = require('../functions/styleTranscript');
const {
    createVerificationCode,
    createTranscriptHash,
    getVerificationUrl,
    buildVerificationPage,
    saveVerificationPage
} = require('../functions/verification');


module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand() && !interaction.isStringSelectMenu() && !interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.isCommand()) {
            const { commandName } = interaction;

            if (commandName === 'ticket') {
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('ticket')
                    .setPlaceholder('Selecione um motivo')
                    .addOptions([
                        { label: 'Suporte', value: 'suporte', emoji: '<:abreticket:1536559368399491182>' },
                        { label: 'Denuncia', value: 'denuncia', emoji: '<:regras:1536560290920009819>' },
                        { label: 'Bug', value: 'bug', emoji: '<:bugfix:1536560205888757810>' },
                        { label: 'Donate', value: 'donate', emoji: '<a:dinheiro:1536560781272027236>' },
                    ]);

                const row = new ActionRowBuilder().addComponents(menu);

                const ticketText = new TextDisplayBuilder()
                    .setContent(
                        '# 🎫 Central de Atendimento\n\n' +
                        '## <:abreticket:1536559368399491182> Sistema de Tickets\n\n' +
                        '<a:seta:1536561676453679104> Precisa de ajuda ou deseja falar com nossa equipe? Selecione abaixo o **motivo do seu atendimento** para abrir um ticket.\n\n' +
                        '<a:seta:1536561676453679104> Escolha a categoria correta para que sua solicitação seja encaminhada à equipe responsável.\n\n' +
                        '### Como funciona?\n\n' +
                        '<a:seta:1536561676453679104> Selecione o motivo do atendimento no menu abaixo.\n' +
                        '<a:seta:1536561676453679104> Um canal privado será criado automaticamente.\n' +
                        '<a:seta:1536561676453679104> Explique sua situação com o máximo de detalhes possível.\n' +
                        '<a:seta:1536561676453679104> Aguarde até que um membro da equipe realize o atendimento.\n\n' +
                        '### Importante\n\n' +
                        '<a:caution:1533930637642305546> Evite abrir **tickets duplicados** ou selecionar categorias que não correspondam ao seu problema.\n\n' +
                        '<a:caution:1533930637642305546> Utilizar o sistema de forma indevida poderá resultar no fechamento do ticket sem atendimento.'
                    );

                const ticketImage = new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL('https://i.imgur.com/oUUkzMC.gif')
                            .setDescription('A Famosa City • Central de Atendimento')
                    );

                const ticketContainer = new ContainerBuilder()
                    .setAccentColor(0xffffff)
                    .addTextDisplayComponents(ticketText)
                    .addActionRowComponents(row)
                    .addMediaGalleryComponents(ticketImage);

                await interaction.reply({
                    content: 'Mensagem enviada no canal.',
                    flags: MessageFlags.Ephemeral
                });

                await interaction.channel.send({
                    components: [ticketContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket') {
                try {
                    const selectedValue = interaction.values[0];
                    const guild = interaction.guild;
                    
                    //console.log(`🎫 Usuário ${interaction.user.tag} selecionou: ${selectedValue}`);

                    const existingTicket = await Ticket.findOne({ userId: interaction.user.id });
                    if (existingTicket) {
                        //console.log(`❌ Usuário ${interaction.user.tag} já possui ticket: ${existingTicket._id}`);
                        return interaction.reply({
                            content: '🎫 Você já possui um ticket aberto.\n\nSe você saiu do canal ou ele não está aparecendo para você, não se preocupe. Aguarde a equipe finalizar o ticket atual. Assim que ele for encerrado, você poderá abrir outro normalmente.',                            flags: MessageFlags.Ephemeral
                        });
                    }

                let channelName;
                let categoryId;
                switch (selectedValue) {
                    case 'suporte':
                        channelName = `❓・ticket-${interaction.user.tag}`;
                        categoryId = process.env.ABERTOS; // ID da categoria no .env
                        break;
                    case 'denuncia':
                        channelName = `⚠️・ticket-${interaction.user.tag}`;
                        categoryId = process.env.DENUNCIA; // ID da categoria no .env
                        break;
                    case 'bug':
                        channelName = `🤖・ticket-${interaction.user.tag}`;
                        categoryId = process.env.BUG; // ID da categoria no .env
                        break;
                    case 'donate':
                        channelName = `💰・ticket-${interaction.user.tag}`;
                        categoryId = process.env.DONATE; // ID da categoria no .env
                        break;
                    default:
                        return;
                }

                // Verifica se a categoria já existe pelo ID
                let category = guild.channels.cache.get(categoryId);
                //console.log(`🔍 Procurando categoria com ID: ${categoryId}`);
                //console.log(`📂 Categoria encontrada:`, category ? category.name : 'Não encontrada');

                // Cria a categoria se não existir
                if (!category) {
                    //console.log(`🏗️ Criando nova categoria para ${selectedValue}`);
                    category = await guild.channels.create({
                        name: `Categoria-${selectedValue}`,
                        type: ChannelType.GuildCategory,
                        reason: `Categoria criada para tickets de ${selectedValue}`
                    });
                    //console.log(`✅ Categoria criada: ${category.name} (ID: ${category.id})`);
                }

                // Cria o canal dentro da categoria
                //console.log(`🏗️ Criando canal: ${channelName} na categoria ${category.name}`);
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    reason: `Canal criado para o ticket: ${selectedValue}`,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ['ViewChannel'],
                        },
                        {
                            id: interaction.user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'],
                        },
                        {
                            id: process.env.TEAM_ROLE_ID,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'ManageMessages'],
                        },
                    ],
                });
                //console.log(`✅ Canal criado: ${channel.name} (ID: ${channel.id})`);

                // Envia a mensagem no canal criado
                // const embed = new EmbedBuilder()
                //     .setTitle('🧙‍♂️ Ticket Aberto')
                //     .setDescription(
                //         `Estamos cientes da abertura do seu ticket, evite chamar alguém via DM, basta aguardar e um responsável virá atender. ` +
                //         `\n\n**Descreva o motivo do contato com o máximo de detalhes possíveis!**`
                //     )
                //     .setColor('DarkGrey')
                //     .setTimestamp();

                const embed = new EmbedBuilder()
                .setTitle('🎟️ Ticket Aberto')
                .setDescription(
                `Seu ticket foi criado com sucesso!

                ### 📋 O que fazer agora?
                🔹 Descreva detalhadamente o motivo do contato.
                🔹 Envie prints, vídeos ou qualquer evidência necessária.
                🔹 Aguarde um membro da equipe responder.

                > ⚠️ **Não envie mensagens privadas (DM) para a equipe.**
                > Os atendimentos são realizados exclusivamente por este ticket.

                Obrigado por aguardar! ❤️`
                )
                .setColor('#5865F2')
                .setFooter({
                    text: 'Famosa City • Suporte Oficial',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

                const sair = new ButtonBuilder()
                    .setCustomId('sair-ticket')
                    .setLabel('Sair do Ticket')
                    .setStyle(ButtonStyle.Primary);
                const fechar = new ButtonBuilder()
                    .setCustomId('fechar-ticket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger);
                const adicionar = new ButtonBuilder()
                    .setCustomId('adicionar-ticket')
                    .setLabel('Adicionar Membro')
                    .setStyle(ButtonStyle.Success);
                const remover = new ButtonBuilder()
                    .setCustomId('remover-ticket')
                    .setLabel('Remover Membro')
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder()
                    .addComponents(sair, fechar, adicionar, remover);

                await channel.send({ content: ` ${interaction.user}` });
                await channel.send({ embeds: [embed], components: [row] });

                // Salva o ticket no MongoDB
                const ticket = new Ticket({
                    userId: interaction.user.id,
                    channelId: channel.id,
                    reason: selectedValue,
                });

                await ticket.save();

                await interaction.reply({
                    content: `O canal ${channel} foi criado na categoria <#${category.id}> para o seu ticket.`, flags: MessageFlags.Ephemeral
                });

                // Reset do menu mantendo o visual Components V2 da Central de Atendimento
                const resetMenu = new StringSelectMenuBuilder()
                    .setCustomId('ticket')
                    .setPlaceholder('Selecione um motivo')
                    .addOptions([
                        { label: 'Suporte', value: 'suporte', emoji: '<:abreticket:1536559368399491182>' },
                        { label: 'Denuncia', value: 'denuncia', emoji: '<:regras:1536560290920009819>' },
                        { label: 'Bug', value: 'bug', emoji: '<:bugfix:1536560205888757810>' },
                        { label: 'Donate', value: 'donate', emoji: '<a:dinheiro:1536560781272027236>' },
                    ]);

                const resetRow = new ActionRowBuilder().addComponents(resetMenu);

                const resetText = new TextDisplayBuilder()
                    .setContent(
                        '# 🎫 Central de Atendimento\n\n' +
                        '## <:abreticket:1536559368399491182> Sistema de Tickets\n\n' +
                        '<a:seta:1536561676453679104> Precisa de ajuda ou deseja falar com nossa equipe? Selecione abaixo o **motivo do seu atendimento** para abrir um ticket.\n\n' +
                        '<a:seta:1536561676453679104> Escolha a categoria correta para que sua solicitação seja encaminhada à equipe responsável.\n\n' +
                        '### Como funciona?\n\n' +
                        '<a:seta:1536561676453679104> Selecione o motivo do atendimento no menu abaixo.\n' +
                        '<a:seta:1536561676453679104> Um canal privado será criado automaticamente.\n' +
                        '<a:seta:1536561676453679104> Explique sua situação com o máximo de detalhes possível.\n' +
                        '<a:seta:1536561676453679104> Aguarde até que um membro da equipe realize o atendimento.\n\n' +
                        '### Importante\n\n' +
                        '<a:caution:1533930637642305546> Evite abrir **tickets duplicados** ou selecionar categorias que não correspondam ao seu problema.\n\n' +
                        '<a:caution:1533930637642305546> Utilizar o sistema de forma indevida poderá resultar no fechamento do ticket sem atendimento.'
                    );

                const resetImage = new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL('https://i.imgur.com/2g6MKVg.gif')
                            .setDescription('Famosa City • Central de Atendimento')
                    );

                const resetContainer = new ContainerBuilder()
                    .setAccentColor(0xffffff)
                    .addTextDisplayComponents(resetText)
                    .addActionRowComponents(resetRow)
                    .addMediaGalleryComponents(resetImage);

                await interaction.message.edit({
                    embeds: [],
                    components: [resetContainer],
                    flags: MessageFlags.IsComponentsV2
                });

                } catch (error) {
                    console.error(`❌ Erro ao criar ticket para ${interaction.user.tag}:`, error);
                    return interaction.reply({
                        content: 'Ocorreu um erro ao criar o ticket. Tente novamente mais tarde.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('avaliar-ticket:')) {
            const [, ticketId, staffId] = interaction.customId.split(':');

            // O botão precisa responder imediatamente com o modal. A validação de segurança
            // é feita novamente no envio do formulário, antes de salvar qualquer avaliação.

            const modal = new ModalBuilder()
                .setCustomId(`avaliacao-modal:${ticketId}:${staffId}`)
                .setTitle('Avaliar atendimento');

            const ratingInput = new TextInputBuilder()
                .setCustomId('nota')
                .setLabel('Nota de 1 a 5')
                .setPlaceholder('Exemplo: 5')
                .setMinLength(1)
                .setMaxLength(1)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const commentInput = new TextInputBuilder()
                .setCustomId('comentario')
                .setLabel('Comentário (opcional)')
                .setPlaceholder('Conte como foi seu atendimento...')
                .setMaxLength(1000)
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            return interaction.showModal(modal);

        } else if (interaction.isModalSubmit() && interaction.customId.startsWith('avaliacao-modal:')) {
            const [, ticketId, staffId] = interaction.customId.split(':');
            const rating = Number(interaction.fields.getTextInputValue('nota').trim());
            const comment = interaction.fields.getTextInputValue('comentario').trim();

            // O envio da avaliação envolve consultas/gravações no Mongo e envio de log.
            // Confirma a interação antes dessas operações para evitar DiscordAPIError[10062].
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Revalida no envio do modal para impedir manipulação do customId.
            const ticketHistory = await TicketHistory.findOne({ ticketId });
            if (!ticketHistory || ticketHistory.userId !== interaction.user.id || ticketHistory.staffId !== staffId) {
                return interaction.editReply({
                    content: '❌ Esta avaliação não pertence a você ou não é mais válida.'
                });
            }

            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                return interaction.editReply({
                    content: '❌ A nota precisa ser um número inteiro de **1 a 5**.'
                });
            }

            const existingRating = await Rating.findOne({ ticketId });
            if (existingRating) {
                return interaction.editReply({
                    content: '⭐ Este atendimento já foi avaliado. Obrigado!'
                });
            }

            try {
                await Rating.create({
                    ticketId,
                    userId: interaction.user.id,
                    staffId,
                    rating,
                    comment
                });
            } catch (error) {
                if (error?.code === 11000) {
                    return interaction.editReply({
                        content: '⭐ Este atendimento já foi avaliado. Obrigado!'
                    });
                }
                throw error;
            }

            // Marca o ticket como avaliado e desativa o botão na DM.
            await TicketHistory.updateOne(
                { ticketId },
                {
                    $set: {
                        rated: true,
                        ratedAt: new Date(),
                        rating
                    }
                }
            );

            try {
                const dmChannelId = ticketHistory.dmChannelId;
                const dmMessageId = ticketHistory.dmMessageId;

                if (dmChannelId && dmMessageId) {
                    const dmChannel = await client.channels.fetch(dmChannelId).catch(() => null);
                    const dmMessage = dmChannel ? await dmChannel.messages.fetch(dmMessageId).catch(() => null) : null;

                    if (dmMessage) {
                        const disabledRows = dmMessage.components.map(row => {
                            const newRow = new ActionRowBuilder();

                            for (const component of row.components) {
                                if (component.customId?.startsWith('avaliar-ticket:')) {
                                    newRow.addComponents(
                                        ButtonBuilder.from(component)
                                            .setDisabled(true)
                                            .setLabel('Atendimento avaliado')
                                    );
                                } else {
                                    newRow.addComponents(ButtonBuilder.from(component));
                                }
                            }

                            return newRow;
                        });

                        await dmMessage.edit({ components: disabledRows });
                    }
                }
            } catch (error) {
                console.error(`Não foi possível desativar o botão de avaliação do ticket ${ticketId}:`, error.message);
            }

            const ratingLogId = process.env.RATING_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
            const ratingChannel = ratingLogId ? await client.channels.fetch(ratingLogId).catch(() => null) : null;

            if (ratingChannel?.isTextBased()) {
                const stars = '⭐'.repeat(rating);
                const ratingEmbed = new EmbedBuilder()
                    .setTitle('⭐ Nova avaliação de atendimento')
                    .addFields(
                        { name: 'Jogador', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Staff', value: `<@${staffId}>`, inline: true },
                        { name: 'Nota', value: `${stars} (${rating}/5)`, inline: false },
                        { name: 'Ticket', value: ticketId, inline: false },
                        { name: 'Comentário', value: comment || 'Sem comentário.', inline: false }
                    )
                    .setColor('#5865F2')
                    .setTimestamp();

                await ratingChannel.send({ embeds: [ratingEmbed] });
            }

            return interaction.editReply({
                content: `✅ Obrigado pela avaliação! Você deu **${rating}/5** para o atendimento.`
            });

        } else if (interaction.customId === 'fechar-ticket') {
            const teamRoleId = process.env.TEAM_ROLE_ID;
            if (!interaction.member.roles.cache.has(teamRoleId)) {
                return interaction.reply({
                    content: 'Apenas membros autorizados podem fechar este ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (!interaction.channel) {
                return interaction.reply({
                    content: 'O canal não está acessível ou já foi excluído.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Reconhece a interação imediatamente. Gerar/uploadar transcript e enviar DM/log
            // pode levar mais que o limite de resposta inicial do Discord.
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
            if (!ticket) {
                return interaction.editReply({
                    content: 'Este canal não está associado a um ticket.'
                });
            }

            const transcriptAttachment = await discordTranscripts.createTranscript(interaction.channel, {
                limit: -1,
                fileName: 'transcript.html'
            });

            const closedAt = new Date();
            const ticketOwner = await client.users.fetch(ticket.userId).catch(() => null);

            // IDs públicos aleatórios e independentes do ID interno do ticket.
            const publicTranscriptId = crypto.randomBytes(24).toString('hex');
            const verificationCode = createVerificationCode();
            const transcriptFileName = `transcript-${publicTranscriptId}.html`;
            const transcriptBaseUrl = String(process.env.TRANSCRIPT_BASE_URL || '').trim().replace(/\/+$/, '');
            const transcriptUrlExpected = `${transcriptBaseUrl}/${encodeURIComponent(transcriptFileName)}`;
            const verificationUrlExpected = getVerificationUrl(verificationCode);

            const verificationMetadata = {
                ticketId: ticket._id.toString(),
                reason: ticket.reason,
                userId: ticket.userId,
                userName: ticketOwner?.globalName || ticketOwner?.username || 'Usuário',
                staffId: interaction.user.id,
                staffName: interaction.user.globalName || interaction.user.username || 'Staff',
                channelName: interaction.channel.name,
                openedAt: ticket.createdAt,
                closedAt,
                verificationCode,
                verificationUrl: verificationUrlExpected
            };

            const styledTranscript = styleTranscript(transcriptAttachment.attachment, verificationMetadata);
            const transcriptHash = createTranscriptHash(styledTranscript);

            let transcriptUrl = null;
            let verificationUrl = null;

            try {
                transcriptUrl = await uploadTranscript(styledTranscript, transcriptFileName);

                const verificationHtml = buildVerificationPage({
                    ...verificationMetadata,
                    transcriptUrl,
                    transcriptHash
                });

                verificationUrl = await saveVerificationPage(verificationCode, verificationHtml);
            } catch (error) {
                console.error('Erro ao salvar transcript/verificação:', error);
            }

            // Mantém apenas os dados necessários do ticket encerrado para validar a avaliação.
            // Esse histórico não bloqueia a abertura de novos tickets.
            await TicketHistory.findOneAndUpdate(
                { ticketId: ticket._id.toString() },
                {
                    $set: {
                        userId: ticket.userId,
                        staffId: interaction.user.id,
                        channelId: interaction.channel.id,
                        reason: ticket.reason,
                        transcriptUrl: transcriptUrl || '',
                        verificationCode,
                        verificationUrl: verificationUrl || '',
                        transcriptHash,
                        closedAt
                    }
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );

            // Envia informações no canal de logs
            const closeChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle('Ticket Finalizado com sucesso!')
                .addFields(
                    { name: 'Aberto por', value: `<@${ticket.userId}>`, inline: true },
                    { name: 'Finalizado por', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'ID do Ticket', value: ticket._id.toString(), inline: false },
                    { name: 'Canal', value: interaction.channel.name, inline: false },                    { name: 'Verificação', value: verificationUrl ? `[🔐 Abrir Transcript Oficial](${verificationUrl})\nCódigo: \`${verificationCode}\`` : 'Verificação não disponível' }
                )
                .setColor('Red')
                .setTimestamp();

            // Envia o resumo do ticket por DM para o jogador, com transcript + avaliação.
            try {
                const ticketUser = await client.users.fetch(ticket.userId);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🎟️ Seu ticket foi finalizado')
                    .setDescription('Seu atendimento na **Famosa City** foi encerrado. Você pode consultar a transcrição e avaliar o atendimento recebido.')
                    .addFields(
                        { name: 'Atendido por', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'ID do Ticket', value: ticket._id.toString(), inline: true },                        { name: 'Autenticidade', value: verificationUrl ? `[🔐 Abrir Transcript Oficial](${verificationUrl})\nCódigo: \`${verificationCode}\`` : 'Verificação não disponível.', inline: false }
                    )
                    .setColor('#5865F2')
                    .setFooter({ text: 'Famosa City • Suporte Oficial' })
                    .setTimestamp();

                const dmButtons = [];
                if (verificationUrl) {
                    dmButtons.push(
                        new ButtonBuilder()
                            .setLabel('🔐 Ver Transcript Oficial')
                            .setStyle(ButtonStyle.Link)
                            .setURL(verificationUrl)
                    );
                }

                dmButtons.push(
                    new ButtonBuilder()
                        .setCustomId(`avaliar-ticket:${ticket._id}:${interaction.user.id}`)
                        .setLabel('Avaliar atendimento')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Primary)
                );

                const dmMessage = await ticketUser.send({
                    embeds: [dmEmbed],
                    components: [new ActionRowBuilder().addComponents(dmButtons)]
                });

                // Guarda a mensagem da DM para desativar o botão depois da primeira avaliação.
                await TicketHistory.updateOne(
                    { ticketId: ticket._id.toString() },
                    {
                        $set: {
                            dmChannelId: dmMessage.channelId,
                            dmMessageId: dmMessage.id
                        }
                    }
                );
            } catch (error) {
                console.error(`Não foi possível enviar DM do ticket ${ticket._id} para ${ticket.userId}:`, error.message);
            }

            if (closeChannel) {
                await closeChannel.send({ embeds: [embed] });
                await interaction.editReply({
                    content: `O ticket foi fechado e a transcrição foi salva. Link disponível no canal de logs.`
                });
            
                // Exclui o ticket do banco de dados
                //await ticket.remove();

            } else {
                await interaction.editReply({
                    content: 'O ticket será fechado e o canal será excluído em 3 segundos. A transcrição foi salva.'
                });
            }

            setTimeout(async () => {
                try {
                    if (interaction.channel) {
                        await interaction.channel.delete('Ticket fechado pelo usuário.');
                    }
                    await Ticket.deleteOne({ _id: ticket._id });
                } catch (error) {
                    console.error('Erro ao excluir o canal ou remover o ticket:', error);
                }
            }, 3000);

        } else if (interaction.customId === 'sair-ticket') {
            if (!interaction.channel) {
                return interaction.reply({
                    content: 'O canal não está acessível ou já foi excluído.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
            if (!ticket) {
                return interaction.reply({
                    content: 'Este canal não está associado a um ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({ content: `O <@${interaction.user.id}> saiu do ticket.` });
            interaction.channel.permissionOverwrites.delete(interaction.user.id);
        } else if (interaction.customId === 'adicionar-ticket') {
            const teamRoleId = process.env.TEAM_ROLE_ID;
            if (!interaction.member.roles.cache.has(teamRoleId)) {
                return interaction.reply({
                    content: 'Apenas membros autorizados podem adicionar usuários a este ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('userModal')
                .setTitle('Adicionar Usuário ao Ticket');

            const userInput = new TextInputBuilder()
                .setCustomId('adcId')
                .setLabel('Digite o ID do usuário')
                .setPlaceholder('Exemplo: 123456789012345678')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const actionRow = new ActionRowBuilder().addComponents(userInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);

            const filter = (i) => i.customId === 'userModal' && i.user.id === interaction.user.id;
            interaction.channel.awaitMessageComponent({ filter, time: 60000 })
                .then(async (modalInteraction) => {
                    const adcId = modalInteraction.fields.getTextInputValue('adcId');
                    const user = await modalInteraction.guild.members.fetch(adcId).catch(() => null);

                    if (!user) {
                        return modalInteraction.reply({
                            content: 'Usuário não encontrado no servidor.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    await modalInteraction.reply({
                        content: `Usuário ${user} adicionado ao ticket.`,
                        flags: MessageFlags.Ephemeral
                    });

                    modalInteraction.channel.permissionOverwrites.create(user.id, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                    });
                })
                .catch(() => { });
        } else if (interaction.customId === 'remover-ticket') {
            const teamRoleId = process.env.TEAM_ROLE_ID;
            if (!interaction.member.roles.cache.has(teamRoleId)) {
                return interaction.reply({
                    content: 'Apenas membros autorizados podem remover usuários deste ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('remModal')
                .setTitle('Remover Usuário do Ticket');

            const userInput = new TextInputBuilder()
                .setCustomId('remId')
                .setLabel('Digite o ID do usuário')
                .setPlaceholder('Exemplo: 123456789012345678')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const remRow = new ActionRowBuilder().addComponents(userInput);
            modal.addComponents(remRow);

            await interaction.showModal(modal);

            const filter = (i) => i.customId === 'remModal' && i.user.id === interaction.user.id;
            interaction.channel.awaitMessageComponent({ filter, time: 60000 })
                .then(async (modalInteraction) => {
                    const remId = modalInteraction.fields.getTextInputValue('remId');
                    const rem = await modalInteraction.guild.members.fetch(remId).catch(() => null);

                    if (!rem) {
                        return modalInteraction.reply({
                            content: 'Usuário não encontrado no servidor.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    await modalInteraction.reply({
                        content: `Usuário ${rem} removido do ticket.`,
                        flags: MessageFlags.Ephemeral
                    });

                    modalInteraction.channel.permissionOverwrites.delete(rem.id);
                })
                .catch(() => { });
        }
    });
};