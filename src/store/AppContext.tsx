import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Generation, ModelProvider, Style } from '../types'
import { BUILTIN_STYLES } from '../lib/seedStyles'
import { idb, getSetting, setSetting } from '../lib/db'

interface AppState {
  // 画风库（内置 + 自定义）
  styles: Style[]
  customStyles: Style[]
  addCustomStyle: (s: Style) => Promise<void>
  updateCustomStyle: (s: Style) => Promise<void>
  deleteCustomStyle: (id: string) => Promise<void>
  // 统一模型注册（BYOK）
  providers: ModelProvider[]
  addProvider: (p: ModelProvider) => Promise<void>
  updateProvider: (p: ModelProvider) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  // 我的作品（本地）
  generations: Generation[]
  addGeneration: (g: Generation) => Promise<void>
  deleteGeneration: (id: string) => Promise<void>
  // 跨页：图片生成页当前选中的画风
  selectedStyleId: string | null
  setSelectedStyleId: (id: string | null) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [customStyles, setCustomStyles] = useState<Style[]>([])
  const [providers, setProviders] = useState<ModelProvider[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)

  useEffect(() => {
    idb.getAll<Style>('styles_custom').then(setCustomStyles)
  }, [])
  useEffect(() => {
    getSetting<ModelProvider[]>('providers').then((p) => setProviders(p ?? []))
  }, [])
  useEffect(() => {
    idb.getAll<Generation>('generations').then((g) => setGenerations(sortDesc(g)))
  }, [])

  const styles = [...BUILTIN_STYLES, ...customStyles]

  const refreshCustom = () => idb.getAll<Style>('styles_custom').then(setCustomStyles)
  const addCustomStyle = async (s: Style) => {
    await idb.put('styles_custom', s)
    await refreshCustom()
  }
  const updateCustomStyle = async (s: Style) => {
    await idb.put('styles_custom', s)
    await refreshCustom()
  }
  const deleteCustomStyle = async (id: string) => {
    await idb.del('styles_custom', id)
    await refreshCustom()
  }

  const persistProviders = async (next: ModelProvider[]) => {
    setProviders(next)
    await setSetting('providers', next)
  }
  const addProvider = (p: ModelProvider) => persistProviders([...providers, p])
  const updateProvider = (p: ModelProvider) =>
    persistProviders(providers.map((x) => (x.id === p.id ? p : x)))
  const deleteProvider = (id: string) => persistProviders(providers.filter((x) => x.id !== id))

  const refreshGenerations = () => idb.getAll<Generation>('generations').then((g) => setGenerations(sortDesc(g)))
  const addGeneration = async (g: Generation) => {
    await idb.put('generations', g)
    await refreshGenerations()
  }
  const deleteGeneration = async (id: string) => {
    await idb.del('generations', id)
    await refreshGenerations()
  }

  return (
    <Ctx.Provider
      value={{
        styles,
        customStyles,
        addCustomStyle,
        updateCustomStyle,
        deleteCustomStyle,
        providers,
        addProvider,
        updateProvider,
        deleteProvider,
        generations,
        addGeneration,
        deleteGeneration,
        selectedStyleId,
        setSelectedStyleId,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

function sortDesc(g: Generation[]): Generation[] {
  return [...g].sort((a, b) => b.createdAt - a.createdAt)
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp 必须在 <AppProvider> 内使用')
  return v
}
