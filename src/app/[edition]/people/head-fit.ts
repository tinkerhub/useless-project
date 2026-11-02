// Where each cut-out head's neck goes and what colour its skin is, so a drawn body can be joined
// on under it with a matching neck and hands. Measured from the images in public/people/heads-v2/:
// `neck` is [x, y] as fractions of the image (x = middle of the head's lower third, y = its lowest
// point), `skin` the median colour of the nose/cheek area. Re-measure if a cut-out changes.
export const HEAD_FIT: Record<string, { neck: [number, number]; skin: string }> = {
  "achuth-2": { neck: [0.508, 0.879], skin: "#6c5557" }, // brightened copy of achuth (was too dark)
  "akhil-sam": { neck: [0.496, 0.894], skin: "#90675a" },
  "alina-2": { neck: [0.522, 0.825], skin: "#a65b44" }, // from her newer photo (the old cut-out clipped her glasses)
  "altaf": { neck: [0.429, 0.867], skin: "#a8756a" },
  "arundathi": { neck: [0.5, 0.846], skin: "#b57f6c" },
  "chandrettan": { neck: [0.508, 0.873], skin: "#d3834d" },
  "elizabeth-bobby": { neck: [0.492, 0.867], skin: "#b07d6a" },
  "femina": { neck: [0.479, 0.877], skin: "#b97b66" },
  "habeeb": { neck: [0.517, 0.917], skin: "#875642" },
  // Side profile: the measured middle sat under his face, which put his head left of his body;
  // nudged so his body sits under the back of his head instead.
  "jasil": { neck: [0.48, 0.85], skin: "#e9a03f" },
  "jazeel": { neck: [0.483, 0.848], skin: "#ca7d67" },
  "jenit": { neck: [0.498, 0.848], skin: "#955f49" },
  "kartick": { neck: [0.512, 0.885], skin: "#8f685d" },
  "kurian-2": { neck: [0.459, 0.873], skin: "#bd7954" }, // re-cut: whole chin, no background beside it
  "nandana": { neck: [0.477, 0.869], skin: "#b96e4b" },
  "rio": { neck: [0.492, 0.892], skin: "#af8470" },
  "rishi-2": { neck: [0.45, 0.846], skin: "#986c5a" },
  "salman": { neck: [0.465, 0.858], skin: "#e08673" },
  "shan-shoukath": { neck: [0.535, 0.871], skin: "#c27d62" },
  "sunith": { neck: [0.498, 0.842], skin: "#986a58" },
  "volunteer-01": { neck: [0.502, 0.873], skin: "#a07462" },
  "volunteer-02": { neck: [0.515, 0.881], skin: "#a87866" },
  "volunteer-03": { neck: [0.5, 0.869], skin: "#bb775e" },
  "volunteer-04": { neck: [0.506, 0.846], skin: "#b06659" },
  "volunteer-05": { neck: [0.49, 0.879], skin: "#a66350" },
  "volunteer-06": { neck: [0.496, 0.875], skin: "#ab6c57" },
  "volunteer-07": { neck: [0.515, 0.865], skin: "#cb816b" },
  "volunteer-08": { neck: [0.485, 0.89], skin: "#ca7d5d" },
  "volunteer-09": { neck: [0.429, 0.898], skin: "#985d3b" },
  "volunteer-10": { neck: [0.54, 0.848], skin: "#a2624e" },
  "volunteer-11": { neck: [0.515, 0.852], skin: "#c08460" },
};
