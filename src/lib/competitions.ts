// Data for the /competitions/[slug] pages and the Airtable submissions table behind them.
// Add a new object here to open up a new competition - the handbook prize card, the
// /competitions index, and the detail page all render straight off this array.
export type Competition = {
  slug: string;
  // Each competition writes to its own table in the "Useless Projects - Competitions" Airtable
  // base, rather than sharing one table filtered by a "Competition" field - Airtable wouldn't let
  // this token add new options to a shared singleSelect field, and a table per competition sidesteps
  // that entirely. IDs come from src/lib/airtable.ts's TABLE_IDS map. Omitted for an `autoJudged`
  // competition, which has no separate submission to store.
  airtableTableId?: string;
  prizeLabel: string;
  prizeText: string;
  // Same badge image the handbook's prize section uses for this competition, so the two places
  // read as the same prize rather than one being the "real" version of the other. Omitted where
  // no distinct image exists yet - the detail page just skips the hero image in that case.
  image?: string;
  tagline: string;
  howToRedeem: string;
  whatWeMean: string;
  guidelines: string[];
  samples: { title: string; permalink?: string; youtubeId?: string }[];
  // Hostnames (no "www.") the submission link must belong to, and the label/placeholder shown
  // on the form's link field - a video competition wants Instagram/YouTube, a repo-based one
  // wants GitHub, etc. Not needed when `autoJudged` is set, since there's no link field to submit.
  linkHosts?: string[];
  linkLabel?: string;
  linkPlaceholder?: string;
  // True for a prize judged straight off the normal Hub app project submission - no separate
  // entry to fill in, so the detail page skips the "submit" section entirely.
  autoJudged?: boolean;
  // True when this is entered per venue (by the venue host, on behalf of everyone there) rather
  // than per individual participant/team - venue aftermovie is the only one of these right now.
  venueExclusive?: boolean;
};

export const COMPETITIONS: Competition[] = [
  {
    slug: "best-build-video-documentary",
    airtableTableId: "tblhvFymbFDdqZsi4",
    prizeLabel: "video journal / build log",
    prizeText: "Top 3 get a ₹3,000-worth hardware kit each.",
    image: "/handbook/build-documentary.png",
    tagline:
      "Compress your entire hackathon experience into a fast-paced, entertaining video build log - your project coming to life from scratch in under 90 seconds.",
    howToRedeem:
      "Post the reel on Instagram - you must invite @tinkerhub as a collaborator or tag the official @tinkerhub handle in your post - then submit the link below with your name and campus. Submitting here is mandatory: tagging or inviting @tinkerhub on Instagram alone doesn't enter you, only links submitted through this form are considered for judging. We review submissions after the hackathon and announce the winner alongside the other results.",
    whatWeMean:
      "Not a polished ad for your project - a fast, honest build log. Timelapses, quick clips of soldering or coding, the pivots, the bugs that broke on camera, and what you actually learned, all inside a minute thirty.",
    guidelines: [
      "Strictly under 1 minute 30 seconds (≤ 1:30).",
      "Short-form video/reel, posted on Instagram.",
      "Invite @tinkerhub as a collaborator, or tag @tinkerhub in the post.",
      "The build process: timelapses, quick clips of soldering, coding, or assembling.",
      "Team dynamics: voiceovers or clips of the team working and brainstorming together.",
      "Pivots & bug fixes: what broke on camera, and how you figured it out.",
      "Key learnings: a quick takeaway on what new skills you picked up.",
      "Judged on pacing, storytelling energy, clarity of team contribution, and how well the technical journey is explained in a short time.",
    ],
    samples: [],
    linkHosts: ["instagram.com"],
    linkLabel: "Instagram link",
    linkPlaceholder: "https://instagram.com/reel/...",
  },
  {
    slug: "venue-aftermovie",
    airtableTableId: "tbl1Ef5OIVaJ6Wa98",
    prizeLabel: "venue after-movie",
    prizeText: "Top 3 venues get a ₹5,000-worth hardware kit each.",
    image: "/handbook/aftermovie-venue.png",
    tagline:
      "Capture the vibe, energy, and atmosphere of the entire event - the venue, the people, the late-night grinding, and the overall hackathon culture. Venue-exclusive: one entry per venue, submitted by the host, not individual participants.",
    howToRedeem:
      "This one's for the venue host, not individual participants or teams - one after-movie per venue. Post it on Instagram - you must invite @tinkerhub as a collaborator or tag the official @tinkerhub handle in your post - then submit the link below with the venue host's name and the campus. Submitting here is mandatory: tagging or inviting @tinkerhub on Instagram alone doesn't enter you, only links submitted through this form are considered for judging. We review submissions after the hackathon and announce the winner alongside the other results.",
    whatWeMean:
      "The wide shot to the build log's close-up. Not one team's build process - the whole room: the energy, the food breaks, the late-night moments, what your venue actually felt like that night.",
    guidelines: [
      "Venue-exclusive: one submission per venue, from the host - not something individual teams enter separately.",
      "Strictly under 2 minutes (≤ 2:00).",
      "Cinematic reel/video, posted on Instagram.",
      "Invite @tinkerhub as a collaborator, or tag @tinkerhub in the post.",
      "Venue & atmosphere: the hacking space, hardware tables, food breaks, late-night moments.",
      "Community spirit: interactions with other teams, mentors, and organizers.",
      "Event highlights: kickoffs, mini-games, hardware teardowns, demo sessions.",
      "Judged on cinematography, editing/sound design, storytelling, and how well it captures the overall event spirit.",
    ],
    samples: [],
    venueExclusive: true,
    linkHosts: ["instagram.com"],
    linkLabel: "Instagram link",
    linkPlaceholder: "https://instagram.com/reel/...",
  },
  {
    slug: "journal-repo",
    prizeLabel: "project journal",
    prizeText: "Top 3 get a ₹3,000-worth hardware kit each.",
    image: "/handbook/journal.png",
    tagline: "Document your entire project-building process in a fun, engaging, creative narrative - hosted as its own page on GitHub Pages, not just a README.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from your repo, submitted through the Hub app as usual. Create a new branch (e.g. journal or docs) in your project repo and deploy it via GitHub Pages, and every submission is automatically in the running.",
    whatWeMean:
      "Not a changelog - a story. The high points, the bugs that broke your spirit, and how you eventually fixed them, told day-by-day or hour-by-hour with text, photos, GIFs, and short clips.",
    guidelines: [
      "Markdown/HTML web page, hosted directly on GitHub Pages (a journal or docs branch of your project repo).",
      "The journey: a day-by-day or hour-by-hour build story with text, photos, GIFs, and short clips.",
      "Learnings & discoveries: new tools, concepts, or hardware you tried for the first time.",
      "Team contribution: who built what, and how your team worked together.",
      "Problems & breakthroughs: the biggest roadblocks you faced and the clever (or chaotic) ways you solved them.",
      "Judged on storytelling style, visual documentation (photos/GIFs), depth of technical learning, and creative web layout/design.",
    ],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-use-of-local-llms",
    prizeLabel: "best use of local LLMs",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/llm.png",
    tagline: "For the project that ran its AI on-device or self-hosted, not just an OpenAI API key in a .env file.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission using a local/self-hosted LLM is automatically in the running.",
    whatWeMean:
      "A model running locally or self-hosted (Ollama, llama.cpp, a local inference server, etc.) doing real work in your project - not just calling a hosted API. This also covers lightweight AI models or computer vision running directly on microcontrollers, low-power microchips, or single-board computers (ESP32, Raspberry Pi) - smart intelligence without the cloud.",
    guidelines: [
      "The LLM actually runs locally/self-hosted, not through a third-party hosted API.",
      "Submitted through the Hub app like every other project.",
      "Mention the model and how it's run in your README, so it's easy to verify.",
    ],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-pcb-design",
    prizeLabel: "best pcb design / custom hardware",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/processor.png",
    tagline: "Awarded for exceptional circuit design.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every hardware submission is automatically in the running.",
    whatWeMean:
      "Clean trace routing, smart component selection, custom form factors, or artistic PCB solder-mask designs.",
    guidelines: ["Submitted through the Hub app like every other project.", "Document the board in your README - schematics and photos help it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-3d-printed-assembly",
    prizeLabel: "most complex 3d printed assembly",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/3d.png",
    tagline: "For the physical builders pushing additive manufacturing to the limit.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Tight mechanical tolerances, print-in-place moving mechanisms, multi-material prints, or intricate geometric enclosures.",
    guidelines: ["Submitted through the Hub app like every other project.", "Photos of the print (and the print-in-place mechanism, if any) help it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-reverse-engineering-hack",
    prizeLabel: "best reverse engineering / hardware hack",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/revverse.png",
    tagline: "Taking an existing commercial product or discarded e-waste and repurposing it.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Tearing down an existing commercial product or discarded e-waste and repurposing its internal parts into something completely unexpected.",
    guidelines: ["Submitted through the Hub app like every other project.", "Before/after photos of the teardown help it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-interactive-installation",
    prizeLabel: "best interactive physical installation",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/display.png",
    tagline: "For projects meant to be experienced in a physical room.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Kinetic sculptures, audio-reactive light structures, dynamic projection mapping, or physical ambient art driven by sensors.",
    guidelines: ["Submitted through the Hub app like every other project.", "A video of the installation in action helps it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-fashion-tech-wearables",
    prizeLabel: "best fashion tech & wearables",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/fashion.png",
    tagline: "Merging electronics seamlessly into style.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Textiles, soft circuits, flexible displays, smart materials, or biometrics, incorporated into wearable clothing, jewelry, or accessories.",
    guidelines: ["Submitted through the Hub app like every other project.", "Photos of it worn help it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-superhero-sci-fi-gadget",
    prizeLabel: "best superhero / sci-fi gadget",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/superhero.png",
    tagline: "Bring comic book logic into the real world.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "A working physical replica or adaptation of an iconic superhero or sci-fi tool - wrist-mounted launchers, mechanical helmets, grappling hooks, or exoskeleton arms.",
    guidelines: ["Submitted through the Hub app like every other project.", "A demo video of it working helps it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-custom-input-device",
    prizeLabel: "best custom input device / alternative controller",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/gaem.png",
    tagline: "Toss out the standard mouse and keyboard.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "A unique, physical hardware controller designed specifically to control a game or digital software experience in an unusual way.",
    guidelines: ["Submitted through the Hub app like every other project.", "A demo video of it controlling something helps it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-game-interactive-media",
    prizeLabel: "best game / interactive media",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/game-interactive.png",
    tagline: "Awarded to standout digital games or narrative software.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean: "Evaluated on core gameplay mechanics, artwork, sound design, and interactive storytelling.",
    guidelines: ["Submitted through the Hub app like every other project.", "A playable build or gameplay video helps it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-retro-futurism-hack",
    prizeLabel: "best retro-futurism / analog hack",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/retro-futurism.png",
    tagline: "Old tech meets new code.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Hacking vintage or legacy technology (CRT televisions, cassette players, dial phones, floppy drives) to interface with modern microcontrollers and digital systems.",
    guidelines: ["Submitted through the Hub app like every other project.", "Show the vintage piece and the modern side talking to each other."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-system-integration",
    prizeLabel: "best system integration",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/finished-project.png",
    tagline: "Rewarding complex communication pipelines.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "How seamlessly you can stitch together mismatched APIs, custom hardware protocols, databases, and microservices into one cohesive system.",
    guidelines: ["Submitted through the Hub app like every other project.", "A system/architecture diagram in your README helps it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "best-bio-materials-tech",
    prizeLabel: "best bio / materials tech",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/bio-materials.png",
    tagline: "Experimenting with non-standard physical materials.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "Hydroponics, bio-sensors, living organisms, or custom sustainable biomaterials (mycelium, algae) incorporated into your build.",
    guidelines: ["Submitted through the Hub app like every other project.", "Photos documenting the material/organism over time help it get judged well."],
    samples: [],
    autoJudged: true,
  },
  {
    slug: "most-over-engineered-solution",
    prizeLabel: "most over-engineered solution to a non-problem",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/hardware.png",
    tagline: "The ultimate trophy for unnecessary engineering.",
    howToRedeem:
      "Nothing extra to fill in - this is judged straight from the project you submit in the Hub app. Every submission is automatically in the running.",
    whatWeMean:
      "An overly complex, multi-stage, absurdly complicated machine or system to accomplish a completely trivial task (say, 48 hours to automate turning a light switch on).",
    guidelines: ["Submitted through the Hub app like every other project.", "Document every unnecessary stage - that's the whole point."],
    samples: [],
    autoJudged: true,
  },
];

export function getCompetition(slug: string) {
  return COMPETITIONS.find((c) => c.slug === slug);
}

// The official list of venues eligible to submit for prizes across all competitions.
export const CAMPUSES = [
  "Adi Shankara Institute of Engineering and Technology, Mattoor",
  "Ahalia School of Engineering & Technology, palakkad",
  "Al Azhar College of Engineering & Technology, Perumpillichira",
  "Albertian Institute of Science and Technology (AISAT), Kalamassery",
  "Ansar Women's College, Perumpilavu",
  "Baselios Marthoma Mathews II College of Engineering, Sasthamcotta",
  "Carmel College of Engineering and Technology, Punnapra",
  "Christ College of Engineering, Irinjalakuda",
  "Cochin University College of Engineering, Kuttanad",
  "College of Engineering and Management, Punnapra",
  "College of Engineering, Adoor",
  "College of Engineering, Attingal",
  "College of Engineering, Chengannur",
  "College of Engineering, Kallooppara",
  "College of Engineering, Karunagappally",
  "College of Engineering, Munnar",
  "College of Engineering, Perumon",
  "College of Engineering, Poonjar",
  "College of Engineering, Thiruvananthapuram",
  "College of Engineering, Trikaripur",
  "College of Engineering, Vadakara",
  "DUXFORD COLLEGE FOR ADVANCED STUDIES",
  "EMEA College of Arts & Science, Kondotty",
  "Farook College, Farook",
  "Federal Institute of Science & Technology (FISAT), Angamaly",
  "Government Engineering College, Thrissur",
  "Government Engineering College, West Hill",
  "ICCS College of Engineering and Management",
  "Ilahia College of Engineering and Technology, Mulavoor",
  "Institute of Engineering and Technology, Thenhipalam",
  "Jain University",
  "Jawaharlal College of Engineering and Technology, Lakkidi",
  "Jyothi Engineering College, Cheruthuruthy",
  "LBS College of Engineering, Povval",
  "LBS Institute of Technology for Women, Poojappura",
  "Lourdes Matha College of Science & Technology, Kutttichal",
  "Majlis Arts & Science College, Valanchery",
  "Mar Athanasius College of Engineering, Kothamangalam",
  "Mar Baselios Christian College of Engineering and Technology, Peerumedu",
  "MES College of Engineering and Technology, Kunnukara",
  "Model Engineering College, Thrikkakara",
  "Muthoot Institute of Technology & Science (MITS), Puthencruz",
  "NSS College of Engineering, Akathethara",
  "Providence College of Engineering",
  "Rajiv Gandhi Institute of Technology, Velloor",
  "Sahrdaya College of Advanced Studies, Kodakara",
  "Sahrdaya College of Engineering & Technology, Kodakara",
  "Saintgits College of Applied Sciences, Pathamuttam",
  "Saintgits College of Engineering, Pathamuttom",
  "School of Engineering CUSAT, Kalamassery",
  "SCMS School of Engineering & Technology, Karukutty",
  "SNM Institute of Management & Technology, Maliankara",
  "Sree Buddha College of Engineering, Pattoor",
  "Sree Chitra Thirunal College of Engineering, Pappanamcode",
  "Sree Narayana Guru College of Engineering & Technology, Chalakode",
  "Sree Narayana Gurukulam College of Engineering, Kadayiruppu",
  "St. Joseph's College Devagiri",
  "St. Josephs College of Engineering and Technology, Choondacherry",
  "St.Thomas College, Ranni",
  "Thejus College Engineering College, Erumapetti",
  "TKM College of Engineering, Karicode",
  "Toc H Institute of Science & Technology, Arakkunnam",
  "Unity Women's College, Manjeri",
  "Vidya Academy of Science & Technology, Thalakkottukara",
  "Vimal Jyothi Engineering College, Chemperi",
  "Viswajyothi College of Engineering and Technology, Vazhakulam",
  "TinkerSpace, Calicut",
  "TinkerSpace, Kochi",
] as const;
