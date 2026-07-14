"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import NGOList from "@/components/NGOList";
import type { PublicNgo } from "@/lib/discovery/filters";

const NGOMap = dynamic(() => import("@/components/NGOMap"), { ssr: false });

export default function NgoExplorer({ ngos }: { ngos: PublicNgo[] }) {
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(
    ngos[0]?.id ?? null,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
      <NGOList
        ngos={ngos}
        selectedNgoId={selectedNgoId}
        onSelectNgo={setSelectedNgoId}
      />
      <aside
        className="h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-20"
        aria-label="NGO locations"
      >
        <NGOMap
          ngos={ngos}
          selectedNgoId={selectedNgoId}
          onSelectNgo={setSelectedNgoId}
        />
      </aside>
    </div>
  );
}
