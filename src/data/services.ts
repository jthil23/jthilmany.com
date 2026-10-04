// Services running on SOL, Jeff's Unraid home server.
// Source of truth: the live container list and Nginx Proxy Manager hosts on SOL (checked 2026-10-03).
// Private IPs, ports, and keys are never published. Adult-media containers are intentionally omitted.

export type ServiceCategory = 'Media' | 'Media automation' | 'Smart home' | 'Network & security' | 'Data' | 'Observability' | 'AI & personal cloud';

export interface Service {
  slug: string;
  name: string;
  /** File name in public/icons/services/. */
  icon: string;
  category: ServiceCategory;
  description: string;
}

export const server = {
  name: 'SOL',
  os: 'Unraid 7.3.1',
  cpu: 'Ryzen 9 3900X',
  cores: '12 cores / 24 threads',
  memory: '32 GB RAM',
  gpu: 'RTX 3080',
  storage: '91 TB array',
  containers: '50+',
};

export const categories: { name: ServiceCategory; blurb: string }[] = [
  { name: 'Media', blurb: 'The library and what keeps it watchable.' },
  { name: 'Media automation', blurb: 'Requests in, organized media out.' },
  { name: 'Smart home', blurb: 'Sensors, voice, cameras, and automations that stay local.' },
  { name: 'Network & security', blurb: 'The front door and the locks on it.' },
  { name: 'Data', blurb: 'Databases behind the apps and side projects.' },
  { name: 'Observability', blurb: 'Knowing what is happening before something breaks.' },
  { name: 'AI & personal cloud', blurb: 'Self-hosted alternatives to the big clouds.' },
];

export const services: Service[] = [
  { slug: 'plex', name: 'Plex', icon: 'plex.svg', category: 'Media', description: 'The media server: movies and shows streamed to every screen in the house and beyond.' },
  { slug: 'tautulli', name: 'Tautulli', icon: 'tautulli.svg', category: 'Media', description: 'Watch history and stats for Plex: who watched what, and when.' },
  { slug: 'tdarr', name: 'Tdarr', icon: 'tdarr.svg', category: 'Media', description: 'GPU-accelerated transcoding on the RTX 3080, keeping the library in consistent, efficient formats.' },
  { slug: 'bazarr', name: 'Bazarr', icon: 'bazarr.svg', category: 'Media', description: 'Finds and syncs subtitles for everything in the library.' },
  { slug: 'kometa', name: 'Kometa', icon: 'kometa.png', category: 'Media', description: 'Builds Plex collections and overlays automatically.' },
  { slug: 'seerr', name: 'Seerr', icon: 'overseerr.svg', category: 'Media automation', description: 'The request desk: ask for a movie or show and the pipeline takes it from there.' },
  { slug: 'sonarr', name: 'Sonarr', icon: 'sonarr.svg', category: 'Media automation', description: 'Tracks TV series, watches for new episodes, and keeps seasons organized.' },
  { slug: 'radarr', name: 'Radarr', icon: 'radarr.svg', category: 'Media automation', description: 'The same idea for movies: monitoring, upgrades, and tidy folders.' },
  { slug: 'prowlarr', name: 'Prowlarr', icon: 'prowlarr.svg', category: 'Media automation', description: 'One indexer manager feeding Sonarr and Radarr.' },
  { slug: 'nzbget', name: 'NZBGet', icon: 'nzbget.svg', category: 'Media automation', description: 'The downloader at the end of the search.' },
  { slug: 'qbittorrent', name: 'qBittorrent', icon: 'qbittorrent.svg', category: 'Media automation', description: 'A second download client, routed through the VPN container.' },
  { slug: 'recyclarr', name: 'Recyclarr', icon: 'recyclarr.svg', category: 'Media automation', description: 'Keeps Sonarr and Radarr quality profiles in sync with curated guides.' },
  { slug: 'home-assistant', name: 'Home Assistant', icon: 'home-assistant.svg', category: 'Smart home', description: 'The hub for the house: devices, dashboards, and automations, all running locally.' },
  { slug: 'node-red', name: 'Node-RED', icon: 'node-red.svg', category: 'Smart home', description: 'Visual flows for automations that outgrow simple rules.' },
  { slug: 'zigbee2mqtt', name: 'Zigbee2MQTT', icon: 'zigbee2mqtt.svg', category: 'Smart home', description: 'Bridges Zigbee sensors and switches into the home network without vendor clouds.' },
  { slug: 'z-wave-js-ui', name: 'Z-Wave JS UI', icon: 'z-wave-js-ui.svg', category: 'Smart home', description: 'The Z-Wave side of the house, managed locally.' },
  { slug: 'matter', name: 'Matter Server', icon: 'matter.svg', category: 'Smart home', description: 'Matter devices connected straight into Home Assistant.' },
  { slug: 'mosquitto', name: 'Mosquitto', icon: 'mosquitto.svg', category: 'Smart home', description: 'The MQTT broker every device message passes through.' },
  { slug: 'frigate', name: 'Frigate', icon: 'frigate.svg', category: 'Smart home', description: 'Local camera recording with GPU-accelerated object detection.' },
  { slug: 'go2rtc', name: 'go2rtc', icon: 'go2rtc.png', category: 'Smart home', description: 'Low-latency camera streams for dashboards and Frigate.' },
  { slug: 'voice', name: 'Wyoming voice', icon: 'rhasspy.svg', category: 'Smart home', description: 'Local voice control: openWakeWord, faster-whisper speech-to-text, and Piper text-to-speech.' },
  { slug: 'music-assistant', name: 'Music Assistant', icon: 'music-assistant.svg', category: 'Smart home', description: 'One music library for every speaker in the house.' },
  { slug: 'nginx-proxy-manager', name: 'Nginx Proxy Manager', icon: 'nginx-proxy-manager.svg', category: 'Network & security', description: 'Routes incoming traffic to the right containers and manages TLS.' },
  { slug: 'adguard-home', name: 'AdGuard Home', icon: 'adguard-home.svg', category: 'Network & security', description: 'Network-wide DNS filtering: fewer ads and trackers for every device.' },
  { slug: 'vaultwarden', name: 'Vaultwarden', icon: 'vaultwarden.svg', category: 'Network & security', description: 'A self-hosted password vault compatible with Bitwarden clients.' },
  { slug: 'tailscale', name: 'Tailscale', icon: 'tailscale.svg', category: 'Network & security', description: 'Private access to everything here from anywhere, without opening ports.' },
  { slug: 'gluetun', name: 'Gluetun', icon: 'gluetun.svg', category: 'Network & security', description: 'A VPN tunnel container other services route through.' },
  { slug: 'unifi', name: 'UniFi', icon: 'unifi.svg', category: 'Network & security', description: 'The network itself: gateway, Wi-Fi, and switching.' },
  { slug: 'mariadb', name: 'MariaDB', icon: 'mariadb.svg', category: 'Data', description: 'The shared database behind Command Center and the scraper.' },
  { slug: 'redis', name: 'Redis', icon: 'redis.svg', category: 'Data', description: 'Fast in-memory caching and queues.' },
  { slug: 'oracle', name: 'Oracle Free', icon: 'oracle.svg', category: 'Data', description: 'An Oracle Database 23 sandbox for experiments.' },
  { slug: 'adminer', name: 'Adminer', icon: 'adminer.svg', category: 'Data', description: 'A lightweight web console for the databases.' },
  { slug: 'grafana', name: 'Grafana', icon: 'grafana.svg', category: 'Observability', description: 'Dashboards and graphs on top of the metrics.' },
  { slug: 'prometheus', name: 'Prometheus', icon: 'prometheus.svg', category: 'Observability', description: 'Collects system and container metrics; Command Center queries it directly.' },
  { slug: 'uptime-kuma', name: 'Uptime Kuma', icon: 'uptime-kuma.svg', category: 'Observability', description: 'Watches every service and complains when one goes quiet.' },
  { slug: 'scrutiny', name: 'Scrutiny', icon: 'scrutiny.svg', category: 'Observability', description: 'SMART health for every drive in the array.' },
  { slug: 'dozzle', name: 'Dozzle', icon: 'dozzle.svg', category: 'Observability', description: 'Live container logs in the browser.' },
  { slug: 'glance', name: 'Glance', icon: 'glance.svg', category: 'Observability', description: 'A start page that pulls the useful bits into one view.' },
  { slug: 'unraid', name: 'Unraid', icon: 'unraid.svg', category: 'Observability', description: 'The operating system underneath it all: the array, parity, and Docker.' },
  { slug: 'ollama', name: 'Ollama', icon: 'ollama.svg', category: 'AI & personal cloud', description: 'Large language models running locally on the GPU.' },
  { slug: 'open-webui', name: 'Open WebUI', icon: 'open-webui.svg', category: 'AI & personal cloud', description: 'A chat interface for the local models.' },
  { slug: 'searxng', name: 'SearXNG', icon: 'searxng.svg', category: 'AI & personal cloud', description: 'Private metasearch, also handy as a search tool for local AI.' },
  { slug: 'karakeep', name: 'Karakeep', icon: 'karakeep.svg', category: 'AI & personal cloud', description: 'Bookmarks and read-it-later, with AI tagging.' },
  { slug: 'nextcloud', name: 'Nextcloud', icon: 'nextcloud.svg', category: 'AI & personal cloud', description: 'Files, sync, and sharing on hardware at home.' },
];

/** How a request becomes something to watch. Slugs refer to `services`. */
export const mediaPipeline: { slug: string; step: string }[] = [
  { slug: 'seerr', step: 'Request' },
  { slug: 'sonarr', step: 'Track' },
  { slug: 'prowlarr', step: 'Search' },
  { slug: 'nzbget', step: 'Download' },
  { slug: 'tdarr', step: 'Transcode' },
  { slug: 'bazarr', step: 'Subtitle' },
  { slug: 'plex', step: 'Watch' },
];

/** How a sensor event becomes an automation. */
export const smartHomePipeline: { slug: string; step: string }[] = [
  { slug: 'zigbee2mqtt', step: 'Sense' },
  { slug: 'mosquitto', step: 'Relay' },
  { slug: 'home-assistant', step: 'Decide' },
  { slug: 'node-red', step: 'Automate' },
];

export const serviceBySlug = (slug: string) => {
  const service = services.find(s => s.slug === slug);
  if (!service) throw new Error(`Unknown service: ${slug}`);
  return service;
};
