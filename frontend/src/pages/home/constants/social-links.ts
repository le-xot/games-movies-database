import {
  DiscordIcon,
  GitHubIcon,
  SteamIcon,
  TelegramIcon,
  TwitchIcon,
  YouTubeIcon,
} from 'vue3-simple-icons'

interface SocialLink {
  name: string
  icon: any
  color: string
  url: string
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Steam',
    icon: SteamIcon,
    color: '#000000',
    url: 'https://steamcommunity.com/id/le_xot',
  },
  {
    name: 'GitHub',
    icon: GitHubIcon,
    color: '#181717',
    url: 'https://github.com/le-xot',
  },
  {
    name: 'Telegram',
    icon: TelegramIcon,
    color: '#26A5E4',
    url: 'https://t.me/le_xot',
  },
  {
    name: 'Discord',
    icon: DiscordIcon,
    color: '#5865F2',
    url: 'https://discord.gg/zgZHHnkkP5',
  },
  {
    name: 'Twitch',
    icon: TwitchIcon,
    color: '#9146FF',
    url: 'https://www.twitch.tv/le_xot',
  },
  {
    name: 'YouTube',
    icon: YouTubeIcon,
    color: '#FF0000',
    url: 'https://www.youtube.com/@le_xot',
  },
]
