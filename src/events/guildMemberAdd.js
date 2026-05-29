import { EmbedBuilder } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`👋 Bienvenue chez les MALTROUKs 2 BAL !`)
      .setDescription(`Salut ${member} ! Content de t'avoir parmi nous.`)
      .setThumbnail(member.displayAvatarURL({ dynamic: true }))
      .setColor(0x5865F2)
      .setFooter({ text: `Tu es le membre #${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
};
