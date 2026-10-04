export interface Project {
  title: string;
  description: string;
  tags: string[];
  href?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    title: 'Command Center',
    description: 'A Next.js homeserver dashboard bringing container management, media discovery, automation, and system monitoring into one interface. The public repository includes API routes, Prisma migrations, and unit tests; this is source code, not a linked live service.',
    tags: ['Next.js', 'Prisma', 'Containers', 'Automation'],
    href: 'https://github.com/jthil23/command-center',
    featured: true,
  },
  {
    title: 'Main Scraper',
    description: 'A TypeScript data-collection service for a home dashboard, with scrapers for Plex, system metrics, weather, news, and other integrations. The source provides scheduled runs, a web server, and a run-now mode; no hosted endpoint is shared here.',
    tags: ['TypeScript', 'Scheduling', 'Data collection', 'Homelab'],
    href: 'https://github.com/jthil23/main-scraper',
    featured: true,
  },
  {
    title: 'F1 Dashboard',
    description: 'A Next.js Formula 1 dashboard with source routes for standings, race results, qualifying, live status, predictions, and head-to-head comparisons. The project lives inside SettingUpDockerPush alongside Docker publishing configuration; the link opens its source folder, not a running dashboard.',
    tags: ['Next.js', 'Formula 1', 'Docker', 'GitHub Actions'],
    href: 'https://github.com/jthil23/SettingUpDockerPush/tree/main/f1-dashboard',
    featured: true,
  },
];
