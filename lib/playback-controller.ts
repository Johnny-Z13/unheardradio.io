import type { RadioStation } from '../types/radio'

export type PlaybackStatus = 'idle' | 'ready' | 'loading' | 'playing' | 'paused' | 'failed'
export type PlayResult = 'playing' | 'blocked' | 'failed' | 'cancelled' | 'paused'
type AudioPort = Pick<HTMLAudioElement, 'src' | 'play' | 'pause' | 'load' | 'removeAttribute' | 'addEventListener' | 'removeEventListener'>
type State = { status: PlaybackStatus; error: string | null }

/** One owner for the media element. Aborting an attempt removes all its listeners. */
export function createPlaybackController(options: {
  getAudio: () => AudioPort
  onState: (state: State) => void
  onStarted: (station: RadioStation) => void
  prepare?: () => void
  timeoutMs?: number
}) {
  let active: AbortController | null = null
  let loading = false
  const timeoutMs = options.timeoutMs ?? 6000

  const cancel = () => {
    active?.abort()
    active = null
    loading = false
  }

  const pause = () => {
    const wasLoading = loading
    cancel()
    const audio = options.getAudio()
    audio.pause()
    if (wasLoading) {
      audio.removeAttribute('src')
      audio.load()
    }
    options.onState({ status: 'paused', error: null })
  }

  const play = async (station: RadioStation): Promise<PlayResult> => {
    cancel()
    const attempt = new AbortController()
    active = attempt
    const { signal } = attempt
    const audio = options.getAudio()
    audio.pause()
    loading = true
    options.onState({ status: 'loading', error: null })
    options.prepare?.()

    // Two URLs at most; both must be HTTPS. Never retry the same URL twice.
    const urls = Array.from(new Set([station.url_resolved, station.url])).filter((value) => {
      try { return new URL(value).protocol === 'https:' } catch { return false }
    })
    for (const url of urls) {
      if (signal.aborted) return 'cancelled'
      audio.src = url
      try {
        await waitForPlayback(audio, signal, timeoutMs)
        if (signal.aborted) return 'cancelled'
        loading = false
        options.onState({ status: 'playing', error: null })
        options.onStarted(station)
        // After acquisition, monitor actual playback rather than the `play`
        // event, which can fire before there is any audio to hear.
        const update = (status: PlaybackStatus, error: string | null = null) => {
          if (!signal.aborted) options.onState({ status, error })
        }
        let stallTimer: ReturnType<typeof setTimeout> | undefined
        const onWaiting = () => {
          loading = true
          update('loading')
          if (stallTimer) return
          stallTimer = setTimeout(() => {
            if (signal.aborted) return
            audio.pause()
            update('failed', 'This signal stopped responding. Retry or tune another station.')
            attempt.abort()
            loading = false
          }, timeoutMs)
        }
        const onPlaying = () => {
          clearTimeout(stallTimer)
          stallTimer = undefined
          loading = false
          update('playing')
        }
        const onEnded = () => update('failed', 'This signal ended. Try another station.')
        const onError = () => update('failed', 'Signal lost. Retry or tune another station.')
        const handlers = { waiting: onWaiting, playing: onPlaying, ended: onEnded, error: onError }
        for (const [event, handler] of Object.entries(handlers)) audio.addEventListener(event, handler)
        signal.addEventListener('abort', () => {
          clearTimeout(stallTimer)
          for (const [event, handler] of Object.entries(handlers)) audio.removeEventListener(event, handler)
        }, { once: true })
        return 'playing'
      } catch (error) {
        if (signal.aborted) return 'cancelled'
        if (error instanceof Error && error.name === 'NotAllowedError') {
          loading = false
          options.onState({ status: 'ready', error: 'Tap play to receive this signal.' })
          return 'blocked'
        }
      }
    }
    if (signal.aborted) return 'cancelled'
    loading = false
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    options.onState({ status: 'failed', error: 'Could not receive this signal. Retry or try Next signal.' })
    return 'failed'
  }

  return { play, pause, cancel }
}

function waitForPlayback(audio: AudioPort, signal: AbortSignal, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error?: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
      signal.removeEventListener('abort', onAbort)
      if (error) reject(error)
      else resolve()
    }
    const onPlaying = () => finish()
    const onError = () => finish(new Error('Stream failed'))
    const onAbort = () => finish(new Error('Cancelled'))
    const timer = setTimeout(() => finish(new Error('Stream timed out')), timeoutMs)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('error', onError)
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) { onAbort(); return }
    try { void audio.play().catch(finish) } catch (error) { finish(error) }
  })
}
