export const NAV = [
  { id: "story", href: "/story", label: "My Story" },
  { id: "store", href: "/store", label: "Store" },
  { id: "blog", href: "/blog", label: "Blog" },
  { id: "connect", href: "/contact", label: "Connect" },
] as const;

export type NavId = (typeof NAV)[number]["id"] | "work" | "";

export const SOCIALS: Array<{ name: string; href: string; d: string }> = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/garth.heckman",
    d: "M9.6 15V8.6h2.1l.3-2.4H9.6V4.7c0-.7.2-1.2 1.2-1.2h1.3V1.3A17 17 0 0 0 10.2 1C8.3 1 7 2.2 7 4.4v1.8H4.9v2.4H7V15h2.6Z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/garthheckman/",
    d: "M8 1.4c2.1 0 2.4 0 3.2.1.8 0 1.2.2 1.5.3.4.1.7.3 1 .6.3.3.5.6.6 1 .1.3.3.7.3 1.5 0 .8.1 1.1.1 3.2s0 2.4-.1 3.2c0 .8-.2 1.2-.3 1.5-.1.4-.3.7-.6 1-.3.3-.6.5-1 .6-.3.1-.7.3-1.5.3-.8 0-1.1.1-3.2.1s-2.4 0-3.2-.1c-.8 0-1.2-.2-1.5-.3-.4-.1-.7-.3-1-.6a2.6 2.6 0 0 1-.6-1c-.1-.3-.3-.7-.3-1.5 0-.8-.1-1.1-.1-3.2s0-2.4.1-3.2c0-.8.2-1.2.3-1.5.1-.4.3-.7.6-1 .3-.3.6-.5 1-.6.3-.1.7-.3 1.5-.3.8 0 1.1-.1 3.2-.1Zm0 3.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm0 5.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Zm4.3-5.7a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Z",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@garthheckman9650",
    d: "M15 5.2s-.1-1-.6-1.5c-.6-.6-1.2-.6-1.5-.6C10.8 3 8 3 8 3s-2.8 0-4.9.1c-.3 0-.9 0-1.5.6C1.1 4.2 1 5.2 1 5.2S1 6.4 1 7.5v1c0 1.2 0 2.3.1 2.3s.1 1 .5 1.5c.6.6 1.4.6 1.7.6 1.2.1 4.7.1 4.7.1s2.8 0 4.9-.1c.3 0 .9 0 1.5-.6.5-.5.6-1.5.6-1.5V7.5c0-1.1 0-2.3-.1-2.3ZM6.6 9.9V5.9l4 2-4 2Z",
  },
  {
    name: "Podcast",
    href: "https://tda.podbean.com/",
    d: "M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Zm5 7a5 5 0 0 1-4.2 4.9V15H7.2v-2.1A5 5 0 0 1 3 8h1.4a3.6 3.6 0 0 0 7.2 0H13Z",
  },
  {
    name: "X",
    href: "https://x.com/garthheckman",
    d: "M11.9 1.5h2.2L9.3 7l5.7 7.5h-4.5L7 9.9l-4 4.6H.8l5.2-6-5.5-7h4.6l3.1 4.2 3.7-4.2Zm-.8 11.7h1.2L4.9 2.7H3.6l7.5 10.5Z",
  },
];
