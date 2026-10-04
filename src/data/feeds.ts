// Public RSS/Atom feeds read by /radar at build time. Only headlines, sources,
// dates, and outbound links are shown; article text is never copied.
export type TopicId = 'tech' | 'ai' | 'homelab' | 'f1' | 'microsoft';

export interface Topic {
  id: TopicId;
  label: string;
  blurb: string;
}

export interface Feed {
  id: string;
  label: string;
  topic: TopicId;
  /** RSS 2.0 or Atom feed URL. */
  url: string;
  /** The publication's human-facing page, linked from the sources list. */
  homepage: string;
}

export const topics: Topic[] = [
  { id: 'tech', label: 'Tech', blurb: 'General technology news and the Hacker News front page.' },
  { id: 'ai', label: 'AI', blurb: 'Model releases, tooling, and hands-on notes.' },
  { id: 'homelab', label: 'Homelab', blurb: 'Self-hosting, home automation, and the software that runs at home.' },
  { id: 'f1', label: 'Formula 1', blurb: 'Paddock news and race weekends.' },
  { id: 'microsoft', label: 'Power Platform / .NET', blurb: 'Microsoft Power Platform and .NET engineering updates.' },
];

export const feeds: Feed[] = [
  { id: 'hn', label: 'Hacker News', topic: 'tech', url: 'https://hnrss.org/frontpage', homepage: 'https://news.ycombinator.com/' },
  { id: 'ars', label: 'Ars Technica', topic: 'tech', url: 'https://feeds.arstechnica.com/arstechnica/index', homepage: 'https://arstechnica.com/' },
  { id: 'verge', label: 'The Verge', topic: 'tech', url: 'https://www.theverge.com/rss/index.xml', homepage: 'https://www.theverge.com/' },
  { id: 'simonw', label: 'Simon Willison', topic: 'ai', url: 'https://simonwillison.net/atom/everything/', homepage: 'https://simonwillison.net/' },
  { id: 'openai', label: 'OpenAI News', topic: 'ai', url: 'https://openai.com/news/rss.xml', homepage: 'https://openai.com/news/' },
  { id: 'verge-ai', label: 'The Verge AI', topic: 'ai', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', homepage: 'https://www.theverge.com/ai-artificial-intelligence' },
  { id: 'selfhst', label: 'selfh.st', topic: 'homelab', url: 'https://selfh.st/rss/', homepage: 'https://selfh.st/' },
  { id: 'home-assistant', label: 'Home Assistant', topic: 'homelab', url: 'https://www.home-assistant.io/atom.xml', homepage: 'https://www.home-assistant.io/blog/' },
  { id: 'r-selfhosted', label: 'r/selfhosted', topic: 'homelab', url: 'https://www.reddit.com/r/selfhosted/top/.rss?t=week', homepage: 'https://www.reddit.com/r/selfhosted/' },
  { id: 'f1', label: 'Formula 1', topic: 'f1', url: 'https://www.formula1.com/en/latest/all.xml', homepage: 'https://www.formula1.com/en/latest' },
  { id: 'the-race', label: 'The Race', topic: 'f1', url: 'https://www.the-race.com/feed/', homepage: 'https://www.the-race.com/' },
  { id: 'power-platform', label: 'Power Platform Blog', topic: 'microsoft', url: 'https://www.microsoft.com/en-us/power-platform/blog/feed/', homepage: 'https://www.microsoft.com/en-us/power-platform/blog/' },
  { id: 'dotnet', label: '.NET Blog', topic: 'microsoft', url: 'https://devblogs.microsoft.com/dotnet/feed/', homepage: 'https://devblogs.microsoft.com/dotnet/' },
];
