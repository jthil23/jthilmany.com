// Scenario data for the Request flow lab experiment (/lab/request-flow/).
// An illustration of SOL's architecture, not live traffic. Service names and logos come from
// services.ts so they stay in sync; captions only describe what that inventory and the README state.
// Never add hostnames, addresses, ports, or which services are reachable remotely.

import { server, serviceBySlug } from './services';

/** Generic, non-service stops drawn as inline line icons by the page. */
export type FlowGlyph = 'phone' | 'camera' | 'mic' | 'speaker' | 'lock' | 'app';

export interface FlowIcon {
  src: string;
  alt: string;
}

export interface FlowNode {
  id: string;
  /** Visible name, e.g. a service name. */
  label: string;
  /** Short role in this scenario, e.g. "Search". */
  role: string;
  /** Service logos; empty when the node uses a generic glyph. */
  icons: FlowIcon[];
  glyph?: FlowGlyph;
  /** Optional side step rather than the request's main path. */
  side?: boolean;
}

export interface FlowStep {
  /** `id` of the node this step highlights. Consecutive steps move at most one node forward. */
  node: string;
  title: string;
  caption: string;
}

export interface Flow {
  id: string;
  /** Tab label. */
  tab: string;
  title: string;
  summary: string;
  nodes: FlowNode[];
  steps: FlowStep[];
}

function logo(slug: string): FlowIcon {
  const service = serviceBySlug(slug);
  return { src: `/icons/services/${service.icon}`, alt: `${service.name} logo` };
}

function serviceNode(id: string, slug: string, role: string, extra: Partial<FlowNode> = {}): FlowNode {
  return { id, label: serviceBySlug(slug).name, role, icons: [logo(slug)], ...extra };
}

const voiceLogo = logo('voice');

export const flows: Flow[] = [
  {
    id: 'media',
    tab: 'Movie request',
    title: 'From “I want to watch that” to Plex',
    summary: 'One request in Seerr sets off a chain of services that find, download, organize, and serve a movie or show.',
    nodes: [
      serviceNode('seerr', 'seerr', 'Request'),
      { id: 'arr', label: 'Sonarr / Radarr', role: 'Track', icons: [logo('sonarr'), logo('radarr')] },
      serviceNode('prowlarr', 'prowlarr', 'Search'),
      { id: 'download', label: 'NZBGet / qBittorrent', role: 'Download', icons: [logo('nzbget'), logo('qbittorrent')] },
      serviceNode('gluetun', 'gluetun', 'VPN route'),
      { id: 'array', label: 'Unraid array', role: 'Files land', icons: [logo('unraid')] },
      serviceNode('plex', 'plex', 'Watch'),
      { id: 'extras', label: 'Bazarr · Kometa · Tdarr', role: 'Side jobs', icons: [logo('bazarr'), logo('kometa'), logo('tdarr')], side: true },
    ],
    steps: [
      { node: 'seerr', title: 'Ask for it', caption: 'Someone picks a movie or show in Seerr, the request desk. That one request is all the input the rest of the pipeline needs.' },
      { node: 'arr', title: 'Hand it to a tracker', caption: 'Seerr passes TV requests to Sonarr and movie requests to Radarr. They remember what is wanted and keep watching for it, including new episodes later.' },
      { node: 'prowlarr', title: 'Search the indexers', caption: 'Sonarr and Radarr ask Prowlarr to search for a matching release. Prowlarr manages the indexers in one place, so each app does not need its own list.' },
      { node: 'download', title: 'Download it', caption: 'The chosen release goes to a download client: NZBGet, or qBittorrent as a second client.' },
      { node: 'gluetun', title: 'Through the VPN', caption: 'qBittorrent does not talk to the internet directly. Its traffic is routed through Gluetun, a VPN tunnel container.' },
      { node: 'array', title: 'Files land', caption: `When the download finishes, Sonarr or Radarr moves it into tidy, organized folders on SOL’s ${server.storage}.` },
      { node: 'plex', title: 'Ready to watch', caption: 'The new title shows up in the Plex library, ready to stream to every screen in the house and beyond.' },
      { node: 'extras', title: 'Finishing touches', caption: 'Off to the side, Bazarr finds and syncs subtitles, Kometa builds collections and overlays, and Tdarr transcodes on the GPU to keep formats consistent.' },
    ],
  },
  {
    id: 'camera',
    tab: 'Camera motion',
    title: 'Motion at a camera becomes a notification',
    summary: 'Video is analyzed on SOL itself; only the final heads-up leaves the house as a phone notification.',
    nodes: [
      { id: 'camera', label: 'Camera', role: 'Sees motion', icons: [], glyph: 'camera' },
      serviceNode('go2rtc', 'go2rtc', 'Stream'),
      serviceNode('frigate', 'frigate', 'Detect'),
      serviceNode('mosquitto', 'mosquitto', 'Relay'),
      serviceNode('home-assistant', 'home-assistant', 'Decide'),
      { id: 'phone', label: 'Phone', role: 'Notify', icons: [], glyph: 'phone' },
    ],
    steps: [
      { node: 'camera', title: 'Something moves', caption: 'A camera picks up movement. On its own, a video feed is just a stream of frames until something looks at it.' },
      { node: 'go2rtc', title: 'Share the stream', caption: 'go2rtc takes in the camera’s video and serves low-latency streams, so dashboards and Frigate can watch the same feed.' },
      { node: 'frigate', title: 'Is it a person?', caption: 'Frigate runs object detection on the GPU to tell whether the motion matters, like a person, or is just leaves in the wind. Recording stays local.' },
      { node: 'mosquitto', title: 'Publish the event', caption: 'Frigate publishes what it found as an MQTT message. Mosquitto is the broker every device message passes through; it delivers the message to whoever is listening.' },
      { node: 'home-assistant', title: 'Decide what to do', caption: 'Home Assistant listens for those messages. An automation checks the event against its rules and decides whether anyone needs to know.' },
      { node: 'phone', title: 'A tap on the shoulder', caption: 'If the rules say so, Home Assistant sends a notification to a phone. The detection and the decision both happened locally on SOL.' },
    ],
  },
  {
    id: 'voice',
    tab: 'Voice command',
    title: 'A spoken command, handled locally',
    summary: 'Wyoming voice keeps wake word, transcription, and the spoken reply on SOL instead of a cloud assistant.',
    nodes: [
      { id: 'mic', label: 'Microphone', role: 'Listen', icons: [], glyph: 'mic' },
      { id: 'wake', label: 'openWakeWord', role: 'Wake word', icons: [voiceLogo] },
      { id: 'stt', label: 'faster-whisper', role: 'Speech to text', icons: [voiceLogo] },
      serviceNode('home-assistant', 'home-assistant', 'Intent'),
      { id: 'action', label: 'Device action', role: 'Home Assistant automation', icons: [], glyph: 'app' },
      { id: 'tts', label: 'Piper', role: 'Text to speech', icons: [voiceLogo] },
      { id: 'speaker', label: 'Speaker', role: 'Reply', icons: [], glyph: 'speaker' },
    ],
    steps: [
      { node: 'mic', title: 'Say the wake word', caption: 'Someone in the room says the wake word, then a command. A microphone picks up the audio.' },
      { node: 'wake', title: 'Wait for the wake word', caption: 'openWakeWord, part of the Wyoming voice stack, listens locally for that one phrase. Until it hears it, the rest of the pipeline stays idle.' },
      { node: 'stt', title: 'Turn speech into text', caption: 'The command that follows goes to faster-whisper, which transcribes it into text on SOL rather than in a cloud service.' },
      { node: 'home-assistant', title: 'Work out the intent', caption: 'Home Assistant reads the text and matches it to an intent: what to do, and to which device. For example, “turn on the kitchen lights.”' },
      { node: 'action', title: 'Do it', caption: 'Home Assistant carries out the action through the devices it already manages, just as a dashboard tap or an automation would.' },
      { node: 'tts', title: 'Write a reply', caption: 'Home Assistant hands a short confirmation to Piper, which turns the text into speech locally.' },
      { node: 'speaker', title: 'Answer out loud', caption: 'The spoken reply plays back in the room. The whole round trip stayed on hardware at home.' },
    ],
  },
  {
    id: 'remote',
    tab: 'Remote access',
    title: 'Reaching home from anywhere, without an open door',
    summary: 'Away from home, a phone gets in through an encrypted tunnel and two separate checks, never through a port open to the internet.',
    nodes: [
      { id: 'phone', label: 'Phone', role: 'Away from home', icons: [], glyph: 'phone' },
      serviceNode('tailscale', 'tailscale', 'Tunnel'),
      serviceNode('nginx-proxy-manager', 'nginx-proxy-manager', 'Front door'),
      { id: 'login', label: 'App login', role: 'Sign in', icons: [], glyph: 'lock' },
      { id: 'service', label: 'The service', role: 'Inside', icons: [], glyph: 'app' },
    ],
    steps: [
      { node: 'phone', title: 'Away from home', caption: 'On mobile data or someone else’s Wi-Fi, a phone wants to open one of the services on SOL. There are no open ports to knock on from the internet.' },
      { node: 'tailscale', title: 'Join the private network', caption: 'Tailscale links the phone to the home network through an encrypted tunnel. It works without opening ports, so the services never face the open internet.' },
      { node: 'nginx-proxy-manager', title: 'Check at the front door', caption: 'Nginx Proxy Manager receives the request, handles TLS, and routes it to the right container; its access list only admits the home network and Tailscale, turning everyone else away.' },
      { node: 'login', title: 'Sign in', caption: 'Getting through the front door is not the same as getting in. The service still asks for its own login.' },
      { node: 'service', title: 'Inside', caption: 'Only then does the app open, just as it would at home. This is the general path; it does not reveal addresses or which services are reachable.' },
    ],
  },
];
