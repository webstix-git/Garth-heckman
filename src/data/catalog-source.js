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
        { slug: 'stationery', name: 'Stationery' }
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
      amount: 10,          // display / default amount
      suggested: 10,       // client: $10 suggested donation
      min: 10,
      max: 500,
      presets: [10, 25, 50, 100],
      presetLabels: ['Suggested', 'Supporter', 'Partner', 'Champion'],
      compareAt: null
    },
    media: [
      { kind: 'image', variant: 'light', ratio: '3-4', label: 'WTFU book cover', note: 'Front cover', src: '/assets/img/products/wtfu-book.png' },
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
      description: 'Garth Heckman’s Wake the Faith Up, including a 30-day devotional. Suggested donation $10.'
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
    badge: { label: 'Pay what you want', variant: 'gold' },
    price: {
      currency: CURRENCY,
      amount: 10,
      suggested: 10,
      min: 1,            // client: suggested donation $1–$500
      max: 500,
      presets: [10, 25, 50, 100],
      presetLabels: ['Suggested', 'Supporter', 'Partner', 'Champion'],
      compareAt: null
    },
    media: [{ kind: 'image', variant: 'cool', ratio: '3-4', label: 'Audiobook artwork', note: 'Cover', src: '/assets/img/products/wtfu-book.png' }],
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
    media: [{ kind: 'image', variant: 'ember', ratio: '3-4', label: 'Burn This Book', note: 'Cover', src: '/assets/img/products/burn-this-book.png' }],
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
    media: [{ kind: 'image', variant: 'cool', ratio: '4-3', label: 'Generations deck', note: 'Deck cover', src: '/assets/img/products/generations-training-deck.png' }],
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
    subtitle: 'Heavyweight cotton, front lockup',
    categories: ['merch', 'apparel'],
    collections: ['featured', 'wtfu-collection'],
    tags: ['apparel', 'printify'],
    badge: null,
    price: { currency: CURRENCY, amount: 36.99,       // Printify selling price, L/White
      listPrice: 36.99, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'WTFU tee, front', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/105264/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'light',   ratio: '1-1', label: 'WTFU tee, back', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/105265/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=back&v=20260818' },
      { kind: 'printify', variant: 'cool',    ratio: '1-1', label: 'Collar', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/131080/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=collar-closeup&v=20260818' },
      { kind: 'printify', variant: 'ember',   ratio: '1-1', label: 'Worn', note: '', src: 'https://images-api.printify.com/mockup/6a81c07e42e8d58d9209fbfc/33793/131081/unisex-ultra-cotton-long-sleeve-tee.jpg?camera_label=person-left&v=20260818' }
    ],
    descriptionShort: 'The lockup on a shirt heavy enough to survive a Wisconsin winter.',
    descriptionLong: ['Printed and shipped on demand through Printify. Nothing is warehoused, so allow a little longer than a stocked item.'],
    details: [
      { label: 'Fabric', value: '100% ring-spun cotton, 6.0 oz' },
      { label: 'Fit', value: 'Classic, true to size' },
      { label: 'Care', value: 'Cold wash, tumble low, do not iron the print' },
      { label: 'Made', value: 'Printed on demand by Printify' }
    ],
    options: [
      { name: 'Color', type: 'swatch', values: [
        { label: 'White', value: 'white', hex: '#F4F1EA' },
        { label: 'Black', value: 'black', hex: '#1E1913' },
        { label: 'Bone',  value: 'bone',  hex: '#E3DACB' },
        { label: 'Slate', value: 'slate', hex: '#49535C' }
      ]},
      { name: 'Size', type: 'button', values: [
        { label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l' },
        { label: 'XL', value: 'xl' }, { label: '2XL', value: '2xl' }, { label: '3XL', value: '3xl' }
      ]}
    ],
    variants: [
      { id: 'v_tee_white_s',  sku: 'GH-TEE-WH-S',  options: { 'Color': 'white', 'Size': 's'  }, price: 35.99, inventory: 40 },
      { id: 'v_tee_white_m',  sku: 'GH-TEE-WH-M',  options: { 'Color': 'white', 'Size': 'm'  }, price: 36.99, inventory: 40 },
      { id: 'v_tee_white_l',  sku: 'GH-TEE-WH-L',  options: { 'Color': 'white', 'Size': 'l'  }, price: 36.99, inventory: 40 },
      { id: 'v_tee_white_xl', sku: 'GH-TEE-WH-XL', options: { 'Color': 'white', 'Size': 'xl' }, price: 33.99, inventory: 22 },
      { id: 'v_tee_white_2xl',sku: 'GH-TEE-WH-2XL',options: { 'Color': 'white', 'Size': '2xl'}, price: 35.99, inventory: 8  },
      { id: 'v_tee_white_3xl',sku: 'GH-TEE-WH-3XL',options: { 'Color': 'white', 'Size': '3xl'}, price: 33.99, inventory: 4  },
      { id: 'v_tee_black_s',  sku: 'GH-TEE-BK-S',  options: { 'Color': 'black', 'Size': 's'  }, price: 24.99, inventory: 12 },
      { id: 'v_tee_black_m',  sku: 'GH-TEE-BK-M',  options: { 'Color': 'black', 'Size': 'm'  }, price: 33.99, inventory: 40 },
      { id: 'v_tee_black_l',  sku: 'GH-TEE-BK-L',  options: { 'Color': 'black', 'Size': 'l'  }, price: 26.99, inventory: 40 },
      { id: 'v_tee_black_xl', sku: 'GH-TEE-BK-XL', options: { 'Color': 'black', 'Size': 'xl' }, price: 24.99, inventory: 22 },
      { id: 'v_tee_black_2xl',sku: 'GH-TEE-BK-2XL',options: { 'Color': 'black', 'Size': '2xl'}, price: 34.99, inventory: 8  },
      { id: 'v_tee_black_3xl',sku: 'GH-TEE-BK-3XL',options: { 'Color': 'black', 'Size': '3xl'}, price: 33.99, inventory: 0  },
      { id: 'v_tee_bone_s',   sku: 'GH-TEE-BN-S',  options: { 'Color': 'bone',  'Size': 's'  }, price: 31.25, inventory: 5  },
      { id: 'v_tee_bone_m',   sku: 'GH-TEE-BN-M',  options: { 'Color': 'bone',  'Size': 'm'  }, price: 31.25, inventory: 18 },
      { id: 'v_tee_bone_l',   sku: 'GH-TEE-BN-L',  options: { 'Color': 'bone',  'Size': 'l'  }, price: 31.25, inventory: 18 },
      { id: 'v_tee_bone_xl',  sku: 'GH-TEE-BN-XL', options: { 'Color': 'bone',  'Size': 'xl' }, price: 31.25, inventory: 0  },
      { id: 'v_tee_bone_2xl', sku: 'GH-TEE-BN-2XL',options: { 'Color': 'bone',  'Size': '2xl'}, price: 34.48, inventory: 4  },
      { id: 'v_tee_bone_3xl', sku: 'GH-TEE-BN-3XL',options: { 'Color': 'bone',  'Size': '3xl'}, price: 36.48, inventory: 2  },
      { id: 'v_tee_slate_s',  sku: 'GH-TEE-SL-S',  options: { 'Color': 'slate', 'Size': 's'  }, price: 31.25, inventory: 0  },
      { id: 'v_tee_slate_m',  sku: 'GH-TEE-SL-M',  options: { 'Color': 'slate', 'Size': 'm'  }, price: 31.25, inventory: 9  },
      { id: 'v_tee_slate_l',  sku: 'GH-TEE-SL-L',  options: { 'Color': 'slate', 'Size': 'l'  }, price: 31.25, inventory: 14 },
      { id: 'v_tee_slate_xl', sku: 'GH-TEE-SL-XL', options: { 'Color': 'slate', 'Size': 'xl' }, price: 31.25, inventory: 6  },
      { id: 'v_tee_slate_2xl',sku: 'GH-TEE-SL-2XL',options: { 'Color': 'slate', 'Size': '2xl'}, price: 34.48, inventory: 3  },
      { id: 'v_tee_slate_3xl',sku: 'GH-TEE-SL-3XL',options: { 'Color': 'slate', 'Size': '3xl'}, price: 36.43, inventory: 0  }
    ],
    inventory: { tracked: true, allowBackorder: false },
    shipping: { required: true, weightOz: 7, originNote: 'Printed and shipped on demand, allow 5–9 business days' },
    digital: null,
    related: ['p_wtfu_mug', 'p_wtfu_journal', 'p_wtfu_book'],
    seo: { title: 'WTFU Tee | Garth Heckman', description: 'Heavyweight cotton tee with the WTFU lockup.' }
  },

  {
    id: 'p_wtfu_mug',
    sku: 'GH-WTFU-MUG',
    slug: 'wtfu-mug',
    status: 'active',
    type: 'variable',
    fulfillment: 'printify',
    title: 'WTFU Mug',
    subtitle: 'Ceramic, dishwasher safe',
    categories: ['merch', 'drinkware'],
    collections: ['wtfu-collection'],
    tags: ['drinkware', 'printify'],
    badge: null,
    price: { currency: CURRENCY, amount: 12.99,       // Printify selling price, 11oz
      listPrice: 12.99, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'WTFU mug, front', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102752/accent-coffee-mug-11-15oz.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'default', ratio: '1-1', label: 'Mug, right', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102754/accent-coffee-mug-11-15oz.jpg?camera_label=right&v=20260818' },
      { kind: 'printify', variant: 'cool', ratio: '1-1', label: 'Mug, left', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102756/accent-coffee-mug-11-15oz.jpg?camera_label=left&v=20260818' },
      { kind: 'printify', variant: 'ember', ratio: '1-1', label: 'Mug, back', note: '', src: 'https://images-api.printify.com/mockup/6a81bf8042e8d58d9209f92e/72180/102758/accent-coffee-mug-11-15oz.jpg?camera_label=back&v=20260818' }
    ],
    descriptionShort: 'For the 5am cup, before anybody else is awake.',
    descriptionLong: ['Printed on demand. Microwave and dishwasher safe.'],
    details: [
      { label: 'Material', value: 'White ceramic' },
      { label: 'Care', value: 'Dishwasher and microwave safe' },
      { label: 'Made', value: 'Printed on demand by Printify' }
    ],
    options: [
      { name: 'Size', type: 'button', values: [ { label: '11 oz', value: '11oz' }, { label: '15 oz', value: '15oz' } ] }
    ],
    variants: [
      { id: 'v_mug_11', sku: 'GH-MUG-11', options: { 'Size': '11oz' }, price: 12.99, inventory: 50 },
      { id: 'v_mug_15', sku: 'GH-MUG-15', options: { 'Size': '15oz' }, price: 13.71, inventory: 50 }
    ],
    inventory: { tracked: true, allowBackorder: false },
    shipping: { required: true, weightOz: 16, originNote: 'Printed and shipped on demand, allow 5–9 business days' },
    digital: null,
    related: ['p_wtfu_tee', 'p_wtfu_journal'],
    seo: { title: 'WTFU Mug | Garth Heckman', description: 'Ceramic WTFU mug, 11oz or 15oz.' }
  },

  {
    id: 'p_wtfu_journal',
    sku: 'GH-WTFU-JRN',
    slug: 'wtfu-journal',
    status: 'active',
    type: 'simple',
    fulfillment: 'printify',
    title: 'WTFU Journal',
    subtitle: 'Hardcover, lined, 128 pages',
    categories: ['merch', 'stationery'],
    collections: ['wtfu-collection', 'new'],
    tags: ['stationery', 'printify'],
    badge: { label: 'New', variant: 'ink' },
    price: { currency: CURRENCY, amount: 16.99,       // Printify selling price
      listPrice: 16.99, compareAt: null, presets: [] },
    media: [
      { kind: 'printify', variant: 'ember', ratio: '1-1', label: 'WTFU journal, open', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7340/hardcover-journal-matte.jpg?camera_label=opened&v=20260818' },
      { kind: 'printify', variant: 'default', ratio: '1-1', label: 'WTFU journal, front', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7338/hardcover-journal-matte.jpg?camera_label=front&v=20260818' },
      { kind: 'printify', variant: 'light', ratio: '1-1', label: 'Journal, back', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7339/hardcover-journal-matte.jpg?camera_label=back&v=20260818' },
      { kind: 'printify', variant: 'cool', ratio: '1-1', label: 'Journal, inside', note: '', src: 'https://images-api.printify.com/mockup/6a81c32700177bb8ff0d06c4/65223/7341/hardcover-journal-matte.jpg?camera_label=inside&v=20260818' }
    ],
    descriptionShort: 'Somewhere to put the thing God said at 3am so you still have it at 3pm.',
    descriptionLong: ['Hardcover, lined, printed on demand.'],
    details: [
      { label: 'Pages', value: '128, lined' },
      { label: 'Cover', value: 'Hardcover, matte' },
      { label: 'Made', value: 'Printed on demand by Printify' }
    ],
    options: [], variants: [],
    inventory: { tracked: true, quantity: 25, allowBackorder: false },
    shipping: { required: true, weightOz: 14, originNote: 'Printed and shipped on demand, allow 5–9 business days' },
    digital: null,
    related: ['p_wtfu_tee', 'p_wtfu_mug'],
    seo: { title: 'WTFU Journal | Garth Heckman', description: 'Hardcover lined WTFU journal.' }
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
      { kind: 'image', variant: 'light', ratio: '3-4', label: '365 Quotes', note: 'Cover', src: '/assets/img/products/365-quotes.png' }
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
      { kind: 'image', variant: 'light', ratio: '3-4', label: '365-Day Journal', note: 'Cover', src: '/assets/img/products/365-day-journal.png' }
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
      { kind: 'image', variant: 'light', ratio: '3-4', label: 'Cancer Terminology', note: 'Cover', src: '/assets/img/products/cancer-terminology.png' }
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
      { kind: 'image', variant: 'light', ratio: '3-4', label: 'Nourishing Your Body Through Cancer', note: 'Cover', src: '/assets/img/products/nourishing-your-body-through-cancer.png' }
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
      { kind: 'image', variant: 'light', ratio: '3-4', label: 'The Faith Based Cancer Survival Mindset Manual', note: 'Cover', src: '/assets/img/products/faith-based-cancer-survival-mindset-manual.png' }
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
