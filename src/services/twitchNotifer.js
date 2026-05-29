const axios = require('axios');

let twitchToken = null;
const streamsEnLigne = new Set();

async function getTwitchToken() {
  const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
  });
  twitchToken = res.data.access_token;
  console.log('✅ Token Twitch obtenu.');
}

async function checkStream() {
  if (!twitchToken) await getTwitchToken();

  try {
    const res = await axios.get('https://api.twitch.tv/helix/streams', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${twitchToken}`,
      },
      params: { user_login: process.env.TWITCH_USERNAME },
    });
    return res.data.data; // tableau vide si hors ligne
  } catch (err) {
    if (err.response?.status === 401) {
      await getTwitchToken(); // token expiré, on renouvelle
    }
    return [];
  }
}

async function startTwitchNotifier(client) {
  const channelId = process.env.NOTIFICATION_CHANNEL_ID;
  const roleId    = process.env.NOTIFY_ROLE_ID;

  async function poll() {
    const streams = await checkStream();
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    if (streams.length > 0) {
      const stream = streams[0];
      const login  = stream.user_login.toLowerCase();

      if (!streamsEnLigne.has(login)) {
        streamsEnLigne.add(login);

        const role    = roleId ? `<@&${roleId}>` : '';
        const { EmbedBuilder } = require('discord.js');

        const embed = new EmbedBuilder()
          .setTitle(`🔴 ${stream.user_name} est en live !`)
          .setDescription(stream.title)
          .setURL(`https://twitch.tv/${login}`)
          .setColor(0x9146FF)
          .addFields(
            { name: '🎮 Jeu',         value: stream.game_name || 'Non renseigné', inline: true },
            { name: '👥 Spectateurs', value: String(stream.viewer_count),          inline: true }
          )
          .setThumbnail(
            stream.thumbnail_url
              .replace('{width}', '320')
              .replace('{height}', '180')
          )
          .setFooter({ text: 'Twitch • Rejoins le stream !' });

        await channel.send({ content: `${role} Je suis en live !`, embeds: [embed] });
      }
    } else {
      // Stream terminé → on reset pour la prochaine fois
      const login = process.env.TWITCH_USERNAME.toLowerCase();
      streamsEnLigne.delete(login);
    }
  }

  // Premier check immédiat, puis toutes les 3 minutes
  await poll();
  setInterval(poll, 3 * 60 * 1000);
}

export { startTwitchNotifier };

