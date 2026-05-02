'use client'

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { MapPin, Scan } from '@/components/icons';
import { RadioStation } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { getCoords, getOrigin } from '@/lib/station-format';

interface StationMapProps {
  onStationSelect?: (station: RadioStation) => void;
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const { data: stations = [], isLoading, error } = useQuery({
    queryKey: ['/api/stations', 'signal-atlas'],
    queryFn: () => fetchStations({
      listenerFilter: 'low-to-high',
      limit: 80,
      randomSeed: 'signal-atlas',
    }),
    staleTime: 5 * 60 * 1000,
  });

  const locatedStations = useMemo(
    () => stations.filter(station => station.geo_lat && station.geo_long),
    [stations]
  );

  const topOrigins = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of stations) {
      const origin = getOrigin(station);
      counts.set(origin, (counts.get(origin) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [stations]);

  if (isLoading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-vdu-green">
          <Loader2 className="w-6 h-6 animate-spin" />
          Building signal atlas...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-3 md:p-6 pb-28">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] md:text-[28px] leading-none text-vdu-green-bright phosphor tracking-[0.04em]">// SIGNAL ATLAS</h2>
          <p className="text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim mt-1.5">
            {error ? 'Atlas link degraded' : `${locatedStations.length} geolocated signals from this scan`}
          </p>
        </div>
        <div className="border border-hairline px-3 py-2 text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim">
          RadioBrowser coordinates are sparse; this view shows verified positions when available.
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] gap-4">
        <div className="relative min-h-[360px] border border-hairline bg-radio-dark overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage:
              'linear-gradient(hsla(120,60%,30%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(120,60%,30%,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute inset-x-0 top-1/2 border-t border-vdu-green-dim/40" />
          <div className="absolute inset-y-0 left-1/2 border-l border-vdu-green-dim/40" />

          {locatedStations.slice(0, 40).map((station) => {
            const x = ((station.geo_long + 180) / 360) * 100;
            const y = ((90 - station.geo_lat) / 180) * 100;
            return (
              <button
                key={station.stationuuid}
                type="button"
                onClick={() => onStationSelect?.(station)}
                title={`${station.name} · ${getCoords(station)}`}
                className="absolute w-2.5 h-2.5 -ml-1 -mt-1 border border-accent-cyan bg-vdu-green-bright hover:bg-accent-cyan transition-colors"
                style={{ left: `${x}%`, top: `${y}%`, boxShadow: '0 0 8px hsla(180,100%,70%,0.35)' }}
              />
            );
          })}

          {locatedStations.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <MapPin size={42} className="text-vdu-green-dim mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-vdu-green-bright mb-2">No coordinates in this scan</h3>
              <p className="text-xs text-vdu-green-dim max-w-sm">
                Obscure stations often have incomplete metadata. Randomise the feed or filter by region to surface more mapped signals.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className="border border-hairline bg-radio-dark p-3">
            <div className="flex items-center gap-2 mb-3">
              <Scan size={13} className="text-accent-cyan" />
              <h3 className="text-[11px] uppercase tracking-[0.14em] text-vdu-green-bright">Origin density</h3>
            </div>
            <div className="space-y-2">
              {topOrigins.map(([origin, count]) => (
                <div key={origin} className="grid grid-cols-[1fr_auto] gap-3 text-[11px] uppercase tracking-[0.06em]">
                  <span className="truncate text-vdu-green">{origin}</span>
                  <span className="text-vdu-green-dim">{count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-hairline bg-radio-dark p-3">
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-vdu-green-bright mb-3">Mapped signals</h3>
            <div className="space-y-2">
              {locatedStations.slice(0, 8).map((station) => (
                <button
                  key={station.stationuuid}
                  type="button"
                  onClick={() => onStationSelect?.(station)}
                  className="w-full text-left border border-hairline px-2 py-2 hover:border-vdu-green-dim transition-colors"
                >
                  <div className="text-[11px] uppercase tracking-[0.06em] text-vdu-green-bright truncate">{station.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-vdu-green-dim">{getOrigin(station)} · {getCoords(station)}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
