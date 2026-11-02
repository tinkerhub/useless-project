// What comes after the crowd on the people page: first a note (the most important part of Useless
// Projects was the people), then the teams on one screen (we planned, we designed, we made the
// website...), then everyone who gave a helping hand with the packing, the
// campus leads, and the makers. No dates or weeks: it is about who, not when.
//
// Media with `kind: "placeholder"` are empty frames waiting for a photo or video. Photos and videos
// live in /public/people/story/
// (photos as webp, at most 1400px on the long edge). People are named as in PEOPLE in
// ../results/data, so their cut-out heads can be shown.

export type StoryMedia =
  | { kind: "image"; src: string; alt: string; caption?: string }
  // `crop` shows just part of the frame ([x, y, width, height] as fractions of it) - for a video
  // recorded with a lot of empty border around the picture.
  | { kind: "video"; src: string; caption?: string; crop?: [number, number, number, number] }
  | { kind: "placeholder"; caption: string };

export const NOTE = {
  // The note in handwriting, ending on the line it all comes down to.
  lines: [
    "if you ask us what mattered most about useless projects, it was never the projects. it was the people.",
    "the ones who sat up planning it. the ones who drew it, built it, packed it and sent it out. the ones who mentored, who volunteered, who opened up their campuses and stayed till the last demo.",
    "and the ones who showed up to build something useless, on purpose.",
  ],
  closing: "it was always the people.",
};

// The teams, all on one screen: what they did, in a few words, and their heads.
export type Team = { title: string; people: string[]; more?: string };

export const TEAMS: Team[] = [
  { title: "we planned", people: ["habeeb", "femina", "arundathi", "kurian"] },
  { title: "we designed", people: ["nandana", "alina"] },
  { title: "we made the website", people: ["achuth", "habeeb"] },
  { title: "we sent things out", people: ["altaf", "habeeb"], more: "+ the volunteers" },
  { title: "we mentored", people: ["rio", "salman", "sunith", "rishi", "shan shoukath"] },
];

// Everyone who gave a helping hand: every volunteer in PEOPLE, then the packing photos and videos.
export const HELPERS: { title: string; text: string; media: StoryMedia[] } = {
  title: "and everyone who gave a hand.",
  text: "Stickers to count, books to bundle, rolls to tape and boxes to fill. The volunteers turned up, sat around whatever table was free, and packed every last bit of it, often well into the night.",
  media: [
    { kind: "video", src: "/people/story/packing-stickers.mp4" },
    { kind: "image", src: "/people/story/packing-table.webp", alt: "Volunteers sitting around a table, packing goodies" },
    { kind: "video", src: "/people/story/late-night.mp4" },
    { kind: "video", src: "/people/story/packing-all-hands.mp4", crop: [0.082, 0.371, 0.84, 0.262] },
  ],
};

// The campus leads and core teams, shown with every venue (the photos from VENUES in app/venues.ts,
// the same ones the know-when countdown flips through) pinned up on a notice board.
export const CAMPUS = {
  title: "the campus leads and their core teams.",
  text: "Useless Projects happened on campuses across Kerala because someone on each one took it on: found a room, rallied their friends, and ran the show on the day.",
};

export const MAKERS = { title: "and you, who showed up to build." };

// Slapped across the corner of the campus notice board: TinkerHub saying what the page is about.
export const STICKER = { src: "/people/story/together-sticker.webp", alt: "Together, we make it better. - TinkerHub" };

export const STORY_END = "thank you, people.";
