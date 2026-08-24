import { ref, readonly } from 'vue'

// The capture service exposes triggerCapture through page.exposeFunction, before page.goto:
// it exists before any script of the document, and it ALWAYS returns a promise.
declare global {
  interface Window {
    triggerCapture?: (animationSupported?: boolean) => Promise<boolean>
    animateCaptureFrame?: () => boolean
  }
}

// bounded independently of any configurable duration: the service stops at 1800 frames but
// also at 2 x screenshotTimeout of wall clock for the whole gif, encoding included
const ANIMATION_FRAMES = 120

/**
 * Reference implementation of the capture contract, cf. skill-apps references/capture.md.
 *
 * - `inCapture` tells a capture context apart from a normal display, so the render can drop
 *   the controls an image cannot use. It stays true for a manual capture, which has no
 *   ?thumbnail=true — use `isThumbnail` for the gallery thumbnail specifically.
 * - `frame` goes from 0 to ANIMATION_FRAMES: the animated state in gif mode, pinned to the
 *   final state in png mode, because a still image must show the most meaningful state.
 */
export function useCapture () {
  const inCapture = !!window.triggerCapture
  const isThumbnail = new URLSearchParams(window.location.search).get('thumbnail') === 'true'
  const frame = ref(0)
  const done = ref(false)
  let triggered = false

  // defined BEFORE any call to triggerCapture(true): in gif mode the service calls it right
  // after the trigger resolves, and a page.evaluate on an undefined function fails the capture
  window.animateCaptureFrame = () => {
    frame.value = Math.min(frame.value + 1, ANIMATION_FRAMES)
    return frame.value >= ANIMATION_FRAMES
  }

  /** call this on EVERY terminal path: data ready, empty result, data error, invalid config */
  const trigger = async () => {
    if (triggered || !window.triggerCapture) return
    triggered = true
    const animate = await window.triggerCapture(true)
    // gif: rewind and let animateCaptureFrame drive. png: jump to the final state.
    frame.value = animate ? 0 : ANIMATION_FRAMES
    done.value = true
  }

  return { inCapture, isThumbnail, frame: readonly(frame), done: readonly(done), trigger, animationFrames: ANIMATION_FRAMES }
}

export default useCapture
