"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { golferImageUrl } from "@/lib/golfer-images";

interface Golfer {
  id: number;
  name: string;
  espn_id: string | null;
  tier: number;
}

export default function VerifyImagesPage() {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("golfers")
        .select("id, name, espn_id, tier")
        .order("tier")
        .order("name");
      setGolfers(data || []);
      setLoading(false);
    }
    load();
  }, []);

  function toggleFlag(espnId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(espnId)) next.delete(espnId);
      else next.add(espnId);
      return next;
    });
  }

  function copyFlaggedList() {
    const list = golfers
      .filter((g) => g.espn_id && (flagged.has(g.espn_id) || broken.has(g.espn_id)))
      .map((g) => `${g.name} (espn_id: ${g.espn_id}, tier: ${g.tier})`)
      .join("\n");
    navigator.clipboard.writeText(list);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full" />
      </div>
    );
  }

  const tiers = [1, 2, 3, 4, 5, 6];
  const flaggedCount = new Set([...Array.from(flagged), ...Array.from(broken)]).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#006747]">Verify Golfer Images</h2>
        <a href="/admin" className="text-sm text-[#006747] underline">
          Back to Admin
        </a>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Click any golfer whose photo is <strong>wrong</strong> or doesn&apos;t match their name.
          Red border = broken/missing image (auto-detected). Yellow border = flagged by you.
        </p>
        {flaggedCount > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-yellow-900">
              {flaggedCount} flagged
            </span>
            <button
              onClick={copyFlaggedList}
              className="bg-[#006747] text-white px-3 py-1 rounded text-xs font-semibold"
            >
              Copy Flagged List
            </button>
          </div>
        )}
      </div>

      {tiers.map((tier) => {
        const tierGolfers = golfers.filter((g) => g.tier === tier);
        if (tierGolfers.length === 0) return null;

        return (
          <div key={tier}>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              Tier {tier} ({tierGolfers.length} golfers)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {tierGolfers.map((golfer) => {
                const imgUrl = golfer.espn_id ? golferImageUrl(golfer.espn_id) : "";
                const isBroken = golfer.espn_id ? broken.has(golfer.espn_id) : true;
                const isFlagged = golfer.espn_id ? flagged.has(golfer.espn_id) : false;
                const borderClass = isBroken
                  ? "ring-2 ring-red-500"
                  : isFlagged
                  ? "ring-2 ring-yellow-500"
                  : "ring-1 ring-gray-200";

                return (
                  <button
                    key={golfer.id}
                    onClick={() => golfer.espn_id && toggleFlag(golfer.espn_id)}
                    className={`flex flex-col items-center p-2 rounded-lg bg-white ${borderClass} hover:shadow-md transition-shadow`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center mb-1">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={golfer.name}
                          className="w-full h-full object-cover object-top"
                          onError={() => {
                            if (golfer.espn_id) {
                              setBroken((prev) => new Set(prev).add(golfer.espn_id!));
                            }
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">
                          {golfer.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center leading-tight">
                      {golfer.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {golfer.espn_id || "no id"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
