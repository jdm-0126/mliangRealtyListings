
import { TenantSettings } from "@/lib/shared/types/public";

export async function formatPropertyDescription(notes: string) {
  if (!notes) return null
  const brokerName = "Melanie Liang";

  // const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);

  // Normalize Facebook-style text into separate lines
  const normalized = notes
    .replace(/\s+(📍)/g, "\n$1")
    .replace(/\s+(✨)/g, "\n\n$1")
    .replace(/\s+(💰)/g, "\n\n$1")
    .replace(/\s+(💼)/g, "\n\n$1")
    .replace(/\s+(📩)/g, "\n\n$1")

    // Property detail emojis
    .replace(/\s+(🏠)/g, "\n    $1")
    .replace(/\s+(🛁)/g, "\n    $1")
    .replace(/\s+(🛏️)/g, "\n    $1")
    .replace(/\s+(📐)/g, "\n    $1")
    .replace(/\s+(🏡)/g, "\n    $1")
    .replace(/\s+(🚗)/g, "\n    $1")
    .replace(/\s+(🍽️)/g, "\n    $1")
    .replace(/\s+(👩‍🍳)/g, "\n    $1")
    .replace(/\s+(🌿)/g, "\n    $1")
    .replace(/\s+(✔️)/g, "\n    $1")
    .replace(/\s+(✅)/g, "\n    $1")

    // Labels
    .replace(/Property Details:/gi, "\n\n✨ Property Details")
    .replace(/Occupancy Status:/gi, "\n\n🏢 Occupancy Status")
    .replace(/Income Potential:/gi, "\n\n💼 Income Potential")
    .replace(
        new RegExp(`\\s+(${brokerName ?? ""})`, "i"),
        "\n\n$1"
      )
    .replace(/Property ID/gi, "\n\nProperty ID")

  const lines = normalized
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Section header
        if (/^(✨|💼|🏢)/u.test(line)) {
          return (
            <h3
              key={index}
              className="mt-5 mb-2 text-lg font-bold text-slate-900"
            >
              {line.replace(/^[^\s]+\s*/, "")}
            </h3>
          )
        }

        // Location
        if (/^📍/u.test(line)) {
          return (
            <div key={index} className="flex gap-2 pl-4">
              <span>📍</span>
              <span>{line.substring(2).trim()}</span>
            </div>
          )
        }

        // Price
        if (/^💰/u.test(line)) {
          return (
            <div
              key={index}
              className="flex gap-2 pl-4 font-semibold text-green-700"
            >
              <span>💰</span>
              <span>{line.substring(2).trim()}</span>
            </div>
          )
        }

        // Detail rows
        if (/^(🏠|🛁|🛏️|📐|🏡|🚗|🍽️|👩‍🍳|🌿|✔️|✅)/u.test(line)) {
          return (
            <div
              key={index}
              className="pl-8 flex gap-2"
            >
              <span>{line.match(/^[^\s]+/)?.[0]}</span>
              <span>{line.replace(/^[^\s]+\s*/, "")}</span>
            </div>
          )
        }

        // Property ID
        if (/^Property ID/i.test(line)) {
          return (
            <div
              key={index}
              className="mt-4 font-semibold"
            >
              {line}
            </div>
          )
        }

        // Normal paragraph
        return (
          <p
            key={index}
            className="leading-7 text-left"
          >
            {line}
          </p>
        )
      })}
    </div>
  )
}