import type { Boundary } from "@/types/game-metadata.type";
import { ref } from "vue";

export type ImageDimensions = {
  width: number;
  height: number;
};

export type SubimageBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
  height?: number;
};

export function useSubimageMaker() {
  const mainImageUrl = ref<string>(null!);
  const mainImageBlob = ref<Blob>(null!);
  const mainImageDimensions = ref<ImageDimensions>(null!);

  const subImageBlob = ref<Blob>(null!);
  const subImageUrl = ref<string>(null!);
  const subImageBounds = ref<SubimageBounds>(null!);

  function resetState() {
    mainImageUrl.value = null!;
    mainImageBlob.value = null!;
    mainImageDimensions.value = null!;
    subImageBlob.value = null!;
    subImageUrl.value = null!;
    subImageBounds.value = null!;
  }

  async function fetchImageData(url: string) {
    resetState();

    if (!url) return;

    const resp = await fetch(url);
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    mainImageBlob.value = blob;
    mainImageUrl.value = objectUrl;

    const bitmap = await createImageBitmap(blob);
    mainImageDimensions.value = {
      width: bitmap.width,
      height: bitmap.height,
    };
    bitmap.close();
  }

  async function makeSubimage(bounds: Boundary) {
    const leftPercent = bounds.x_start_percent;
    const rightPercent = bounds.x_end_percent;
    const topPercent = bounds.y_start_percent;
    const bottomPercent = bounds.y_end_percent;

    const widthPercent = rightPercent - leftPercent;
    const heightPercent = bottomPercent - topPercent;

    const bitmap = await createImageBitmap(mainImageBlob.value);

    const leftPx = leftPercent / 100 * bitmap.width;
    const rightPx = rightPercent / 100 * bitmap.width;
    const topPx = topPercent / 100 * bitmap.height;
    const bottomPx = bottomPercent / 100 * bitmap.height;

    const widthPx = rightPx - leftPx;
    const heightPx = bottomPx - topPx;

    subImageBounds.value = {
      left: leftPercent,
      right: rightPercent,
      top: topPercent,
      bottom: bottomPercent,
      width: widthPercent,
      height: heightPercent,
    };
    
    // console.log('%', leftPercent, rightPercent, topPercent, bottomPercent, widthPercent, heightPercent);
    // console.log('px', leftPx, rightPx, topPx, bottomPx, widthPx, heightPx);

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;

    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, leftPx, topPx, widthPx, heightPx, 0, 0, widthPx, heightPx);

    // const extract = context.getImageData(0, 0, widthPx, heightPx);
    // console.log(extract);

    subImageBlob.value = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject());
    });

    if (subImageUrl.value) URL.revokeObjectURL(subImageUrl.value);
    subImageUrl.value = URL.createObjectURL(subImageBlob.value);
  }

  return {
    mainImageUrl,
    mainImageDimensions,
    subImageUrl,
    subImageBounds,
    fetchImageData,
    makeSubimage,
  };
};
