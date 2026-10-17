// Everything the /results page shows, kept apart from the layout so filling in the real results is
// editing this file alone.

// People photos are hotlinked from the event's S3 bucket (where the Hub app stores uploads).
const S3 = "https://appbucket-hoomans.s3.ap-south-1.amazonaws.com";

export type QuestPerson = { name: string; photo?: string };

export type Winner = {
  project: string;
  // Optional until they're confirmed - the credit line under the card is left out without them.
  team?: string;
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
    projectId: 8436,
    members: [
      { name: "Abhijith R", photo: `${S3}/1784355241281254315image_cropper_1784355229841.jpg` },
      { name: "Adithya Vijay", photo: `${S3}/1781546562193080746image_cropper_F8378384-4D7F-4530-89E5-CEDE33D283FF-15351-0000062C51DEE789.jpg` },
    ],
    description:
      "A post apocalyptic world where you have to LITERALLY run from zombies. A hardware-based zombie chase game that runs on a handheld Raspberry Pi terminal. Run for your life as zombies chase you!!",
    url: "https://github.com/Adithyaa04/useless_project_bitbybit",
  },
  {
    project: "dasamoolam",
    projectId: 8318,
    members: [
      { name: "Benett Bobby", photo: `${S3}/1753699559481010998image_cropper_1753699554752.jpg` },
      { name: "Christia Regi", photo: `${S3}/1736508183422869976image_cropper_9F97BC75-3F9C-4D1D-991D-155DA2050412-3221-000002BD9283B65A.jpg` },
    ],
    description:
      "What if you could capture your loved one’s reaction while they watch your favourite movie? A proudly useless project that lets two people watch a movie together remotely and capture each other’s reactions. Because annoying your loved one is better with proof.",
    url: "https://watchparty-snowy.vercel.app",
  },
  {
    project: "the shadow whisperer",
    projectId: 8323,
    members: [
      { name: "Aafia Gause", photo: `${S3}/1771252960892548356image_cropper_1771252951594.jpg` },
      { name: "Sanjana Sujith", photo: `${S3}/1733826412712139965image_cropper_94DE4D86-B4BD-4089-935E-55209EA0C4AB-13028-000001488793787F.jpg` },
    ],
    description:
      "A fun computer-vision project that detects animal shadow puppets through a webcam and plays their corresponding sounds, adding sound effects to something that never needed them.",
    url: "https://sanjanarose-pixel.github.io/shadow-whisperer/",
  },
  {
    project: "evade",
    projectId: 8422,
    members: [
      { name: "John Varghese Nettady", photo: `${S3}/17287435403568954641000005866.jpgduplicate.jpg` },
      { name: "Sam Sunny", photo: `${S3}/1753958566014312734image_cropper_1753958563492.jpg` },
    ],
    description:
      "A self-avoiding chair designed to make sure nobody gets to sit down easily. Using ultrasonic sensors and an ESP32, it detects approaching people and autonomously drives away.",
    url: "https://drive.google.com/file/d/1dSb62Aw_xkHWPjpUGgKaABemLk3gD3j-/view",
  },
  {
    project: "roll of duty",
    projectId: 8555,
    members: [
      { name: "Hari Prasad", photo: `${S3}/1000083793.jpgduplicate.jpg1726470974190689496` },
      { name: "Muhammed Faheem", photo: `${S3}/1000014841.jpgduplicate.jpg1726460605373924197` },
    ],
    description:
      "A hardware game controller that turns real-world physical inputs into in-game actions, using an Arduino, a gyroscope, a joystick and buttons.",
    url: "https://github.com/hts98726-star/kaelix-useless-project",
  },
  {
    project: "laptop harmonium",
    projectId: 8771,
    members: [
      { name: "Fathima Rasha P", photo: `${S3}/1787496819475776789image_cropper_1C36ABDA-48FC-4843-9056-BD55BE3D6E14-5093-000000FCA2F7C203.jpg` },
      { name: "Fathima Sharin", photo: `${S3}/1789018550783994875image_cropper_1789018532060.jpg` },
    ],
    description:
      "Turns your laptop lid into a musical instrument. The webcam detects the screen’s opening angle and maps it to notes, playing harmonium-style sounds while you fold it. Hold still, and the sound stops.",
    url: "https://harmonium-lap.vercel.app/",
  },
  {
    project: "hopenodecore",
    projectId: 9149,
    members: [
      { name: "Amal S Kumar", photo: `${S3}/1727256626824709079c709c8c0-2ec4-475d-9955-00f2794c806f-1_all_8917.jpgduplicate.jpg` },
    ],
    description:
      "An off-grid peer-to-peer mesh messaging platform on a Rust core that routes encrypted packets without internet or cellular, bridging Bluetooth Low Energy and Wi-Fi Direct on everyday devices.",
    url: "https://github.com/Lunarmist-byte/hopenodecore",
  },
  {
    project: "meencrypt",
    projectId: 9282,
    members: [
      { name: "Abijit Arun", photo: `${S3}/1785731960356966772image_cropper_1785731954138.jpg` },
      { name: "Sreelal VS", photo: `${S3}/1785164491623079422image_cropper_1785164481103.jpg` },
    ],
    description:
      "Imagine spending money on third-party apps to encrypt your diary, when you can just guard it with your pet fishes.",
    url: "https://github.com/abijit2626/MeenCrypt",
  },
  {
    project: "soman oru chaya",
    projectId: 9394,
    members: [
      { name: "Aravind R", photo: `${S3}/1760352920242418878image_cropper_1760352913913.jpg` },
      { name: "Arjun Liji", photo: `${S3}/1788264366714567848image_cropper_1788264357673.jpg` },
    ],
    description:
      "An interactive tea-making simulator where you prepare Soman Chettan’s perfect chaya using hand tracking - pouring, mixing and chaya adi. Follow his exact requirements, or face his judgement!",
    url: "https://useless-project-grove-street.vercel.app",
  },
  {
    project: "pinnochio",
    projectId: 9631,
    members: [
      { name: "Sai Krishna", photo: `${S3}/1764844997664872367image_cropper_16337BA3-FF6C-4650-8AA5-4AA6EF69242E-16073-0000022029D3050F.jpg` },
      { name: "Snoopa K", photo: `${S3}/1740029190460549177image_cropper_1740029177780.jpg` },
    ],
    description:
      "A sound-responsive puppet: a sound sensor, an Arduino and four servos make it perform dance sequences whenever things get loud enough.",
    url: "https://github.com/snoopak01/useless_project_pointless",
  },
  {
    project: "retinator",
    projectId: 10053,
    members: [
      { name: "Abhinav Varghese Abraham", photo: `${S3}/1775106884912837145image_cropper_1775106875455.jpg` },
      { name: "Reuben Skariah", photo: `${S3}/17290124610576653801000271216.jpgduplicate.jpg` },
    ],
    description:
      "An overengineered, military-grade helmet-mounted computer vision engine that detects oncoming high-beam glare in real time, triangulates the driver’s eye position, and aims a high-lumen photon torch pulse straight…",
    url: "https://drive.google.com/file/d/1zYCttWQGgaiIfYYePrprCguUc2NPMQUS/view",
  },
  {
    project: "air-gapped kinetic clipboard",
    projectId: 10085,
    members: [
      { name: "Abhimanu Shinoj", photo: `${S3}/1788759787358339591image_cropper_F807081D-69AA-4B38-AAC1-7897C54A70E4-12094-0000074EACBB72C7.jpg` },
      { name: "Harigovind K R", photo: `${S3}/1788766403230046024image_cropper_1788766397651.jpg` },
    ],
    description:
      "Copy on Windows. Paste on Linux. Delivered by robot. A highly over-engineered distributed system that physically transports clipboard data across a table…",
    url: "https://github.com/abhimanu854/Air-Gapped-Clipboard",
  },
  {
    project: "braille captions",
    projectId: 10094,
    members: [
      { name: "Abhishek Reji", photo: `${S3}/17289285982929728591000005815.jpgduplicate.jpg` },
      { name: "Sidharth Menon V", photo: `${S3}/1753510788546789548image_cropper_1753510761628.jpg` },
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
    members: [{ name: "Fathima Kafiyah", photo: `${S3}/1788716484358685718image_cropper_1788716480761.jpg` }],
  },
  {
    slug: "best-custom-input-device",
    category: "best custom input device",
    project: "Roll of Duty",
    team: "KAELIX",
    campus: "SCMS School of Engineering & Technology, Karukutty",
    url: "https://github.com/hts98726-star/kaelix-useless-project",
    members: [
      { name: "Hari Prasad", photo: `${S3}/1000083793.jpgduplicate.jpg1726470974190689496` },
      { name: "Muhammed Faheem", photo: `${S3}/1000014841.jpgduplicate.jpg1726460605373924197` },
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
      { name: "Abhijith R", photo: `${S3}/1784355241281254315image_cropper_1784355229841.jpg` },
      { name: "Adithya Vijay", photo: `${S3}/1781546562193080746image_cropper_F8378384-4D7F-4530-89E5-CEDE33D283FF-15351-0000062C51DEE789.jpg` },
    ],
  },
  {
    slug: "best-game-interactive-media",
    category: "best game / interactive media",
    project: "Baby Jelly",
    team: "Goutham Sankar's Team",
    campus: "College of Engineering and Management, Punnapra",
    url: "https://baby-phi-seven.vercel.app/",
    members: [{ name: "Goutham Sankar", photo: `${S3}/17304437052855504741000021500.jpgduplicate.jpg` }],
  },
  {
    slug: "best-use-of-local-llms",
    category: "best use of local LLMs",
    project: "Banshee",
    team: "Induchoodan V S's Team",
    campus: "College of Engineering, Attingal",
    url: "https://youtu.be/vKCgkdJl9no",
    members: [{ name: "Induchoodan V S", photo: `${S3}/1733334213893632842image_cropper_1733334211254.jpg` }],
  },
  {
    slug: "best-interactive-installation",
    category: "best interactive physical installation",
    project: "The Shadow Whisperer",
    team: "PixelPixies",
    campus: "Muthoot Institute of Technology & Science, Puthencruz",
    url: "https://sanjanarose-pixel.github.io/shadow-whisperer/",
    members: [
      { name: "Aafia Gause", photo: `${S3}/1771252960892548356image_cropper_1771252951594.jpg` },
      { name: "Sanjana Sujith", photo: `${S3}/1733826412712139965image_cropper_94DE4D86-B4BD-4089-935E-55209EA0C4AB-13028-000001488793787F.jpg` },
    ],
  },
  {
    slug: "most-over-engineered-solution",
    category: "most over-engineered solution",
    project: "AirFlop",
    team: "Seraphin Raphy's Team",
    campus: "Model Engineering College, Thrikkakara",
    url: "https://air-flop.vercel.app/",
    members: [{ name: "Seraphin Raphy", photo: `${S3}/17276294496279582201000016424.jpgduplicate.jpg` }],
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
    photo: `${S3}/1753617432240643467image_cropper_1753617426125.jpg`,
  },
  {
    name: "Rida Kareem",
    campus: "NSS College of Engineering, Akathethara",
    project: "LED Garden",
    url: "https://www.instagram.com/p/DdgQKruRqJK/",
    photo: `${S3}/1730349708865609815image_picker_30AC7632-84E8-4C31-BBF2-54333097B7A1-6035-000000EC69406028.jpgduplicate.jpg`,
  },
  {
    name: "Christy Basil Anil",
    campus: "St. Thomas College, Ranni",
    project: "Gramaphone of Jungle",
    url: "https://www.instagram.com/reel/Ddgg8wpzWvV/",
    photo: `${S3}/1781588189430963890image_cropper_1781588177145.jpg`,
  },
];

export const JOURNAL_WINNERS: QuestEntry[] = [
  {
    name: "Justin K James",
    campus: "SCMS School of Engineering & Technology, Karukutty",
    project: "Enne Kolland Irikkan Patto?",
    url: "https://mrmalayali555.github.io/Enne-Kolland-Irikkan-patto/journal/",
    photo: `${S3}/1787945735121217434image_cropper_1787945726841.jpg`,
  },
  {
    name: "Abhijith R",
    campus: "NSS College of Engineering, Akathethara",
    project: "Zombie Deck",
    url: "https://adithyaa04.github.io/useless_project_bitbybit/",
    photo: `${S3}/1784355241281254315image_cropper_1784355229841.jpg`,
  },
  {
    name: "Rida Kareem",
    campus: "NSS College of Engineering, Akathethara",
    project: "LED Garden",
    url: "https://ridakareem.github.io/useless_project_figtree/",
    photo: `${S3}/1730349708865609815image_picker_30AC7632-84E8-4C31-BBF2-54333097B7A1-6035-000000EC69406028.jpgduplicate.jpg`,
  },
];

// The aftermovie prize goes to the venue, so this one shows the campus rather than whoever
// submitted it. Images are cutouts (sky removed) of the campus photos venues.ts uses.
export type VenueWinner = { venue: string; image: string; url: string };

export const AFTERMOVIE_WINNERS: VenueWinner[] = [
  { venue: "MEC Thrikkakara", image: "/results/venues/mec.webp", url: "https://www.instagram.com/reel/DdEZB9mCGk-/" },
  { venue: "MITS", image: "/results/venues/mits.webp", url: "https://www.instagram.com/reel/DdQmEgdSfs6/" },
  { venue: "SCMS", image: "/results/venues/scms.webp", url: "https://www.instagram.com/reel/DdeR__HpqRC/" },
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
