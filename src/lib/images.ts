/**
 * Getting pictures in: from the file picker, dragged in from Finder / Photos /
 * Messages / a web page, or pasted. Everything becomes a data URL (uploaded to
 * storage when the page is saved). Big photos are shrunk to `max` px on the long
 * side as JPEG; small files are kept as-is so pixel art stays crisp. iPhone
 * HEIC photos are converted to JPEG first (most browsers can't show HEIC).
 */
import { supabaseConfigured } from "./supabase/config";

// Browser storage is tiny; Supabase storage isn't, so keep photos sharper there.
const DEFAULT_MAX = supabaseConfigured ? 2000 : 1000;
const IMAGE_NAME = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i;
const HEIC = /image\/hei[cf]/i;

/** Some pictures (HEIC from iPhones, files from some apps) arrive without an image type. */
export const looksLikeImage = (f: File) => f.type.startsWith("image/") || IMAGE_NAME.test(f.name);

/** A friendly reason a picture couldn't be used, for the message on screen. */
export class PictureError extends Error {}

async function decodable(blob: Blob, name = ""): Promise<Blob> {
  if (HEIC.test(blob.type) || /\.(heic|heif)$/i.test(name)) {
    try {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
      return Array.isArray(out) ? out[0] : out;
    } catch {
      throw new PictureError("couldn’t convert that iPhone (HEIC) photo. try exporting it as a JPEG first.");
    }
  }
  return blob;
}

export async function imageToDataUrl(file: Blob & { name?: string }, { max = DEFAULT_MAX, keepUnder = 400_000 } = {}): Promise<string> {
  const blob = await decodable(file, file.name);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (blob.size <= keepUnder && Math.max(img.width, img.height) <= max && blob.type.startsWith("image/")) {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
        return;
      }
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PictureError("that file didn’t open as a picture. try a JPG or PNG?"));
    };
    img.src = url;
  });
}

/** What a drop or paste carried, read right away (the browser only allows reading it during the event). */
export type Carried = { files: File[]; url: string | null };

export function readTransfer(dt: DataTransfer | null): Carried {
  if (!dt) return { files: [], url: null };
  let files = Array.from(dt.files).filter(looksLikeImage);
  if (!files.length) {
    files = Array.from(dt.items)
      .filter((i) => i.kind === "file")
      .map((i) => i.getAsFile())
      .filter((f): f is File => Boolean(f && looksLikeImage(f)));
  }
  let url: string | null = null;
  if (!files.length) {
    // Dragged from a web page or an app that only offers a link / an <img>.
    const html = dt.getData("text/html");
    const fromHtml = html ? /<img[^>]+src="([^"]+)"/i.exec(html)?.[1] : undefined;
    const uri = dt.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#"));
    url = fromHtml?.replace(/&amp;/g, "&") || uri || null;
  }
  return { files, url };
}

/** Turns what was carried into files we can use. */
export async function carriedImages(c: Carried): Promise<File[]> {
  if (c.files.length) return c.files;
  if (!c.url) return [];
  try {
    const res = await fetch(c.url);
    const blob = await res.blob();
    if (!res.ok || !(blob.type.startsWith("image/") || IMAGE_NAME.test(c.url))) throw new Error("not an image");
    return [new File([blob], c.url.split("/").pop()?.split("?")[0] || "picture", { type: blob.type })];
  } catch {
    throw new PictureError("that picture’s website doesn’t let it be copied over. save it to your computer (or copy it), then drop or paste it in.");
  }
}
