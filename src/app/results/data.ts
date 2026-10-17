// Everything the /results page shows, kept apart from the layout so filling in the real results is
// editing this file alone.

// People photos live in public/results/people: each was downloaded once from the event's S3 bucket
// (where the Hub app stores uploads), centre-cropped and shrunk to a 160px WebP - about 4 KB each
// instead of ~60 KB, and no longer dependent on that bucket.

export type QuestPerson = { name: string; photo?: string };

export type Winner = {
  project: string;
  team?: string;
  // The team's campus, from the Chodhyam "best projects" view - shown under the card's title.
  college?: string;
  // The handwritten blurb under the title - left out of the card until there is one.
  description?: string;
  // A card without one shows a numbered placeholder board.
  photo?: string;
  url?: string;
  // The project's id in the Hub (and the Chodhyam results base) - the same id the /projects page
  // keys its cards by.
  projectId: number;
  // The team, shown as faces on the card with each name on hover. Photos are the team_photos on the
  // project in the Chodhyam "best projects" view (Amal's, hosted only inside Chodhyam, swapped for
  // the same picture from his Hub profile).
  members: QuestPerson[];
};

// The main quest winners, in the order they rise past the "quest winners" title. Photos are
// public/results/1.png onwards, numbered in this same order. Descriptions and links are from the
// "best projects" view of the projects table in the Chodhyam results base - two of those
// descriptions were cut off in the base itself, so they end on an ellipsis here.
export const MAIN_QUEST_WINNERS: Winner[] = [
  {
    project: "zombie deck",
    college: "NSS College of Engineering, Akathethara",
    projectId: 8436,
    members: [
      { name: "Abhijith R", photo: "/results/people/2c678a375179.webp" },
      { name: "Adithya Vijay", photo: "/results/people/ed93a53161ff.webp" },
    ],
    description:
      "A post apocalyptic world where you have to LITERALLY run from zombies. A hardware-based zombie chase game that runs on a handheld Raspberry Pi terminal. Run for your life as zombies chase you!!",
    url: "https://github.com/Adithyaa04/useless_project_bitbybit",
  },
  {
    project: "dasamoolam",
    college: "Muthoot Institute of Technology & Science, Puthencruz",
    projectId: 8318,
    members: [
      { name: "Benett Bobby", photo: "/results/people/fe14f2f58472.webp" },
      { name: "Christia Regi", photo: "/results/people/2329ee65d42e.webp" },
    ],
    description:
      "What if you could capture your loved one’s reaction while they watch your favourite movie? A proudly useless project that lets two people watch a movie together remotely and capture each other’s reactions. Because annoying your loved one is better with proof.",
    url: "https://watchparty-snowy.vercel.app",
  },
  {
    project: "the shadow whisperer",
    college: "Muthoot Institute of Technology & Science, Puthencruz",
    projectId: 8323,
    members: [
      { name: "Aafia Gause", photo: "/results/people/a482c476ddf8.webp" },
      { name: "Sanjana Sujith", photo: "/results/people/7ff2cc82bcb9.webp" },
    ],
    description:
      "A fun computer-vision project that detects animal shadow puppets through a webcam and plays their corresponding sounds, adding sound effects to something that never needed them.",
    url: "https://sanjanarose-pixel.github.io/shadow-whisperer/",
  },
  {
    project: "evade",
    college: "Muthoot Institute of Technology & Science, Puthencruz",
    projectId: 8422,
    members: [
      { name: "John Varghese Nettady", photo: "/results/people/706d36443d23.webp" },
      { name: "Sam Sunny", photo: "/results/people/b026a029a58b.webp" },
    ],
    description:
      "A self-avoiding chair designed to make sure nobody gets to sit down easily. Using ultrasonic sensors and an ESP32, it detects approaching people and autonomously drives away.",
    url: "https://drive.google.com/file/d/1dSb62Aw_xkHWPjpUGgKaABemLk3gD3j-/view",
  },
  {
    project: "roll of duty",
    college: "SCMS School of Engineering & Technology, Karukutty",
    projectId: 8555,
    members: [
      { name: "Hari Prasad", photo: "/results/people/75f8813eced4.webp" },
      { name: "Muhammed Faheem", photo: "/results/people/f0f84c13c568.webp" },
    ],
    description:
      "A hardware game controller that turns real-world physical inputs into in-game actions, using an Arduino, a gyroscope, a joystick and buttons.",
    url: "https://github.com/hts98726-star/kaelix-useless-project",
  },
  {
    project: "laptop harmonium",
    college: "Unity Women's College, Manjeri",
    projectId: 8771,
    members: [
      { name: "Fathima Rasha P", photo: "/results/people/a44953dd3dc2.webp" },
      { name: "Fathima Sharin", photo: "/results/people/43e6db39c586.webp" },
    ],
    description:
      "Turns your laptop lid into a musical instrument. The webcam detects the screen’s opening angle and maps it to notes, playing harmonium-style sounds while you fold it. Hold still, and the sound stops.",
    url: "https://harmonium-lap.vercel.app/",
  },
  {
    project: "hopenodecore",
    college: "College of Engineering, Alappuzha",
    projectId: 9149,
    members: [
      { name: "Amal S Kumar", photo: "/results/people/3668e8d85fc8.webp" },
    ],
    description:
      "An off-grid peer-to-peer mesh messaging platform on a Rust core that routes encrypted packets without internet or cellular, bridging Bluetooth Low Energy and Wi-Fi Direct on everyday devices.",
    url: "https://github.com/Lunarmist-byte/hopenodecore",
  },
  {
    project: "meencrypt",
    college: "Jawaharlal College of Engineering and Technology, Lakkidi",
    projectId: 9282,
    members: [
      { name: "Abijit Arun", photo: "/results/people/8a6e04db7155.webp" },
      { name: "Sreelal VS", photo: "/results/people/0ab7dc48539e.webp" },
    ],
    description:
      "Imagine spending money on third-party apps to encrypt your diary, when you can just guard it with your pet fishes.",
    url: "https://github.com/abijit2626/MeenCrypt",
  },
  {
    project: "soman oru chaya",
    college: "NSS College of Engineering, Akathethara",
    projectId: 9394,
    members: [
      { name: "Aravind R", photo: "/results/people/c50438921ebf.webp" },
      { name: "Arjun Liji", photo: "/results/people/94d26fbbbdf4.webp" },
    ],
    description:
      "An interactive tea-making simulator where you prepare Soman Chettan’s perfect chaya using hand tracking - pouring, mixing and chaya adi. Follow his exact requirements, or face his judgement!",
    url: "https://useless-project-grove-street.vercel.app",
  },
  {
    project: "pinnochio",
    college: "NSS College of Engineering, Akathethara",
    projectId: 9631,
    members: [
      { name: "Sai Krishna", photo: "/results/people/3f7dd43fbcef.webp" },
      { name: "Snoopa K", photo: "/results/people/f36c7cedf433.webp" },
    ],
    description:
      "A sound-responsive puppet: a sound sensor, an Arduino and four servos make it perform dance sequences whenever things get loud enough.",
    url: "https://github.com/snoopak01/useless_project_pointless",
  },
  {
    project: "retinator",
    college: "Saintgits College of Engineering, Pathamuttom",
    projectId: 10053,
    members: [
      { name: "Abhinav Varghese Abraham", photo: "/results/people/495bf8bfe6cc.webp" },
      { name: "Reuben Skariah", photo: "/results/people/4cdba1458c48.webp" },
    ],
    description:
      "An overengineered, military-grade helmet-mounted computer vision engine that detects oncoming high-beam glare in real time, triangulates the driver’s eye position, and aims a high-lumen photon torch pulse straight…",
    url: "https://drive.google.com/file/d/1zYCttWQGgaiIfYYePrprCguUc2NPMQUS/view",
  },
  {
    project: "air-gapped kinetic clipboard",
    college: "Saintgits College of Engineering, Pathamuttom",
    projectId: 10085,
    members: [
      { name: "Abhimanu Shinoj", photo: "/results/people/6660f18c751d.webp" },
      { name: "Harigovind K R", photo: "/results/people/2f9eef630af6.webp" },
    ],
    description:
      "Copy on Windows. Paste on Linux. Delivered by robot. A highly over-engineered distributed system that physically transports clipboard data across a table…",
    url: "https://github.com/abhimanu854/Air-Gapped-Clipboard",
  },
  {
    project: "braille captions",
    college: "Saintgits College of Engineering, Pathamuttom",
    projectId: 10094,
    members: [
      { name: "Abhishek Reji", photo: "/results/people/e97a0c745568.webp" },
      { name: "Sidharth Menon V", photo: "/results/people/2cf71f580dcb.webp" },
    ],
    description:
      "Our project is exclusively for blind people, with full proof protection against the people who can see. This revolutionary project displays braille in dark and light modes.",
    url: "https://github.com/fakeiiyyy/useless_project_tempabhi",
  },
].map((winner, i) => ({ ...winner, photo: `/results/${i + 1}.png` }));

// Side quest results, from the Chodhyam (NocoDB) results base: the "Result" view of Competition
// Entries, plus the approved/selected rows of the documentary, journal and aftermovie tables.
// Only public-facing fields are copied over - the base also holds members' phones and emails.

export type CompetitionWinner = {
  // Matches a slug in src/lib/competitions.ts, which is where the widget gets the pixel badge.
  slug: string;
  category: string;
  project: string;
  team: string;
  campus: string;
  url: string;
  members: QuestPerson[];
};

export const COMPETITION_WINNERS: CompetitionWinner[] = [
  {
    slug: "best-fashion-tech-wearables",
    category: "best fashion tech & wearables",
    project: "Flying Butterfly Clip",
    team: "Fathima Kafiyah's Team",
    campus: "College of Engineering, Munnar",
    url: "https://github.com/fathimakafiyah/usele",
    members: [{ name: "Fathima Kafiyah", photo: "/results/people/066e2ab3cc83.webp" }],
  },
  {
    slug: "best-custom-input-device",
    category: "best custom input device",
    project: "Roll of Duty",
    team: "KAELIX",
    campus: "SCMS School of Engineering & Technology, Karukutty",
    url: "https://github.com/hts98726-star/kaelix-useless-project",
    members: [
      { name: "Hari Prasad", photo: "/results/people/75f8813eced4.webp" },
      { name: "Muhammed Faheem", photo: "/results/people/f0f84c13c568.webp" },
    ],
  },
  {
    slug: "best-superhero-sci-fi-gadget",
    category: "best superhero / sci-fi gadget",
    project: "Zombie Deck",
    team: "Bit by Bit",
    campus: "TinkerSpace, Kochi",
    url: "https://github.com/Adithyaa04/useless_project_bitbybit",
    members: [
      { name: "Abhijith R", photo: "/results/people/2c678a375179.webp" },
      { name: "Adithya Vijay", photo: "/results/people/ed93a53161ff.webp" },
    ],
  },
  {
    slug: "best-game-interactive-media",
    category: "best game / interactive media",
    project: "Baby Jelly",
    team: "Goutham Sankar's Team",
    campus: "College of Engineering and Management, Punnapra",
    url: "https://baby-phi-seven.vercel.app/",
    members: [{ name: "Goutham Sankar", photo: "/results/people/2de09f8970ea.webp" }],
  },
  {
    slug: "best-use-of-local-llms",
    category: "best use of local LLMs",
    project: "Banshee",
    team: "Induchoodan V S's Team",
    campus: "College of Engineering, Attingal",
    url: "https://youtu.be/vKCgkdJl9no",
    members: [{ name: "Induchoodan V S", photo: "/results/people/1470823c878e.webp" }],
  },
  {
    slug: "best-interactive-installation",
    category: "best interactive physical installation",
    project: "The Shadow Whisperer",
    team: "PixelPixies",
    campus: "Muthoot Institute of Technology & Science, Puthencruz",
    url: "https://sanjanarose-pixel.github.io/shadow-whisperer/",
    members: [
      { name: "Aafia Gause", photo: "/results/people/a482c476ddf8.webp" },
      { name: "Sanjana Sujith", photo: "/results/people/7ff2cc82bcb9.webp" },
    ],
  },
  {
    slug: "most-over-engineered-solution",
    category: "most over-engineered solution",
    project: "AirFlop",
    team: "Seraphin Raphy's Team",
    campus: "Model Engineering College, Thrikkakara",
    url: "https://air-flop.vercel.app/",
    members: [{ name: "Seraphin Raphy", photo: "/results/people/7a88739cf22c.webp" }],
  },
];

// One winner of a single-entry side quest (documentary, journal, aftermovie). `photo` is the
// person's own photo, from the team_photos on their project in the projects table, or failing that
// their profile avatar (TheHubDB memberships, via Metabase); anyone with neither gets an initial.
export type QuestEntry = { name: string; campus: string; project?: string; url: string; photo?: string };

export const DOCUMENTARY_WINNERS: QuestEntry[] = [
  {
    name: "Austin",
    campus: "SCMS School of Engineering & Technology",
    url: "https://www.instagram.com/reel/Dc_VuaezAg6/",
    photo: "/results/people/356833ba6782.webp",
  },
  {
    name: "Rida Kareem",
    campus: "NSS College of Engineering, Akathethara",
    project: "LED Garden",
    url: "https://www.instagram.com/p/DdgQKruRqJK/",
    photo: "/results/people/f23d482ffa60.webp",
  },
  {
    name: "Christy Basil Anil",
    campus: "St. Thomas College, Ranni",
    project: "Gramaphone of Jungle",
    url: "https://www.instagram.com/reel/Ddgg8wpzWvV/",
    photo: "/results/people/8f1adc633b25.webp",
  },
];

export const JOURNAL_WINNERS: QuestEntry[] = [
  {
    name: "Justin K James",
    campus: "SCMS School of Engineering & Technology, Karukutty",
    project: "Enne Kolland Irikkan Patto?",
    url: "https://mrmalayali555.github.io/Enne-Kolland-Irikkan-patto/journal/",
    photo: "/results/people/6dd69e441da8.webp",
  },
  {
    name: "Abhijith R",
    campus: "NSS College of Engineering, Akathethara",
    project: "Zombie Deck",
    url: "https://adithyaa04.github.io/useless_project_bitbybit/",
    photo: "/results/people/2c678a375179.webp",
  },
  {
    name: "Rida Kareem",
    campus: "NSS College of Engineering, Akathethara",
    project: "LED Garden",
    url: "https://ridakareem.github.io/useless_project_figtree/",
    photo: "/results/people/f23d482ffa60.webp",
  },
];

// The aftermovie prize goes to the venue, so this one shows the campus rather than whoever
// submitted it. Images are cutouts (sky removed) of the campus photos venues.ts uses.
// `venue` is the short name shown under the photo; `fullName` is what the hover note spells out.
export type VenueWinner = { venue: string; fullName: string; image: string; url: string };

export const AFTERMOVIE_WINNERS: VenueWinner[] = [
  { venue: "MEC", fullName: "Model Engineering College, Thrikkakara", image: "/results/venues/mec.webp", url: "https://www.instagram.com/reel/DdEZB9mCGk-/" },
  { venue: "MITS", fullName: "Muthoot Institute of Technology & Science", image: "/results/venues/mits.webp", url: "https://www.instagram.com/reel/DdQmEgdSfs6/" },
  { venue: "SCMS", fullName: "SCMS School of Engineering & Technology", image: "/results/venues/scms.webp", url: "https://www.instagram.com/reel/DdeR__HpqRC/" },
];

export type Person = { name: string; photo?: string };

// The heads in the "people behind useless projects" section. Anyone without a photo is drawn as a
// plain colored head, so the crowd can be filled in a few faces at a time.
export const PEOPLE: Person[] = [
  { name: "nandana", photo: "/nandu.png" },
  { name: "achuth", photo: "/achuth.png" },
  { name: "habeeb", photo: "/habeeb.png" },
  ...Array.from({ length: 45 }, (_, i) => ({ name: `person ${i + 4}` })),
];

// The closing note. Paragraphs render in order; the sign-off sits under the last one.
export const NOTE = {
  title: "a note",
  paragraphs: [
    "Beyond the prizes, Useless Projects is about celebrating making, finding joy in the process, and creating reasons for people to express their creativity and build whatever they want, without constraints.",
    "A huge shoutout to everyone who contributed and everyone who was part of this journey.",
    "Happy making!",
  ],
  signoff: "- campus team, tinkerhub",
};

// The video at the very end of the page, played like a GIF: muted, looping, no controls. It's a
// web export of the original 71 MB phone clip (IMG_6467.MP4, not kept in the repo): cropped to just the
// footage, which sat in the middle of a white 1080x1920 canvas, at 30fps with no audio - about 5 MB.
// `crop` is still there in case a future file needs trimming; for this one it's the whole frame.
export const CLOSING_VIDEO = {
  // The handwritten note beside the video.
  sideNote: "thank you folks, love u all <3",
  src: "/results/goodies-loop.mp4",
  width: 904,
  height: 504,
  crop: { x: 0, y: 0, width: 904, height: 504 },
};
