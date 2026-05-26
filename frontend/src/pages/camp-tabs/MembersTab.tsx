import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { campsApi } from "../../api/camps"

interface Props { campId: string }

export default function MembersTab({ campId }: Props) {
  const [inviteType, setInviteType] = useState<"multi" | "single">("multi")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  const { data: members = [] } = useQuery({
    queryKey: ["members", campId],
    queryFn: () => campsApi.members(campId).then(r => r.data as any[]),
  })

  const invite = useMutation({
    mutationFn: () => campsApi.invite(campId, inviteType, inviteEmail || undefined),
    onSuccess: (res) => {
      const token = res.data.token
      const url = `${window.location.origin}/login?invite=${token}`
      setInviteResult(url)
    },
  })

  return (
    <div className="space-y-6">
      {/* Kadra */}
      <div className="card">
        <h3 className="font-semibold mb-3">Kadra obozu ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">Brak kadry</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m: any) => (
              <div key={m.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{m.display_name ?? m.email}</span>
                  <span className="text-gray-400 text-xs ml-2">{m.email}</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.permissions}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zaproszenia */}
      <div className="card">
        <h3 className="font-semibold mb-3">Zaproś kadrę</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="itype" value="multi" checked={inviteType === "multi"}
                onChange={() => setInviteType("multi")} />
              Link wielorazowy
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="itype" value="single" checked={inviteType === "single"}
                onChange={() => setInviteType("single")} />
              Jednorazowe (email)
            </label>
          </div>
          {inviteType === "single" && (
            <input className="input" type="email" placeholder="jan@example.com"
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          )}
          <button onClick={() => invite.mutate()} disabled={invite.isPending} className="btn-primary text-sm">
            {invite.isPending ? "Generowanie..." : "Generuj link zaproszenia"}
          </button>
          {inviteResult && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs text-green-700 mb-1 font-medium">Link zaproszenia (ważny 7 dni):</p>
              <code className="text-xs break-all text-green-800">{inviteResult}</code>
              <button onClick={() => navigator.clipboard.writeText(inviteResult)}
                className="ml-2 text-xs text-green-600 hover:underline">kopiuj</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
