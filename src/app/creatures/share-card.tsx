"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const GRID_SIZE = 16;
// The designed Instagram-story template (public/story template.png) already carries the site
// wordmark, decorative creatures, caption, and URL - this just has to match its actual pixel size.
const CANVAS_W = 1080;
const CANVAS_H = 1920;

// Where the art sits within the template's blank middle band, found by eye against the template
// image itself (see TEMPLATE_ART_ZONE_NOTES.md-equivalent reasoning inline): a square area
// centered horizontally, vertically between the top decorative creature and the caption line.
const ART_SIZE = 760;
const ART_X = (CANVAS_W - ART_SIZE) / 2;
const ART_Y = 560;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

// Renders the just-drawn creature onto the designed share template: the pixel art scaled up
// crisp (nearest-neighbor, drawn as rects rather than an upscaled image) into the template's
// blank middle band - built entirely client-side from the pixels already held in memory from the
// editor, no server round trip needed for the image itself.
async function buildShareImage(pixels: (string | null)[]): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const template = await loadImage("/story%20template.png");
  ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H);

  const cell = ART_SIZE / GRID_SIZE;
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    if (!color) continue;
    const col = i % GRID_SIZE;
    const row = Math.floor(i / GRID_SIZE);
    ctx.fillStyle = color;
    // The +1 overdraw covers the hairline gaps browsers render between adjacent filled rects,
    // same fix as the gallery's own pixel grid (see creature-swarm.tsx).
    ctx.fillRect(ART_X + col * cell, ART_Y + row * cell, cell + 1, cell + 1);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export default function ShareCard({
  name,
  pixels,
  onDrawAnother,
}: {
  name: string;
  pixels: (string | null)[];
  onDrawAnother: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    buildShareImage(pixels)
      .then((b) => {
        if (cancelled) return;
        setBlob(b);
        url = URL.createObjectURL(b);
        setImageUrl(url);
        const file = new File([b], "creature.png", { type: "image/png" });
        setCanShareFiles(typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }));
      })
      .catch(() => {
        // No image, no download/share buttons below - the gallery link still works either way.
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [name, pixels]);

  async function handleShare() {
    if (!blob) return;
    const file = new File([blob], `${name || "creature"}.png`, { type: "image/png" });
    try {
      await navigator.share({
        files: [file],
        title: "My Useless Projects creature",
        text: `I drew "${name}" for Useless Projects 3.0 - draw yours at useless.tinkerhub.org/creatures`,
      });
    } catch {
      // Cancelled or unsupported mid-call - the download button below still works as a fallback.
    }
  }

  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-4 text-center">
      <p className="font-nanum-pen text-[20px] leading-[1.3] text-[#244638] sm:text-[22px]">
        &ldquo;{name}&rdquo; is loose in the wild!
      </p>

      {/* Height-capped by svh, not just a fixed max-width, so this (the one variable-size element
          on the screen) is what gives up space on a short viewport - the rest of the screen is
          buttons and single lines of text, none of it worth shrinking before this is. */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a locally-generated blob: URL, not an optimizable remote image
        <img
          src={imageUrl}
          alt={`Share card for ${name}`}
          className="h-auto max-h-[44svh] w-auto max-w-[220px] rounded-2xl border border-black/10 shadow-sm"
        />
      ) : (
        <div className="flex aspect-9/16 max-h-[44svh] w-auto max-w-[220px] items-center justify-center rounded-2xl border border-black/10 bg-black/[0.02] text-[12px] text-[#33322f]">
          Building your share image...
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {canShareFiles && (
          <button
            type="button"
            onClick={handleShare}
            className="font-helvetica cursor-pointer rounded-full bg-[#0e0e0d] px-5 py-2.5 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105"
          >
            share
          </button>
        )}
        {imageUrl && (
          <a
            href={imageUrl}
            download={`${name || "creature"}.png`}
            className={`font-helvetica rounded-full px-5 py-2.5 text-[13px] tracking-[0.08em] uppercase transition-transform hover:scale-105 ${
              canShareFiles
                ? "border border-black/10 text-[#0e0e0d]"
                : "bg-[#0e0e0d] text-white"
            }`}
          >
            download
          </a>
        )}
      </div>

      {/* Next steps, not sharing actions - kept visually distinct (underlined text, not filled
          buttons) from the row above so "spread the word" and "what next" don't read as one
          undifferentiated pile of five buttons. */}
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/creatures/gallery"
          className="font-helvetica text-[12px] tracking-[0.06em] text-[#33322f] uppercase underline underline-offset-4"
        >
          see the gallery
        </Link>
        <button
          type="button"
          onClick={onDrawAnother}
          className="font-helvetica cursor-pointer text-[12px] tracking-[0.06em] text-[#33322f] uppercase underline underline-offset-4"
        >
          draw another
        </button>
      </div>
    </div>
  );
}
