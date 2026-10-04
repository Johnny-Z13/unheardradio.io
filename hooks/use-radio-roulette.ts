'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStations } from '@/lib/radio-api'
import { nextSignal } from '@/lib/discovery'
import { useAudioStore } from '@/lib/audio-store'
import { playFirstAvailable } from '@/lib/playback-controller'

export function useRadioRoulette() {
  const [seed, setSeed] = useState(() => Date.now().toString(36))
  const { attempted, currentStation } = useAudioStore()
  const query = useQuery({
    queryKey: ['roulette', seed],
    queryFn: ({ signal }) => fetchStations({ listenerFilter: 'low-to-high', limit: 200, randomSeed: seed }, signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
  const candidate = nextSignal(query.data || [], attempted, currentStation)

  // Prefetched candidates preserve the media gesture on the first attempt.
  // Failed stations are recorded by the store, so each retry selects a fresh signal.
  const tuneNext = () => playFirstAvailable(
    () => {
      const state = useAudioStore.getState()
      return nextSignal(query.data || [], state.attempted, state.currentStation)
    },
    (station) => useAudioStore.getState().playStation(station),
  )

  return {
    tuneNext,
    canTune: Boolean(candidate),
    isFetching: query.isFetching,
    error: query.error,
    empty: !query.isPending && !query.error && !candidate,
    refresh: () => setSeed(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`),
  }
}
