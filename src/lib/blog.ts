export const BLOG_FILTERS = ["all", "marriage", "generations", "evangelism"] as const;

export type BlogFilter = (typeof BLOG_FILTERS)[number];

export type BlogPost = {
  slug: string;
  tag: Exclude<BlogFilter, "all">;
  tagLabel: string;
  read: string;
  date: string;
  dateLong: string;
  v: "warm" | "dark" | "cool" | "light";
  t: string;
  h1: [string, string];
  lede: string;
  tldr: string;
  d: string;
  img: string;
  imgAlt: string;
  imgNote: string;
  badges: string[];
  quote: { text: string; cite: string };
  cta: { kicker: string; t: string; d: string; href: string; btn: string };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "name-the-thing-that-will-end-it",
    tag: "marriage",
    tagLabel: "Marriage & Relationships",
    read: "7 min",
    date: "18 Aug 26",
    dateLong: "18 August 2026",
    v: "warm",
    t: "Name the thing that will actually end it",
    h1: ["Name the thing", "that will actually end it"],
    lede: "Date night is not a marriage plan. Find the crack, say it out loud, then rebuild what is under the floor.",
    tldr: "Encouragement keeps a couple in the room. It is not what saves them. Name the thing that will actually end the marriage, say it out loud, and repair that. The rest is paint.",
    d: "Most marriage help is a pep talk with a worksheet. The house is still on fire. Here is what to do instead.",
    img: "/assets/img/room-relationship.png",
    imgAlt: "Garth Heckman and his wife at the table",
    imgNote: "Marriage · at the table",
    badges: ["Marriage", "Relationship Recall"],
    quote: {
      text: "Find the cracks in the foundation, expose them, rebuild them, and give you a total recall.",
      cite: "Relationship Recall",
    },
    cta: {
      kicker: "Keep going",
      t: "Get the first Relationship Recall email",
      d: "One a week. Unsubscribe whenever.",
      href: "/relationship-recall",
      btn: "Sign up",
    },
  },
  {
    slug: "they-were-raised-in-a-different-room",
    tag: "generations",
    tagLabel: "Generational Differences",
    read: "7 min",
    date: "11 Aug 26",
    dateLong: "11 August 2026",
    v: "cool",
    t: "They were raised in a different room",
    h1: ["They were raised", "in a different room"],
    lede: "Five generations in one sanctuary is not a personality problem. It is a translation problem. Stop preaching like everybody grew up in your decade.",
    tldr: "Traditionalists built it. Boomers led it. Gen X is running it tired. Millennials stay if it is real. Gen Z will not come back for a brand. Preach like you know which room you are in.",
    d: "Why your staff meeting keeps turning into a culture war, and what to do before another generation walks.",
    img: "/assets/img/room-bridgeworks.png",
    imgAlt: "Garth Heckman with a room of church leaders around working tables",
    imgNote: "Generations · in the room",
    badges: ["Generations", "Bridgeworks"],
    quote: {
      text: "You cannot preach one sermon to five rooms and then get mad that four of them heard a slight.",
      cite: "Bridgeworks",
    },
    cta: {
      kicker: "The work",
      t: "Book a Bridgeworks discovery call",
      d: "Ask Garth to teach your business, church or church staff how to Understand, Attract, Connect and Disciple.",
      href: "/bridgeworks",
      btn: "Book the call",
    },
  },
  {
    slug: "if-it-sounds-like-a-pitch-they-already-left",
    tag: "evangelism",
    tagLabel: "Evangelism",
    read: "6 min",
    date: "04 Aug 26",
    dateLong: "04 August 2026",
    v: "dark",
    t: "If it sounds like a pitch, they already left",
    h1: ["If it sounds like a pitch,", "they already left"],
    lede: "People have been sold all week. They did not come to church for another close. Tell the truth. Stay in the room when it gets awkward.",
    tldr: "Evangelism that counts hands and runs a funnel is a sales meeting with a cross on the wall. What still works is a straight story, a real question, and somebody who is not in a hurry.",
    d: "Stop treating the gospel like a product launch. Tell the truth about your own life and stay after it gets quiet.",
    img: "/assets/img/room-church.png",
    imgAlt: "Garth Heckman on a church stage with a pastor and an open Bible",
    imgNote: "Evangelism · Sunday",
    badges: ["Evangelism", "Simply Church"],
    quote: {
      text: "If your evangelism strategy requires a fog machine, you do not have a strategy. You have a production.",
      cite: "Make God look good",
    },
    cta: {
      kicker: "A smaller room",
      t: "Start one in your living room",
      d: "Ten people, coffee, names. Much like Acts 2, and considerably less complicated.",
      href: "/simply-church",
      btn: "Simply Church",
    },
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function otherPosts(slug: string) {
  return BLOG_POSTS.filter((p) => p.slug !== slug);
}
