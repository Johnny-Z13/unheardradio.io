'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStations } from '@/lib/radio-api'
import { nextSignal } from '@/lib/discovery'
import { useAudioStore } from '@/lib/audio-store'

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

  const tuneNext = async () => {
    // Prefetched candidates preserve the media gesture on the first attempt.
    // Every acquisition is bounded to two URLs; try two stations at most.
    for (let attempt = 0; attempt < 2; attempt++) {
      const state = useAudioStore.getState()
      const station = nextSignal(query.data || [], state.attempted, state.currentStation)
      if (!station) return
      const result = await state.playStation(station)
      if (result !== 'failed') return
    }
  }

  return {
    tuneNext,
    canTune: Boolean(candidate),
    isFetching: query.isFetching,
    error: query.error,
    empty: !query.isPending && !query.error && !candidate,
    refresh: () => setSeed(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`),
  }
}
