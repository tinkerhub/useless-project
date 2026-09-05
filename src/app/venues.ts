// Venue rosters for the two hackathon slots (see SCHEDULE in curiosity-reveal.tsx: slot 1 runs
// Sep 3-6, slot 2 runs Sep 11-13). Images live under /public/venues/slot-{1,2}.
export const VENUES = [
  { name: "MITS", slot: 1, image: "/venues/slot-1/mits.webp" },
  { name: "CE Vadakara", slot: 1, image: "/venues/slot-1/ce-vadakara.webp" },
  { name: "Devagiri", slot: 1, image: "/venues/slot-1/devagiri.webp" },
  { name: "FISAT", slot: 1, image: "/venues/slot-1/fisat.webp" },
  { name: "Jain", slot: 1, image: "/venues/slot-1/jain.webp" },
  { name: "Kalloopara", slot: 1, image: "/venues/slot-1/kalloopara.webp" },
  { name: "LBS Poojapura", slot: 1, image: "/venues/slot-1/lbs-poojapura.webp" },
  { name: "MEC Thrikkakara", slot: 1, image: "/venues/slot-1/mec-thrikkakara.jpeg" },
  { name: "Sahrdaya", slot: 1, image: "/venues/slot-1/sahrdaya.webp" },
  { name: "Saintgits", slot: 1, image: "/venues/slot-1/saintgits.webp" },
  { name: "SCMS", slot: 1, image: "/venues/slot-1/scms.webp" },
  { name: "Sree Buddha Pattoor", slot: 1, image: "/venues/slot-1/sree-buddha-pattoor.webp" },
  { name: "Tinkerspace", slot: 1, image: "/venues/slot-1/tinkerspace.webp" },
  { name: "Viswajyothi", slot: 1, image: "/venues/slot-1/viswajyothi.webp" },
  { name: "Attingal", slot: 2, image: "/venues/slot-2/attingal.webp" },
  { name: "CET", slot: 2, image: "/venues/slot-2/cet.webp" },
  { name: "Majlis", slot: 2, image: "/venues/slot-2/majlis.webp" },
] as const;
