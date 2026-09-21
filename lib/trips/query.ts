import type { SupabaseClient } from "@supabase/supabase-js"

/** Rows shown per page in the trip control table. */
export const TRIPS_PAGE_SIZE = 50

/**
 * PostgREST refuses to return more than 1000 rows in a single response and an
 * explicit limit does not lift that cap, so anything that needs the whole table
 * has to walk it page by page.
 */
const MAX_ROWS_PER_REQUEST = 1000

/**
 * A free-text search can only be pushed to the server for columns that live on
 * trips. Driver name and plate live on related tables, so they are resolved to
 * driver ids on the client and sent as driver_id=in.(...). That list rides in
 * the URL, so it is capped: past this many matches the term is too generic to
 * be a useful search anyway, and an oversized URL is rejected outright by the
 * API gateway.
 */
const SEARCH_DRIVER_LIMIT = 250

export const TRIP_LINES = ["L1", "L2", "L1/L2"] as const

export const TRIP_STATUSES = [
  "pendiente",
  "completado_l2",
  "completado_l1",
  "completado_l1_l2",
  "completado_particularidad",
  "cancelado",
] as const

export interface TripFilters {
  search: string
  dateFrom: string
  dateTo: string
  status: string
  line: string
  /** Driver id, or "all". */
  driver: string
  product: string
  /** Transport company id, or "all". */
  transportCompany: string
  loadingLocation: string
  unloadingLocation: string
}

export const EMPTY_TRIP_FILTERS: TripFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  status: "all",
  line: "all",
  driver: "all",
  product: "all",
  transportCompany: "all",
  loadingLocation: "all",
  unloadingLocation: "all",
}

export function hasActiveTripFilters(filters: TripFilters): boolean {
  return (Object.keys(EMPTY_TRIP_FILTERS) as (keyof TripFilters)[]).some(
    (key) => filters[key] !== EMPTY_TRIP_FILTERS[key],
  )
}

export interface DriverOption {
  id: string
  name: string
  active?: boolean
  chasis?: { patent_chasis?: string | null; transport_company_id?: string | null } | null
  semi?: { patent_chasis?: string | null } | null
}

const DRIVER_EMBED = `driver:driver_id(
    id,
    name,
    cuit,
    chasis:chasis_id(
      id,
      patent_chasis,
      vehicle_type,
      transport_company,
      transport_company_id,
      transport_companies:transport_company_id(id, name)
    ),
    semi:semi_id(id, patent_chasis, vehicle_type)
  )`

/**
 * Filtering by transport company means filtering on a column three levels deep
 * (trips -> drivers -> vehicles), which PostgREST only allows across inner
 * embeds. The inner join also drops trips with no driver or no chasis -- 23 of
 * them today -- so it is only used when that filter is actually set.
 */
const DRIVER_EMBED_INNER = DRIVER_EMBED.replace("driver:driver_id(", "driver:driver_id!inner(").replace(
  "chasis:chasis_id(",
  "chasis:chasis_id!inner(",
)

const tripSelect = (filterByCompany: boolean) => `*, ${filterByCompany ? DRIVER_EMBED_INNER : DRIVER_EMBED}`

/** Strip the characters PostgREST uses to delimit an or=(...) expression. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[(),"\\]/g, " ").trim()
}

function matchingDriverIds(drivers: DriverOption[], term: string): string[] {
  const needle = term.toLowerCase()
  const ids: string[] = []
  for (const driver of drivers) {
    if (ids.length >= SEARCH_DRIVER_LIMIT) break
    const matches =
      (driver.name || "").toLowerCase().includes(needle) ||
      (driver.chasis?.patent_chasis || "").toLowerCase().includes(needle) ||
      (driver.semi?.patent_chasis || "").toLowerCase().includes(needle)
    if (matches) ids.push(driver.id)
  }
  return ids
}

function applyTripFilters<T>(query: T, filters: TripFilters, drivers: DriverOption[]): T {
  let q = query as any

  if (filters.dateFrom) q = q.gte("date", filters.dateFrom)
  if (filters.dateTo) q = q.lte("date", filters.dateTo)
  if (filters.status !== "all") q = q.eq("status", filters.status)
  if (filters.line !== "all") q = q.eq("line", filters.line)
  if (filters.driver !== "all") q = q.eq("driver_id", filters.driver)
  if (filters.product !== "all") q = q.eq("product", filters.product)
  if (filters.loadingLocation !== "all") q = q.eq("loading_location", filters.loadingLocation)
  if (filters.unloadingLocation !== "all") q = q.eq("unloading_location", filters.unloadingLocation)
  if (filters.transportCompany !== "all") {
    q = q.eq("driver.chasis.transport_company_id", filters.transportCompany)
  }

  const term = sanitizeSearchTerm(filters.search)
  if (term) {
    const clauses = [`client_name.ilike.*${term}*`]
    if (/^\d+$/.test(term)) clauses.push(`trip_number.eq.${term}`)
    const driverIds = matchingDriverIds(drivers, term)
    if (driverIds.length) clauses.push(`driver_id.in.(${driverIds.join(",")})`)
    q = q.or(clauses.join(","))
  }

  return q as T
}

function orderTrips<T>(query: T): T {
  return (query as any).order("date", { ascending: false }).order("trip_number", { ascending: false }) as T
}

/** One page of trips plus the total number of rows matching the filters. */
export async function fetchTripsPage(
  supabase: SupabaseClient,
  filters: TripFilters,
  page: number,
  drivers: DriverOption[],
): Promise<{ rows: any[]; total: number }> {
  const base = supabase.from("trips").select(tripSelect(filters.transportCompany !== "all"), { count: "exact" })
  const from = (page - 1) * TRIPS_PAGE_SIZE
  const { data, error, count } = await orderTrips(applyTripFilters(base, filters, drivers)).range(
    from,
    from + TRIPS_PAGE_SIZE - 1,
  )
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

/** Every trip matching the filters, walked page by page. Used by the export. */
export async function fetchAllMatchingTrips(
  supabase: SupabaseClient,
  filters: TripFilters,
  drivers: DriverOption[],
): Promise<any[]> {
  const rows: any[] = []
  for (let from = 0; ; from += MAX_ROWS_PER_REQUEST) {
    const base = supabase.from("trips").select(tripSelect(filters.transportCompany !== "all"))
    const { data, error } = await orderTrips(applyTripFilters(base, filters, drivers)).range(
      from,
      from + MAX_ROWS_PER_REQUEST - 1,
    )
    if (error) throw error
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < MAX_ROWS_PER_REQUEST) break
  }
  return rows
}

/** Keys match the labels the control table renders, not the database values. */
export interface TripStats {
  total: number
  byStatus: {
    pending: number
    completado_l2: number
    completado_l1: number
    completado_l1_l2: number
    completado_particularidad: number
    cancelled: number
  }
  byLine: { L1: number; L2: number; L1_L2: number }
}

/**
 * Whole-table counts for the summary badges. head: true asks PostgREST for the
 * count alone, so none of these requests carry a row payload.
 */
export async function fetchTripStats(supabase: SupabaseClient): Promise<TripStats> {
  const countWhere = async (column?: "status" | "line", value?: string) => {
    let q = supabase.from("trips").select("id", { count: "exact", head: true })
    if (column && value) q = q.eq(column, value)
    const { count, error } = await q
    if (error) throw error
    return count ?? 0
  }

  const [
    total,
    pending,
    completado_l2,
    completado_l1,
    completado_l1_l2,
    completado_particularidad,
    cancelled,
    L1,
    L2,
    L1_L2,
  ] = await Promise.all([
    countWhere(),
    countWhere("status", "pendiente"),
    countWhere("status", "completado_l2"),
    countWhere("status", "completado_l1"),
    countWhere("status", "completado_l1_l2"),
    countWhere("status", "completado_particularidad"),
    countWhere("status", "cancelado"),
    countWhere("line", "L1"),
    countWhere("line", "L2"),
    countWhere("line", "L1/L2"),
  ])

  return {
    total,
    byStatus: { pending, completado_l2, completado_l1, completado_l1_l2, completado_particularidad, cancelled },
    byLine: { L1, L2, L1_L2 },
  }
}

export interface TripFacets {
  products: string[]
  loadingLocations: string[]
  unloadingLocations: string[]
  driverIds: Set<string>
}

/**
 * The distinct values actually used by trips, so each filter dropdown offers
 * real options instead of the whole master table. Postgres cannot return
 * DISTINCT through PostgREST without a view, so this scans four narrow columns
 * (~150 KB for the full table) rather than reading the master lists, which
 * would both miss values only present on older trips and offer many that are
 * never used.
 */
export async function fetchTripFacets(supabase: SupabaseClient): Promise<TripFacets> {
  const products = new Set<string>()
  const loadingLocations = new Set<string>()
  const unloadingLocations = new Set<string>()
  const driverIds = new Set<string>()

  for (let from = 0; ; from += MAX_ROWS_PER_REQUEST) {
    const { data, error } = await supabase
      .from("trips")
      .select("product, loading_location, unloading_location, driver_id")
      .range(from, from + MAX_ROWS_PER_REQUEST - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const row of data as any[]) {
      if (row.product) products.add(row.product)
      if (row.loading_location) loadingLocations.add(row.loading_location)
      if (row.unloading_location) unloadingLocations.add(row.unloading_location)
      if (row.driver_id) driverIds.add(row.driver_id)
    }
    if (data.length < MAX_ROWS_PER_REQUEST) break
  }

  const sorted = (set: Set<string>) => Array.from(set).sort()
  return {
    products: sorted(products),
    loadingLocations: sorted(loadingLocations),
    unloadingLocations: sorted(unloadingLocations),
    driverIds,
  }
}
