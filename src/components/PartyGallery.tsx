"use client";

import { useState } from "react";
import { PhotoComments } from "./PhotoComments";

export type GalleryPhoto = { id: string; url: string };

/**
 * Foto-Streifen zum Durchwischen – Tippen auf ein Foto öffnet es groß samt
 * Kommentaren darunter.
 */
export function PartyGallery({
  photos,
  canComment,
}: {
  photos: GalleryPhoto[];
  canComment: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = photos.find((p) => p.id === openId) ?? null;

  return (
    <>
      <section className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setOpenId(photo.id)}
            className="h-40 w-56 shrink-0 snap-start overflow-hidden rounded-xl2 border border-white/10 transition active:scale-[0.98]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpenId(null)}
        >
          <div
            className="glass glass-sheen relative max-h-[90vh] w-full max-w-lg overflow-y-auto sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenId(null)}
              aria-label="Schließen"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt="" className="max-h-[50vh] w-full object-contain bg-black" />
            <div className="p-4">
              <p className="mb-3 text-2xs uppercase tracking-wider text-white/40">
                Kommentare
              </p>
              <PhotoComments photoId={open.id} canComment={canComment} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
