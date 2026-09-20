// Data for the /competitions/[slug] pages and the Airtable submissions table behind them.
// Add a new object here to open up a new competition - the handbook prize card, the
// /competitions index, and the detail page all render straight off this array.
export type Competition = {
  slug: string;
  // Link-submission competitions (submitVia: "link") each write to their own table in the
  // "Useless Projects - Competitions" Airtable base - a shared table with a "Competition" field
  // wasn't an option there, because Airtable wouldn't let this token add new options to a shared
  // singleSelect field at write time. Project-pick competitions (submitVia: "project") don't hit
  // that problem, since every competition that will ever pick from that table is known upfront -
  // so they all point at the same "Competition Entries" table, tagged by the Competition field
  // (whose choices were all created once, up front, rather than added on the fly).
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
  // wants GitHub, etc. An empty array means any host is accepted (e.g. a journal page could be
  // hosted anywhere, not just GitHub Pages). Only used when `submitVia` is "link".
  linkHosts?: string[];
  linkLabel?: string;
  linkPlaceholder?: string;
  // Extra named fields the form should collect beyond name/campus/link - "team name" is optional
  // since a journal entry can be a solo effort, "project name" is required so judges looking at a
  // pile of links (often under a generic personal name) can tell entries apart. Only used when
  // `submitVia` is "link" (a "project" competition already gets both from the picked project).
  extraFields?: { teamName?: boolean; projectName?: boolean };
  // Skips the generic "notes" textarea for competitions whose form already has dedicated fields
  // covering what notes would otherwise be used for (team/project name).
  hideNotes?: boolean;
  // How this competition's entry is collected. "link" is the name/campus/link form
  // (SubmissionForm). "project" is a search-and-pick flow over projects already submitted through
  // the Hub app (ProjectSubmissionForm) - the entrant searches their own project, picks it, and
  // its name/team/campus are submitted as-is, tagged with this competition in the shared
  // "Competition Entries" table. Omitted means there's genuinely nothing to submit for this prize.
  submitVia?: "link" | "project";
  // True when this is entered per venue (by the venue host, on behalf of everyone there) rather
  // than per individual participant/team - venue aftermovie is the only one of these right now.
  venueExclusive?: boolean;
  // Pre-formatted for display on the detail page, but still parseable as a date - the
  // competitions index also reads this to compute how many days are left for its deadline banner.
  deadline?: string;
};

export const COMPETITIONS: Competition[] = [
  {
    slug: "best-build-video-documentary",
    airtableTableId: "tblhvFymbFDdqZsi4",
    prizeLabel: "video journal / build log",
    prizeText: "Top 3 get a ₹3,000-worth hardware kit each.",
    deadline: "September 21, 2026",
    image: "/handbook/build-documentary.webp",
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
    submitVia: "link",
    linkHosts: ["instagram.com"],
    linkLabel: "Instagram link",
    linkPlaceholder: "https://instagram.com/reel/...",
  },
  {
    slug: "venue-aftermovie",
    airtableTableId: "tbl1Ef5OIVaJ6Wa98",
    prizeLabel: "venue after-movie",
    prizeText: "Top 3 venues get a ₹5,000-worth hardware kit each.",
    deadline: "September 21, 2026",
    image: "/handbook/aftermovie-venue.webp",
    tagline:
      "Capture the vibe, energy, and atmosphere of the entire event - the venue, the people, the late-night grinding, and the overall hackathon culture. Venue-exclusive: one entry per venue, submitted by the host, not individual participants.",
    howToRedeem:
      "This one's for the venue host, not individual participants or teams - one after-movie per venue. Post it on Instagram - you must invite @tinkerhub as a collaborator or tag the official @tinkerhub handle in your post - then submit the link below with the venue host's name and the campus. Submitting here is mandatory: tagging or inviting @tinkerhub on Instagram alone doesn't enter you, only links submitted through this form are considered for judging. We review submissions after the hackathon and announce the winner alongside the other results.",
    whatWeMean:
      "The wide shot to the build log's close-up. Not one team's build process - the whole room: the energy, the food breaks, the late-night moments, what your venue actually felt like that night.",
    guidelines: [
      "Venue-exclusive: one submission per venue, from the host - not something individual teams enter separately.",
      "Under 5 minutes (≤ 5:00).",
      "Cinematic reel/video, posted on Instagram.",
      "Invite @tinkerhub as a collaborator, or tag @tinkerhub in the post.",
      "Venue & atmosphere: the hacking space, hardware tables, food breaks, late-night moments.",
      "Community spirit: interactions with other teams, mentors, and organizers.",
      "Event highlights: kickoffs, mini-games, hardware teardowns, demo sessions.",
      "Judged on cinematography, editing/sound design, storytelling, and how well it captures the overall event spirit.",
    ],
    samples: [],
    venueExclusive: true,
    submitVia: "link",
    linkHosts: ["instagram.com"],
    linkLabel: "Instagram link",
    linkPlaceholder: "https://instagram.com/reel/...",
  },
  {
    slug: "journal-repo",
    airtableTableId: "tbl4gDRw4vXj4K4uA",
    prizeLabel: "project journal",
    prizeText: "Top 3 get a ₹3,000-worth hardware kit each.",
    deadline: "September 21, 2026",
    image: "/handbook/journal.webp",
    tagline: "Document your entire project-building process in a fun, engaging, creative narrative - hosted as its own page on GitHub Pages, not just a README.",
    howToRedeem:
      "Create a new branch (e.g. journal or docs) in your project repo and deploy it via GitHub Pages, then submit the link below with your name, campus, and project name. Submitting here is mandatory: having the page live on GitHub Pages alone doesn't enter you, only links submitted through this form are considered for judging. If you're on a team, only one member needs to submit on the team's behalf - not everyone individually. We review submissions after the hackathon and announce the winner alongside the other results.",
    whatWeMean:
      "Not a changelog - a story. The high points, the bugs that broke your spirit, and how you eventually fixed them, told day-by-day or hour-by-hour with text, photos, GIFs, and short clips.",
    guidelines: [
      "Team entry: only one member needs to submit the form on the team's behalf, not every teammate.",
      "Markdown/HTML web page, hosted directly on GitHub Pages (a journal or docs branch of your project repo).",
      "The journey: a day-by-day or hour-by-hour build story with text, photos, GIFs, and short clips.",
      "Learnings & discoveries: new tools, concepts, or hardware you tried for the first time.",
      "Team contribution: who built what, and how your team worked together.",
      "Problems & breakthroughs: the biggest roadblocks you faced and the clever (or chaotic) ways you solved them.",
      "Judged on storytelling style, visual documentation (photos/GIFs), depth of technical learning, and creative web layout/design.",
    ],
    samples: [],
    submitVia: "link",
    linkHosts: [],
    linkLabel: "Live link",
    linkPlaceholder: "https://username.github.io/repo/journal/",
    extraFields: { teamName: true, projectName: true },
    hideNotes: true,
  },
  {
    slug: "best-use-of-local-llms",
    prizeLabel: "best use of local LLMs",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/llm.webp",
    deadline: "September 21, 2026",
    tagline: "For the project that ran its AI on-device or self-hosted, not just an OpenAI API key in a .env file.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission using a local/self-hosted LLM is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "A model running locally or self-hosted (Ollama, llama.cpp, a local inference server, etc.) doing real work in your project - not just calling a hosted API. This also covers lightweight AI models or computer vision running directly on microcontrollers, low-power microchips, or single-board computers (ESP32, Raspberry Pi) - smart intelligence without the cloud.",
    guidelines: [
      "The LLM actually runs locally/self-hosted, not through a third-party hosted API.",
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Mention the model and how it's run in your README, so it's easy to verify.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-pcb-design",
    prizeLabel: "best pcb design / custom hardware",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/processor.webp",
    deadline: "September 21, 2026",
    tagline: "Awarded for exceptional circuit design.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every hardware submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Clean trace routing, smart component selection, custom form factors, or artistic PCB solder-mask designs.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Document the board in your README - schematics and photos help it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-3d-printed-assembly",
    prizeLabel: "most complex 3d printed assembly",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/3d.webp",
    deadline: "September 21, 2026",
    tagline: "For the physical builders pushing additive manufacturing to the limit.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Tight mechanical tolerances, print-in-place moving mechanisms, multi-material prints, or intricate geometric enclosures.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Photos of the print (and the print-in-place mechanism, if any) help it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-reverse-engineering-hack",
    prizeLabel: "best reverse engineering / hardware hack",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/revverse.webp",
    deadline: "September 21, 2026",
    tagline: "Taking an existing commercial product or discarded e-waste and repurposing it.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Tearing down an existing commercial product or discarded e-waste and repurposing its internal parts into something completely unexpected.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Before/after photos of the teardown help it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-interactive-installation",
    prizeLabel: "best interactive physical installation",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/display.webp",
    deadline: "September 21, 2026",
    tagline: "For projects meant to be experienced in a physical room.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Kinetic sculptures, audio-reactive light structures, dynamic projection mapping, or physical ambient art driven by sensors.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "A video of the installation in action helps it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-fashion-tech-wearables",
    prizeLabel: "best fashion tech & wearables",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/fashion.webp",
    deadline: "September 21, 2026",
    tagline: "Merging electronics seamlessly into style.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Textiles, soft circuits, flexible displays, smart materials, or biometrics, incorporated into wearable clothing, jewelry, or accessories.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Photos of it worn help it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-superhero-sci-fi-gadget",
    prizeLabel: "best superhero / sci-fi gadget",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/superhero.webp",
    deadline: "September 21, 2026",
    tagline: "Bring comic book logic into the real world.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "A working physical replica or adaptation of an iconic superhero or sci-fi tool - wrist-mounted launchers, mechanical helmets, grappling hooks, or exoskeleton arms.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "A demo video of it working helps it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-custom-input-device",
    prizeLabel: "best custom input device / alternative controller",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/gaem.webp",
    deadline: "September 21, 2026",
    tagline: "Toss out the standard mouse and keyboard.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "A unique, physical hardware controller designed specifically to control a game or digital software experience in an unusual way.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "A demo video of it controlling something helps it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-game-interactive-media",
    prizeLabel: "best game / interactive media",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/game-interactive.webp",
    deadline: "September 21, 2026",
    tagline: "Awarded to standout digital games or narrative software.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean: "Evaluated on core gameplay mechanics, artwork, sound design, and interactive storytelling.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "A playable build or gameplay video helps it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-retro-futurism-hack",
    prizeLabel: "best retro-futurism / analog hack",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/retro-futurism.webp",
    deadline: "September 21, 2026",
    tagline: "Old tech meets new code.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Hacking vintage or legacy technology (CRT televisions, cassette players, dial phones, floppy drives) to interface with modern microcontrollers and digital systems.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Show the vintage piece and the modern side talking to each other.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-system-integration",
    prizeLabel: "best system integration",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/finished-project.webp",
    deadline: "September 21, 2026",
    tagline: "Rewarding complex communication pipelines.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "How seamlessly you can stitch together mismatched APIs, custom hardware protocols, databases, and microservices into one cohesive system.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "A system/architecture diagram in your README helps it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "best-bio-materials-tech",
    prizeLabel: "best bio / materials tech",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/bio-materials.webp",
    deadline: "September 21, 2026",
    tagline: "Experimenting with non-standard physical materials.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "Hydroponics, bio-sensors, living organisms, or custom sustainable biomaterials (mycelium, algae) incorporated into your build.",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Photos documenting the material/organism over time help it get judged well.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
  },
  {
    slug: "most-over-engineered-solution",
    prizeLabel: "most over-engineered solution to a non-problem",
    prizeText: "₹2,000 worth of prizes.",
    image: "/handbook/hardware.webp",
    deadline: "September 21, 2026",
    tagline: "The ultimate trophy for unnecessary engineering.",
    howToRedeem:
      "Submit your project through the Hub app as usual, then come back here, search for it below, and enter it for this prize. Every submission is eligible - entering here is what puts it in the running for judging.",
    whatWeMean:
      "An overly complex, multi-stage, absurdly complicated machine or system to accomplish a completely trivial task (say, 48 hours to automate turning a light switch on).",
    guidelines: [
      "Submitted through the Hub app like every other project, then entered for this prize below.",
      "Document every unnecessary stage - that's the whole point.",
    ],
    samples: [],
    submitVia: "project",
    airtableTableId: "tblwey1rsPOPExkTX",
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
  "KMEA College of Engineering, Edathala",
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
