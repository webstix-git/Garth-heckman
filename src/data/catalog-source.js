/* ==========================================================================
   CATALOG: product taxonomy + data model
   --------------------------------------------------------------------------
   This file is the reference schema for the reusable Webstix Next.js commerce
   foundation. It is deliberately over-specified: Garth's catalogue only uses
   part of it, but every field here is one the next client will need.

   Product types drive the UI, not the category:
     simple    fixed price, no options            (journal)
     variable  fixed price + option matrix         (t-shirt, mug)
     digital   fixed price, download fulfilment    (PDF, audiobook)
     pwyw      pay-what-you-want w/ suggested amt  (WTFU book)

   Fulfilment drives checkout requirements:
     self      client ships           -> shipping address required
     printify  print-on-demand        -> shipping address required
     download  file delivery          -> no shipping step
   ========================================================================== */

export const CURRENCY = 'USD';

/* --------------------------------------------------------------------------
   TAXONOMY
   Categories are the browsable tree (one primary per product, many secondary).
   Collections are merchandising groups, orthogonal to the tree.
   -------------------------------------------------------------------------- */
export const TAXONOMY = {
  categories: [
    {
      slug: 'books', name: 'Books', order: 1,
      description: 'Print and audio titles from Garth.',
      children: [
        { slug: 'print-books', name: 'Print' },
        { slug: 'audiobooks',  name: 'Audio' }
      ]
    },
    {
      slug: 'digital', name: 'Digital & Resources', order: 2,
      description: 'Instant downloads: study guides, decks and training material.',
      children: [
        { slug: 'guides',   name: 'Guides & PDFs' },
        { slug: 'training', name: 'Training Decks' },
        { slug: 'cancer-resources', name: 'Cancer Resources' }
      ]
    },
    {
      slug: 'merch', name: 'Merchandise', order: 3,
      description: 'WTFU branded goods, printed and shipped on demand.',
      children: [
        { slug: 'apparel',    name: 'Apparel' },
        { slug: 'drinkware',  name: 'Drinkware' },
        { slug: 'stationery', name: 'Stationery' },
        { slug: 'accessories', name: 'Accessories' }
      ]
    }
  ],
  collections: [
    { slug: 'featured',        name: 'Featured' },
    { slug: 'triple-c',        name: 'Triple C Survivor' },
    { slug: 'wtfu-collection', name: 'The WTFU Collection' },
    { slug: 'new',             name: 'New' },
    { slug: 'support-mission', name: 'Support the Mission' }
  ],
  productTypes: [
    { slug: 'pwyw',     name: 'Pay what you want' },
    { slug: 'variable', name: 'Variable (options)' },
    { slug: 'digital',  name: 'Digital download' },
    { slug: 'simple',   name: 'Simple' }
  ]
};

/* --------------------------------------------------------------------------
   PRODUCTS
   -------------------------------------------------------------------------- */
export const PRODUCTS = [
  {
    id: 'p_wtfu_book',
    sku: 'GH-WTFU-BOOK',
    slug: 'wtfu-book',
    status: 'active',
    type: 'pwyw',
    fulfillment: 'self',
    title: 'Wake The Faith Up',
    subtitle: 'WTFU, Revelation 3:1–3',
    categories: ['books', 'print-books'],
    collections: ['featured', 'wtfu-collection', 'support-mission'],
    tags: ['book', 'faith', 'signature'],
    badge: { label: 'Pay what you want', variant: 'gold' },
    price: {
      currency: CURRENCY,
      amount: 1,           // display / default amount
      suggested: 1,        // client: $1 suggested donation
      min: 1,
      max: 500,
      presets: [1, 10, 25, 50],
      presetLabels: ['Suggested', 'Supporter', 'Partner', 'Champion'],
      compareAt: null
    },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: 'WTFU book cover', note: 'Front cover', src: '/assets/img/products/wtfu-book.png' },
      { kind: 'placeholder', variant: 'ember', ratio: '3-4', label: 'Book in hand', note: 'Lifestyle 01' },
      { kind: 'placeholder', variant: 'default', ratio: '3-4', label: 'Interior spread', note: 'Lifestyle 02' },
      { kind: 'placeholder', variant: 'cool', ratio: '3-4', label: 'Garth signing', note: 'Lifestyle 03' }
    ],
    descriptionShort: 'Men were made for war, not for watching from the stands. Wake the Faith Up is a call to take up arms against the kingdom of darkness, and it includes a 30-day devotional so the reading turns into a fight.',
    descriptionLong: [
      'Revelation 3 opens with a church that had a reputation for being alive, and was not. <strong>Wake the Faith Up</strong> is Garth’s answer to that verse: direct, unsentimental, written by a man who has spent more than forty years in ministry and has buried more comfortable assumptions than most people ever hold.',
      'It is not a gentle book. It is the book Garth wishes someone had handed him at twenty-five. Read it. Work the 30-day devotional. Then get up and fight.'
    ],
    pwywGets: ['Paperback, 214 pages', '30-day devotional included', 'Signed by Garth', 'Ships free in the US'],
    details: [
      { label: 'Format', value: 'Paperback, 214 pages' },
      { label: 'Includes', value: '30-day devotional' },
      { label: 'Scripture', value: 'Revelation 3:1–3' },
      { label: 'Published', value: 'Independent' },
      { label: 'Ships', value: 'Signed and shipped by Garth, 3–5 business days' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 12, originNote: 'Ships from Minnesota, USA' },
    digital: null,
    related: ['p_burn_this_book', 'p_wtfu_audiobook', 'p_wtfu_tee'],
    seo: {
      title: 'Wake The Faith Up (WTFU), pay what you want | Garth Heckman',
      description: 'Garth Heckman’s Wake the Faith Up, including a 30-day devotional. Suggested donation $1.'
    }
  },

  {
    id: 'p_wtfu_audiobook',
    sku: 'GH-WTFU-AUDIO',
    slug: 'wtfu-audiobook',
    status: 'active',
    type: 'pwyw',
    fulfillment: 'download',
    title: 'Wake The Faith Up (Audiobook)',
    subtitle: 'Read by Garth Heckman',
    categories: ['books', 'audiobooks'],
    collections: ['wtfu-collection'],
    tags: ['audiobook', 'digital'],
    badge: { label: 'Suggested donation', variant: 'gold' },
    price: {
      currency: CURRENCY,
      amount: 1,
      suggested: 1,
      min: 1,            // client: suggested donation $1–$500
      max: 500,
      presets: [1, 10, 25, 50],
      presetLabels: ['Suggested', 'Supporter', 'Partner', 'Champion'],
      compareAt: null
    },
    media: [{ kind: 'image', variant: 'cool', ratio: '1-1', label: 'Audiobook artwork', note: 'Cover', src: '/assets/img/products/wtfu-audiobook.png' }],
    descriptionShort: 'Wake the Faith Up in Garth’s own voice. Men were made for war. Suggested donation, from $1 to $500.',
    descriptionLong: [
      'The whole book, read by the man who lived it. Same words as the paperback, which turns out to matter more than you would expect on the harder chapters.',
      'Pay what the mission is worth to you, from a dollar to $500. If money is the reason you would not otherwise listen, take it for a dollar and think nothing of it.'
    ],
    /* Shown in the pay-what-you-want ladder. Deliberately not a runtime: the
       recording is not finished, and inventing a length would be a lie. */
    pwywGets: ['MP3 and M4B files', 'Read by Garth himself', 'Yours to keep, no app required'],
    ctaLabel: 'Get the audiobook',
    details: [
      { label: 'Format', value: 'MP3 and M4B' },
      { label: 'Device', value: 'Any phone, tablet or computer' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'wake-the-faith-up-audiobook.zip', sizeMb: null }], downloadLimit: 5, expiryDays: 365 },
    related: ['p_wtfu_book'],
    seo: { title: 'WTFU Audiobook | Garth Heckman', description: 'Wake the Faith Up, read by Garth Heckman. Suggested donation $1 to $500.' }
  },

  {
    id: 'p_burn_this_book',
    sku: 'GH-BTB-PDF',
    slug: 'burn-this-book',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: 'Burn This Book',
    subtitle: 'PDF',
    categories: ['digital', 'guides'],
    collections: ['new'],
    tags: ['pdf', 'digital', 'devotional'],
    badge: null,
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [{ kind: 'image', variant: 'ember', ratio: '1-1', label: 'Burn This Book', note: 'Cover', src: '/assets/img/products/burn-this-book.png' }],
    descriptionShort: 'A 30-chapter Christian devotional for youth. Print it, read it, write in it and BURN IT.',
    descriptionLong: [
      'Thirty chapters, written for young people who are done sitting still. Print it. Read it. Write in it. Then burn it, because this one is meant to be used up, not shelved.'
    ],
    details: [
      { label: 'Format', value: 'PDF, 30 chapters' },
      { label: 'For', value: 'Youth and young adults' },
      { label: 'Delivery', value: 'Download link on the confirmation page and by email' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' }
    ],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'BurnThisBook.pdf', sizeMb: 23.9 }], downloadLimit: 5, expiryDays: 365 },
    related: ['p_generations_deck', 'p_wtfu_book'],
    seo: { title: 'Burn This Book (PDF), $5 | Garth Heckman', description: '30-chapter youth devotional. Print it, read it, write in it and burn it. $5 PDF.' }
  },

  {
    id: 'p_generations_deck',
    sku: 'GH-GEN-DECK',
    slug: 'generations-training-deck',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: 'Generations Training Deck',
    subtitle: 'PDF, multigenerational ministry training',
    categories: ['digital', 'training'],
    collections: ['new'],
    tags: ['pdf', 'training', 'bridgeworks', 'leadership'],
    badge: { label: 'Free', variant: 'digital' },
    price: { currency: CURRENCY, amount: 0, suggested: null, presets: [], compareAt: null,  },
    media: [{ kind: 'image', variant: 'cool', ratio: '1-1', label: 'Generations deck', note: 'Deck cover', src: '/assets/img/products/generations-training-deck.png' }],
    descriptionShort: 'Free training on generational dynamics. The deck Garth uses with pastors, staff teams and boards to Understand, Attract, Connect and Disciple.',
    descriptionLong: ['Five generations in one room, each hearing a different sermon. This is the deck Garth walks senior pastors, church staffs and business teams through, and it is free.'],
    details: [
      { label: 'Format', value: 'PDF deck' },
      { label: 'Best for', value: 'Senior pastors, staff teams, boards' },
      { label: 'Pairs with', value: 'Bridgeworks discovery call' }
    ],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'Generations_Training_Deck.pdf', sizeMb: 2.1 }], downloadLimit: 5, expiryDays: 365 },
    related: ['p_burn_this_book', 'p_wtfu_book'],
    seo: { title: 'Generations Training Deck (PDF), free | Garth Heckman', description: 'Free generational-dynamics training deck for church and business leadership teams.' }
  },

  {
    id: 'p_wtfu_tee',
    sku: 'GH-WTFU-TEE',
    slug: 'wtfu-tee',
    status: 'active',
    type: 'variable',
    fulfillment: 'printify',
    title: 'WTFU Tee',
    subtitle: '',
    categories: ['merch', 'apparel'],
    collections: ['featured', 'wtfu-collection'],
    tags: ['apparel', 'printify'],
    badge: null,
    price: { currency: CURRENCY, amount: 44.39,       // Printify selling + 20%, L/White
      listPrice: 44.39, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'WTFU tee, front', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/105264/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'light',   ratio: '1-1', label: 'WTFU tee, back', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/105265/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=back&v=20260818' },
      { kind: 'printify', variant: 'cool',    ratio: '1-1', label: 'Collar', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/131080/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=collar-closeup&v=20260818' },
      { kind: 'printify', variant: 'ember',   ratio: '1-1', label: 'Worn', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/131081/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=person-left&v=20260818' }
    ],
    // Printify prose fallback (live enrich overwrites)
    descriptionShort:
      'A bit more formal than a standard-issue t-shirt, the ultra cotton long sleeve tee is a clear comfort winner. The sleeves also act as a nice frame. There are no side seams. The shoulders are taped for improved durability. This makes for a good fitting around the shoulders and neck. The cotton used for these shirts is environmentally friendly.',
    descriptionLong: [],
    details: [],
    options: [
      { name: 'Color', type: 'swatch', values: [
        { label: 'White', value: 'white', hex: '#ffffff' } // Printify White only
      ]},
      { name: 'Size', type: 'button', values: [
        // Labels match Printify size titles; values are stable cart keys
        { label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l' },
        { label: 'XL', value: 'xl' }, { label: '2XL', value: '2xl' }, { label: '3XL', value: '3xl' }
      ]}
    ],
    variants: [
      // Prices = Printify selling × 1.20; White only (Printify variant ids in printify-map)
      { id: 'v_tee_white_s',  sku: 'GH-TEE-WH-S',  options: { 'Color': 'white', 'Size': 's'  }, price: 43.19, inventory: 999 },
      { id: 'v_tee_white_m',  sku: 'GH-TEE-WH-M',  options: { 'Color': 'white', 'Size': 'm'  }, price: 44.39, inventory: 999 },
      { id: 'v_tee_white_l',  sku: 'GH-TEE-WH-L',  options: { 'Color': 'white', 'Size': 'l'  }, price: 44.39, inventory: 999 },
      { id: 'v_tee_white_xl', sku: 'GH-TEE-WH-XL', options: { 'Color': 'white', 'Size': 'xl' }, price: 40.79, inventory: 999 },
      { id: 'v_tee_white_2xl',sku: 'GH-TEE-WH-2XL',options: { 'Color': 'white', 'Size': '2xl'}, price: 43.19, inventory: 999 },
      { id: 'v_tee_white_3xl',sku: 'GH-TEE-WH-3XL',options: { 'Color': 'white', 'Size': '3xl'}, price: 40.79, inventory: 999 }
    ],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 7, originNote: 'Printed and shipped on demand, allow 2–7 business days' },
    digital: null,
    related: ['p_wtfu_mug', 'p_wtfu_journal', 'p_wtfu_book', 'p_wtfu_tank'],
    seo: { title: 'WTFU Tee | Garth Heckman', description: 'Heavyweight cotton tee with the WTFU lockup.' }
  },

  {
    id: 'p_wtfu_tank',
    sku: 'GH-WTFU-TANK',
    slug: 'wtfu-tank',
    status: 'active',
    type: 'simple',
    fulfillment: 'printify',
    title: 'WTFU Tank Top',
    subtitle: '',
    categories: ['merch', 'apparel'],
    collections: ['wtfu-collection', 'new'],
    tags: ['apparel', 'printify', 'tank'],
    badge: { label: 'New', variant: 'ink' },
    price: { currency: CURRENCY, amount: 38.92, listPrice: 38.92, compareAt: null, presets: [] }, // Printify selling + 20%
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'WTFU tank, front', note: '', src: 'https://images-api.printify.com/mockup/6ab2a06fe4786b291d0532fc/119785/109930/mens-premium-tank-top.jpg?camera_label=front' },
      { kind: 'printify', variant: 'cool', ratio: '1-1', label: 'WTFU tank, back', note: '', src: 'https://images-api.printify.com/mockup/6ab2a06fe4786b291d0532fc/119785/109967/mens-premium-tank-top.jpg?camera_label=back' }
    ],
    // Printify prose fallback (live enrich overwrites)
    descriptionShort:
      'Stay cool and comfortable in this Men’s Tank Top, crafted from 100% combed ring-spun cotton for a soft, breathable feel. Featuring a soft-washed, mid/heavyweight knit and a relaxed fit, it’s designed to transition effortlessly from intense workouts to casual weekend outings.',
    descriptionLong: [],
    details: [],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 6, originNote: 'Printed and shipped on demand, allow 2–7 business days' },
    digital: null,
    related: ['p_wtfu_tee', 'p_wtfu_mug', 'p_leather_bracelet'],
    seo: { title: 'Men\'s Premium Tank Top | Garth Heckman', description: 'Men’s premium tank top, White Large.' }
  },

  {
    id: 'p_leather_bracelet',
    sku: 'GH-LEATHER-BRACELET',
    slug: 'leather-bracelet',
    status: 'active',
    type: 'simple',
    fulfillment: 'printify',
    title: 'Leather Bracelet with Beads',
    subtitle: '',
    categories: ['merch', 'accessories'],
    collections: ['wtfu-collection', 'new'],
    tags: ['accessories', 'printify', 'bracelet'],
    badge: { label: 'New', variant: 'ink' },
    price: { currency: CURRENCY, amount: 72.36, listPrice: 72.36, compareAt: null, presets: [] }, // Printify selling + 20%
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'Leather bracelet, front', note: '', src: 'https://images-api.printify.com/mockup/6ab2a0d2abbcc6610304e118/253999/128121/leather-bracelet-with-beads-engraving.jpg?camera_label=front' }
    ],
    // Printify prose fallback (live enrich overwrites)
    descriptionShort:
      'Sleek, bold, and deeply personal - this bracelet is designed to tell your story. Featuring four customizable engraved beads, it lets you carry meaningful names, dates, or words wherever you go. The smooth leather wrap pairs effortlessly with the polished accents, creating a timeless piece. Perfect for everyday wear or as a thoughtful gift.',
    descriptionLong: [],
    details: [],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 3, originNote: 'Made and shipped on demand, allow 2–7 business days' },
    digital: null,
    related: ['p_wtfu_tank', 'p_wtfu_journal', 'p_wtfu_tee'],
    seo: { title: 'Leather Bracelet with Beads | Garth Heckman', description: 'Leather bracelet with stainless steel beads, 8.5 inches.' }
  },

  {
    id: 'p_wtfu_mug',
    sku: 'GH-WTFU-MUG',
    slug: 'wtfu-mug',
    status: 'active',
    type: 'variable',
    fulfillment: 'printify',
    title: 'Accent Coffee Mug (11oz)',
    subtitle: '',
    categories: ['merch', 'drinkware'],
    collections: ['wtfu-collection'],
    tags: ['drinkware', 'printify'],
    badge: null,
    price: { currency: CURRENCY, amount: 15.59,       // Printify selling + 20%, 11oz
      listPrice: 15.59, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'WTFU mug, front', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102752/accent-coffee-mug-11-15oz.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'default', ratio: '1-1', label: 'Mug, right', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102754/accent-coffee-mug-11-15oz.jpg?camera_label=right&v=20260818' },
      { kind: 'printify', variant: 'cool', ratio: '1-1', label: 'Mug, left', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102756/accent-coffee-mug-11-15oz.jpg?camera_label=left&v=20260818' },
      { kind: 'printify', variant: 'ember', ratio: '1-1', label: 'Mug, back', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102758/accent-coffee-mug-11-15oz.jpg?camera_label=back&v=20260818' }
    ],
    // Printify prose fallback (live enrich overwrites). Specs-only <p> blanks need this
    // so cards are never empty if the API briefly fails.
    descriptionShort:
      'Meet your next favorite morning companion, the accented ceramic mug. This mug brings the perfect blend of style and functionality to elevate your coffee or tea ritual. Offered in 11oz (0.33 l), this mug offers ample space for your favorite brew. Made with white ceramic and sporting a sleek glossy finish with eye-catching contrast, this mug is a bliss both to use and to look at.',
    descriptionLong: [],
    details: [],
    options: [
      // Printify size title is "11oz" (15oz Black is disabled in Printify — not offered)
      { name: 'Size', type: 'button', values: [ { label: '11oz', value: '11oz' } ] }
    ],
    variants: [
      { id: 'v_mug_11', sku: 'GH-MUG-11', options: { 'Size': '11oz' }, price: 15.59, inventory: 999 }
    ],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 16, originNote: 'Printed and shipped on demand, allow 2–7 business days' },
    digital: null,
    related: ['p_wtfu_tee', 'p_wtfu_journal', 'p_wtfu_tank'],
    seo: { title: 'Accent Coffee Mug (11oz) | Garth Heckman', description: 'Ceramic accent coffee mug, 11oz.' }
  },

  {
    id: 'p_wtfu_journal',
    sku: 'GH-WTFU-JRN',
    slug: 'wtfu-journal',
    status: 'active',
    type: 'simple',
    fulfillment: 'printify',
    title: 'Hardcover Journal Matte',
    subtitle: '',
    categories: ['merch', 'stationery'],
    collections: ['wtfu-collection', 'new'],
    tags: ['stationery', 'printify'],
    badge: { label: 'New', variant: 'ink' },
    price: { currency: CURRENCY, amount: 20.39,       // Printify selling + 20%
      listPrice: 20.39, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'ember', ratio: '1-1', label: 'WTFU journal, open', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7340/hardcover-journal-matte.jpg?camera_label=opened&v=20260818' },
      { kind: 'printify', variant: 'default', ratio: '1-1', label: 'WTFU journal, front', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7338/hardcover-journal-matte.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'Journal, back', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7339/hardcover-journal-matte.jpg?camera_label=back&v=20260818' },
      { kind: 'printify', variant: 'cool', ratio: '1-1', label: 'Journal, inside', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7341/hardcover-journal-matte.jpg?camera_label=inside&v=20260818' }
    ],
    // Printify prose fallback (live enrich overwrites)
    descriptionShort:
      'Make your everyday journaling more personal, private, and stylish with this matte hardcover journal. Available in 5.75"x8", with 150 lined pages, these sturdy hardcover journals are fully customizable on the front and on the back covers. The matte laminate coating on the cover will make them stay true to your personal style.',
    descriptionLong: [],
    details: [],
    options: [], variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: true },
    shipping: { required: true, weightOz: 14, originNote: 'Printed and shipped on demand, allow 2–7 business days' },
    digital: null,
    related: ['p_wtfu_tee', 'p_wtfu_mug', 'p_leather_bracelet'],
    seo: { title: 'Hardcover Journal Matte | Garth Heckman', description: 'Hardcover lined journal, 150 pages.' }
  },

  /* ---- Triple C Survivor: the cancer set, $5 each -------------------- */
  {
    id: 'p_365_quotes',
    sku: 'GH-365-QUOTES',
    slug: '365-quotes',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: '365 Quotes',
    subtitle: 'PDF, instant download',
    categories: ['digital', 'cancer-resources'],
    collections: ['triple-c'],
    tags: ['cancer', 'resource', 'download', 'triple c'],
    badge: { label: 'Instant download', variant: 'digital' },
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: '365 Quotes', note: 'Cover', src: '/assets/img/products/365-quotes.png' }
    ],
    descriptionShort: 'A quote a day for the year you did not plan for.',
    descriptionLong: ['One short line for each day of the year, gathered from four decades of ministry and three rounds of cancer. Made to be read in the ten seconds you have, not the hour you do not.'],
    details: [
      { label: 'Format', value: 'PDF, 365 pages' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: '365-quotes.pdf', sizeMb: null }] },
    related: ['p_wtfu_book'],
    seo: { title: '365 Quotes | Garth Heckman', description: 'A quote a day for the year you did not plan for.' }
  },
  {
    id: 'p_365_day_journal',
    sku: 'GH-365-DAY-JOURNAL',
    slug: '365-day-journal',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: '365-Day Journal',
    subtitle: 'PDF, instant download',
    categories: ['digital', 'cancer-resources'],
    collections: ['triple-c'],
    tags: ['cancer', 'resource', 'download', 'triple c'],
    badge: { label: 'Instant download', variant: 'digital' },
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: '365-Day Journal', note: 'Cover', src: '/assets/img/products/365-day-journal.png' }
    ],
    descriptionShort: 'A page a day, for the year treatment takes.',
    descriptionLong: ['A dated page for every day, with room for what the appointment actually said, what you felt about it, and one thing worth keeping. Print it or write into it on a tablet.'],
    details: [
      { label: 'Format', value: 'PDF, printable, 365 pages' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: '365-day-journal.pdf', sizeMb: null }] },
    related: ['p_wtfu_book'],
    seo: { title: '365-Day Journal | Garth Heckman', description: 'A page a day, for the year treatment takes.' }
  },
  {
    id: 'p_cancer_terminology',
    sku: 'GH-CANCER-TERMINOLOGY',
    slug: 'cancer-terminology',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: 'Cancer Terminology',
    subtitle: 'PDF, instant download',
    categories: ['digital', 'cancer-resources'],
    collections: ['triple-c'],
    tags: ['cancer', 'resource', 'download', 'triple c'],
    badge: { label: 'Instant download', variant: 'digital' },
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: 'Cancer Terminology', note: 'Cover', src: '/assets/img/products/cancer-terminology.png' }
    ],
    descriptionShort: 'The words they use, in the words you use.',
    descriptionLong: ['Plain-English translations of the terms that get said quickly in a consulting room and looked up frantically afterwards. Staging, margins, markers, protocols, and what each one does and does not mean.'],
    details: [
      { label: 'Format', value: 'PDF, A–Z reference' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'cancer-terminology.pdf', sizeMb: null }] },
    related: ['p_wtfu_book'],
    seo: { title: 'Cancer Terminology | Garth Heckman', description: 'The words they use, in the words you use.' }
  },
  {
    id: 'p_nourishing_your_body_through_cancer',
    sku: 'GH-NOURISHING-YOUR-BO',
    slug: 'nourishing-your-body-through-cancer',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: 'Nourishing Your Body Through Cancer',
    subtitle: 'PDF, instant download',
    categories: ['digital', 'cancer-resources'],
    collections: ['triple-c'],
    tags: ['cancer', 'resource', 'download', 'triple c'],
    badge: { label: 'Instant download', variant: 'digital' },
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: 'Nourishing Your Body Through Cancer', note: 'Cover', src: '/assets/img/products/nourishing-your-body-through-cancer.png' }
    ],
    descriptionShort: 'Eating when nothing tastes right and nothing stays down.',
    descriptionLong: ['What to reach for when treatment has taken your appetite, your taste and your energy. Practical, unfussy, and written by somebody who has been on the receiving end of it three times.'],
    details: [
      { label: 'Format', value: 'PDF, guide' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'nourishing-your-body-through-cancer.pdf', sizeMb: null }] },
    related: ['p_wtfu_book'],
    seo: { title: 'Nourishing Your Body Through Cancer | Garth Heckman', description: 'Eating when nothing tastes right and nothing stays down.' }
  },
  {
    id: 'p_faith_based_cancer_survival_mindset_manual',
    sku: 'GH-FAITH-BASED-CANCER',
    slug: 'faith-based-cancer-survival-mindset-manual',
    status: 'active',
    type: 'digital',
    fulfillment: 'download',
    title: 'The Faith Based Cancer Survival Mindset Manual',
    subtitle: 'PDF, instant download',
    categories: ['digital', 'cancer-resources'],
    collections: ['triple-c'],
    tags: ['cancer', 'resource', 'download', 'triple c'],
    badge: { label: 'Instant download', variant: 'digital' },
    price: { currency: CURRENCY, amount: 5, suggested: null, presets: [], compareAt: null },
    media: [
      { kind: 'image', variant: 'light', ratio: '1-1', label: 'The Faith Based Cancer Survival Mindset Manual', note: 'Cover', src: '/assets/img/products/faith-based-cancer-survival-mindset-manual.png' }
    ],
    descriptionShort: 'The inner work, for the days the scans do not decide.',
    descriptionLong: ['Garth’s own framework for holding faith and fear at the same time. Not a promise that it will go your way, and not a lecture about believing harder.'],
    details: [
      { label: 'Format', value: 'PDF, manual' },
      { label: 'Device', value: 'Any: phone, tablet, desktop, print' },
      { label: 'Delivery', value: 'Download link the moment you pay' }
    ],
    options: [],
    variants: [],
    inventory: { tracked: false, quantity: null, allowBackorder: false },
    shipping: { required: false },
    digital: { files: [{ name: 'faith-based-cancer-survival-mindset-manual.pdf', sizeMb: null }] },
    related: ['p_wtfu_book'],
    seo: { title: 'The Faith Based Cancer Survival Mindset Manual | Garth Heckman', description: 'The inner work, for the days the scans do not decide.' }
  },
];

/* Prices in this file are still in dollars, matching the prototype schema.
   catalog.ts converts every amount to integer cents on import. */
