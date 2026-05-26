import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { campsApi } from "../api/camps"
import Layout from "../components/Layout"
import PlanningTab from "./camp-tabs/PlanningTab"
import ParticipantsTab from "./camp-tabs/ParticipantsTab"
import MembersTab from "./camp-tabs/MembersTab"

type Tab = "planning" | "participants" | "members"

export default function CampPage() {
  const { campId } = useParams<{ campId: string }>()
  const [tab, setTab] = useState<Tab>("planning")

  const { data: camp, isLoading } = useQuery({
    queryKey: ["camp", campId],
    queryFn: () => campsApi.get(campId!).then(r => r.data),
    enabled: !!campId,
  })

  if (isLoading) return <Layout><div className="text-center py-16 text-gray-400">Ładowanie...</div></Layout>
  if (!camp) return <Layout><div className="text-center py-16 text-gray-500">Obóz nie istnieje.</div></Layout>

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "planning",     label: "Harmonogram",  icon: "📅" },
    { key: "participants", label: "Uczestnicy",   icon: "👥" },
    { key: "members",      label: "Kadra",        icon: "🏕️" },
  ]

  return (
    <Layout>
      {/* Nagłówek */}
      <div className="flex items-center gap-3 mb-1">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Obozy</Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{camp.unit_name ?? "Obóz bez nazwy"}</h1>
          <p className="text-gray-500 text-sm mt-1">{camp.date_start} — {camp.date_end}</p>
        </div>
      </div>

      {/* Zakładki */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Zawartość zakładki */}
      {tab === "planning"     && <PlanningTab     campId={campId!} camp={camp} />}
      {tab === "participants" && <ParticipantsTab campId={campId!} />}
      {tab === "members"      && <MembersTab      campId={campId!} />}
    </Layout>
  )
}
