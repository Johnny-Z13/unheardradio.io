export interface CameraView { k: number; x: number; y: number; w: number; h: number }

/** The point is projected at world scale (k=1, x=y=0). Leave room for its card. */
export function focusAtlasView(view: CameraView, point: [number, number], approximate: boolean, withCard: boolean): CameraView {
  const k = Math.min(12, Math.max(view.k, approximate ? 2.5 : 4))
  const x = withCard && view.w >= 640 ? (view.w - 344) / 2 : view.w / 2
  const y = withCard && view.w < 640 ? Math.max(48, (view.h - 175) / 2) : view.h / 2
  return { ...view, k, x: x - view.w / 2 - (point[0] - view.w / 2) * k, y: y - view.h / 2 - (point[1] - view.h / 2) * k }
}

export function interpolateAtlasView(from: CameraView, to: CameraView, progress: number): CameraView {
  const t = 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3
  return { ...to, k: from.k + (to.k - from.k) * t, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}
