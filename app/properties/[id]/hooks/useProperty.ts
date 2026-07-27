import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/tables"

interface UsePropertyProps {
  id: string
}

export function useProperty({ id }: UsePropertyProps) {
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from(TABLES.listings)
          .select("*")
          .eq("property_id", Number(id))
          .single()

        if (error) throw error

        setProperty(data)
      } catch (error) {
        console.error("Failed to load property:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  return {
    property,
    loading,
    setProperty,
  }
}