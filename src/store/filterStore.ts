import { create } from 'zustand'
import type { Country, ChargingType } from '../lib/constants'

interface FilterState {
  month: string | null // 'YYYY-MM' or null = all time
  country: Country | 'All'
  chargingType: ChargingType | 'All'
  providers: string[] // empty = all providers
  crossFilterProvider: string | null

  setMonth: (month: string | null) => void
  setCountry: (country: Country | 'All') => void
  setChargingType: (t: ChargingType | 'All') => void
  toggleProvider: (provider: string) => void
  setCrossFilterProvider: (provider: string | null) => void
  clearAll: () => void
}

export const useFilterStore = create<FilterState>((set, get) => ({
  month: null,
  country: 'All',
  chargingType: 'All',
  providers: [],
  crossFilterProvider: null,

  setMonth: (month) => set({ month }),
  setCountry: (country) => set({ country }),
  setChargingType: (chargingType) => set({ chargingType }),
  toggleProvider: (provider) => {
    const current = get().providers
    set({
      providers: current.includes(provider) ? current.filter((p) => p !== provider) : [...current, provider],
    })
  },
  setCrossFilterProvider: (provider) =>
    set((s) => ({ crossFilterProvider: s.crossFilterProvider === provider ? null : provider })),
  clearAll: () => set({ month: null, country: 'All', chargingType: 'All', providers: [], crossFilterProvider: null }),
}))
