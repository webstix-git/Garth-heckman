export type AskQuestion = {
  q: string;
  /** Short label above the answer, when Garth is calling out a myth. */
  kicker?: string;
  /** Paragraphs split on blank lines. **bold** and [label](href) are allowed. */
  a: string;
};

export type AskTopic = {
  id: string;
  title: string;
  questions: AskQuestion[];
};

export const ASK_TOPICS: AskTopic[] = [
  {
    id: "nutrition",
    title: "Nutrition",
    questions: [
      {
        q: "How do I eat to lose fat without losing muscle?",
        kicker: "Myth buster",
        a: "You can build muscle and lose fat at the same time. It works best when you're lifting consistently, keeping reps in the 5–9 range, weights medium-to-heavy, and protein high. Fair warning — it takes about a year to see the real results. But it's the best kind of results: the ones that actually last.",
      },
      {
        q: "How much protein do I actually need, and do I need supplements or is food enough?",
        a: "Good rule of thumb: 1 gram of protein per pound of bodyweight, minimum. Protein is protein — food or shake, doesn't matter — but supplements make it a lot easier to hit the number. That said, as a trainer and nutritionist, protein isn't the real battle. Consistency in the gym is.",
      },
      {
        q: "What's a simple, sustainable way to eat that doesn't require tracking every calorie forever?",
        a: "Honest answer — there isn't one. Track your food on your phone; there are plenty of apps, and yeah, it's still a pain either way. What actually works is prepping and packing your meals a week in advance. Decide once, eat clean all week.",
      },
      {
        q: "What is the ultimate hack for a healthy lifestyle?",
        a: "Keep it simple: work out, then eat plenty of protein and fiber every day. I personally eat 250 grams of protein a day and go through almost a can of black beans daily. You don't have to start there but it's something to shoot for.",
      },
      {
        q: "What is the best piece of advice you could give someone about nutrition?",
        a: "Stop thinking about food as flavor. Start thinking about it as fuel. Period.\n\nEat what fuels your workouts and feeds your muscles — who cares if it's bland or a pain to prep. You can eat sugary, fatty garbage and end up looking like it, or you can eat like a man who's still playing tackle football with his grandkids at 70.",
      },
    ],
  },
  {
    id: "training",
    title: "Training",
    questions: [
      {
        q: "What's the best way to start (or restart) training when I'm out of shape or coming back from time off?",
        a: "The #1 move: get a training partner. You keep each other accountable — showing up for someone else is easier than showing up for yourself some days. Before you even start, put together a clear workout plan so you're not improvising in the gym.",
      },
      {
        q: "How do I build real strength without access to a big gym or a ton of equipment?",
        a: "You can build serious strength with just a barbell and plates. Hit Craigslist or Facebook Marketplace, spend $300, and you've got a home gym. Pair that with the internet's endless programming resources, and you can get a great workout in with almost nothing.",
      },
      {
        q: "How many days a week should I actually be training to see results without burning out?",
        a: "If you're over 40, train 5 days a week, hitting each body part once: Chest/Tris, Back, Shoulders, Biceps, Legs. It builds consistency, and you don't need to grind out long sessions — just show up and hit your one target.",
      },
      {
        q: "If you only had 20 minutes to work out, what would you do?",
        a: "Deadlifts and dips, back and forth. Barely any setup, easy to superset, and it's a full-body workout in under 20 minutes — flat out.",
      },
      {
        q: "What keeps people from seeing real results?",
        a: "I watch guys come into the gym every single day, and they never change. Never lose the weight, never firm up, never build real muscle. Why? They go through the motions — machine to machine, never pushing themselves. You have to lift heavy to get real results. There is no strength without strain.",
      },
    ],
  },
  {
    id: "personal-development",
    title: "Personal Development",
    questions: [
      {
        q: "How do I build discipline when I don't feel motivated?",
        a: "Systems are the key. You already run a system to get up and go to work every day without \"feeling\" like it. Build that same system for eating right, training, reading, and praying. Here's the move that actually makes it stick: ask people to help you. Build accountability into your life. Give someone the right to hold your feet to the fire.",
      },
      {
        q: "How do I figure out my purpose or calling instead of just drifting?",
        a: "Your purpose is simple: serve God, bring His kingdom to earth. Your calling is usually where your gifting, your passions, and your talents intersect — ask God to marry those three together, and you'll find your sweet spot. Your job doesn't have to be your purpose. You can clock in to pay the bills and still live out your purpose fully outside of that. And if you can get your wife on board with it? Even better.",
      },
      {
        q: "How do I stop procrastinating and actually follow through on what I say I'll do?",
        a: "For me, it's always the starting that's the hurdle. So I built a ritual to get my head right: hot coffee, some 80's hair metal (or whatever fits the mood), and a promise — five minutes of mental prep, five minutes of hard work. Why only five minutes? Because I know once I start, I'll almost always end up putting in an hour or two.",
      },
      {
        q: "What have you found to be the best steps to personal development?",
        a: "I read a book a week. Sounds intense — it isn't. Here's the hack: take the page count and divide it by 7, then divide that by 3. Read that number at breakfast, lunch, and dinner. Example: 250-page book = 35 pages a day = about 11 \"pages\" per meal. But here's the real secret — since most books print on both sides, 11 pages is really only about 5 physical sheets. Suddenly it's nothing.\n\nRead across every area of life — and if a book bores you in the first 25 pages, drop it and move on. Life's too short for a bad book.",
      },
      {
        q: "How much time do you put into personal development a day/week/year?",
        a: "I keep media consumption low unless it's educational — spiritual, health, music theory, whatever sharpens me. That's the key filter. Beyond that: one 4-hour block a week set aside purely for deep study, one seminar a year of my choosing, and I'm almost always enrolled in something online, which runs about 3 hours a week.",
      },
    ],
  },
  {
    id: "spiritual-life",
    title: "Spiritual Life",
    questions: [
      {
        q: "How do I know God's will for my life / hear from Him clearly?",
        a: "Most guys ask this question hoping for the big, life-altering answer. But it starts smaller: what is God's will for my life today? Build that mindset into your day — then your week, your month, your year — and it bleeds into the bigger picture. Don't try to skip the daily will and jump straight to your \"life calling.\" God builds men in the daily grind, not the highlight reel.",
      },
      {
        q: "How do I stay consistent in prayer and reading the Bible instead of it being on-and-off?",
        a: "Don't try to do more than 10 minutes at a time — it'll grow naturally as you build consistency. Second, keep a journal and write down what you got out of those 10 minutes. Feels cheesy to some guys, but it makes a massive difference. Build a routine, stick to it, and bring a couple friends into the mix for an even better shot at consistency.",
      },
      {
        q: "What do I do when I feel spiritually dry or distant from God?",
        a: "Know this: dry seasons are part of the walk, not a sign you're failing it. We get good times, bad times, hard times — we don't get the \"perfect\" life until we see Jesus face to face. Every test makes you stronger, so let the process do its work. It also helps me to remember my kids are watching how I navigate the dry seasons — I'm setting the example whether I feel like it or not.\n\nAnd here's the real kick in the pants: when you feel dry, go share Christ with someone. It'll light a fire in you again, even if they don't accept it.",
      },
      {
        q: "What is the best hack to stay spiritually on fire?",
        a: "It's the whole premise of my book, [WTFU](/product/wtfu-book): go out with other men, weekly, and share the gospel. Pray for people, right there in public. The park. The mall. The car show. The 7/11 parking lot. Wherever people are — go be the gospel in front of them.",
      },
      {
        q: "What is your motivation for staying spiritually on fire?",
        a: "My kids and grandkids. Here's the hard truth: it's a natural tendency for our kids to end up just slightly less spiritually intense than we were — and our grandkids fall a little short of them. It's a slow, incremental decline in spiritual fervor, conviction, and discernment, generation after generation.\n\nLook at the pattern honestly, and you'll see it: grandpa was on fire, and by the time it reaches the grandkids, it's barely a spark. That's exactly the trend I refuse to be a part of.",
      },
    ],
  },
  {
    id: "marriage",
    title: "Marriage",
    questions: [
      {
        q: "How do I know if she's the right one / how do I know I'm ready?",
        a: "Do your due diligence. Ask her friends and her circle what she's really like. Watch how she treats her father — does she see him as a hero, or does she talk about him with contempt? Don't rush it; expect it to take up to three years before you truly know her. **Do not become physically involved** with her before marriage — it skews your judgment more than you think. And know this going in: there's no \"perfect\" mate. Marriage is brutal, it's hard, and it's worth every bit of the fight. The longer you stay in it, the better it gets.",
      },
      {
        q: "How do I lead in a relationship or marriage without being controlling or passive?",
        a: "Read. Pray. Obey. Love your wife — sacrifice for her, serve her — but let her know that when you hear from God, you're going to follow that lead, regardless of her opinion or anyone else's. You've got to earn the right to say that by actually proving you hear His voice and act on it. You follow Jesus first. Everything else follows from that.",
      },
      {
        q: "How do we keep our marriage strong and connected once the \"spark\" fades or life gets busy (kids, work, stress)?",
        a: "First and always: keep dating her, and keep working on being best friends. Best friends can get through anything — if you just stay \"married\" without staying close, it gets old fast. And touch and kiss her daily. No matter what.",
      },
      {
        q: "What is the best marriage advice you have ever been given?",
        a: "John Gottman said it best: don't miss your wife's bids for attention. If both of you learn to catch each other's bids — for connection, conversation, attention — you stay soft toward one another instead of drifting apart one missed moment at a time.\n\nGottman's research found that couples who stayed together responded to those bids about 86% of the time, versus roughly 33% for couples who ended up divorced.",
      },
      {
        q: "What is one thing people do not understand about marriage?",
        a: "Two things, actually. First: it takes far longer than people expect to build a truly great marriage. Research says somewhere around 35 years — but every bit of the time, struggle, and sacrifice is worth it. You don't get there without walking through all three.\n\nSecond: your marriage will be the single greatest catalyst for growth in your spiritual walk that you'll ever encounter. Don't run from it. Embrace it.",
      },
    ],
  },
];
