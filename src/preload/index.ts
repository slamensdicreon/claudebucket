import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type {
  CrowdmindTest,
  ChatMensaje,
  Comparacion,
  ComparacionModo,
  ComparacionResult,
  CsvColumnMapping,
  CsvPreview,
  EstimuloAttachment,
  EstimuloTipo,
  EtapaFunnelDraft,
  FollowUp,
  FollowUpResultSummary,
  FunnelResultSummary,
  FunnelTemplate,
  InterviewPersonaResult,
  MarketplacePanelTemplate,
  ModoInteraccion,
  Note,
  NoteScopeType,
  Panel,
  PanelTimelinePoint,
  Persona,
  PersonaDraft,
  PersonaGenerationInput,
  PersonaImproveInput,
  PersonaVersion,
  ProviderId,
  ProviderSetting,
  TemaTest,
  TestResultSummary,
  UpdateStatus,
  Workspace
} from '@shared/types'

const api = {
  workspaces: {
    list: (): Promise<Workspace[]> => ipcRenderer.invoke(IPC.workspacesList),
    create: (nombre: string): Promise<Workspace> => ipcRenderer.invoke(IPC.workspacesCreate, nombre),
    rename: (id: string, nombre: string): Promise<Workspace> => ipcRenderer.invoke(IPC.workspacesRename, id, nombre),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.workspacesDelete, id),
    seedDemo: (): Promise<Workspace> => ipcRenderer.invoke(IPC.workspacesSeedDemo)
  },
  notes: {
    list: (input: { scopeType: NoteScopeType; scopeId: string }): Promise<Note[]> => ipcRenderer.invoke(IPC.notesList, input),
    create: (input: { scopeType: NoteScopeType; scopeId: string; title: string; contentMarkdown: string }): Promise<Note> =>
      ipcRenderer.invoke(IPC.notesCreate, input),
    update: (id: string, patch: Partial<{ title: string; contentMarkdown: string }>): Promise<Note> =>
      ipcRenderer.invoke(IPC.notesUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.notesDelete, id)
  },
  panels: {
    list: (workspaceId: string): Promise<Panel[]> => ipcRenderer.invoke(IPC.panelsList, workspaceId),
    get: (id: string): Promise<Panel | null> => ipcRenderer.invoke(IPC.panelsGet, id),
    create: (input: { workspaceId: string; nombre: string; descripcion: string; color: string }): Promise<Panel> =>
      ipcRenderer.invoke(IPC.panelsCreate, input),
    update: (
      id: string,
      patch: Partial<{ nombre: string; descripcion: string; color: string; esPublico: boolean; descripcionPublica: string; autorPublico: string }>
    ): Promise<Panel> => ipcRenderer.invoke(IPC.panelsUpdate, id, patch),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.panelsDelete, id)
  },
  personas: {
    list: (panelId: string): Promise<Persona[]> => ipcRenderer.invoke(IPC.personasList, panelId),
    get: (id: string): Promise<Persona | null> => ipcRenderer.invoke(IPC.personasGet, id),
    create: (panelId: string, draft: PersonaDraft): Promise<Persona> => ipcRenderer.invoke(IPC.personasCreate, panelId, draft),
    update: (id: string, draft: Partial<PersonaDraft>): Promise<Persona> => ipcRenderer.invoke(IPC.personasUpdate, id, draft),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.personasDelete, id),
    generatePreview: (input: PersonaGenerationInput): Promise<PersonaDraft[]> => ipcRenderer.invoke(IPC.personasGeneratePreview, input),
    improveDraft: (input: PersonaImproveInput): Promise<PersonaDraft> => ipcRenderer.invoke(IPC.personasImproveDraft, input),
    runInterview: (input: {
      workspaceId: string
      panelId: string
      guide: string
      count: number
      provider: ProviderId
      model?: string
    }): Promise<InterviewPersonaResult[]> => ipcRenderer.invoke(IPC.personasRunInterview, input),
    saveBulk: (panelId: string, drafts: PersonaDraft[]): Promise<Persona[]> =>
      ipcRenderer.invoke(IPC.personasSaveBulk, panelId, drafts),
    pickCsvFile: (): Promise<CsvPreview | null> => ipcRenderer.invoke(IPC.personasPickCsvFile),
    importCsvPreview: (input: { filePath: string; mapeoColumnas: CsvColumnMapping; agruparSimilares: boolean }): Promise<PersonaDraft[]> =>
      ipcRenderer.invoke(IPC.personasImportCsvPreview, input),
    generateAvatarImage: (input: { personaId: string; workspaceId: string }): Promise<Persona> =>
      ipcRenderer.invoke(IPC.personasGenerateAvatarImage, input)
  },
  tests: {
    list: (panelId: string): Promise<CrowdmindTest[]> => ipcRenderer.invoke(IPC.testsList, panelId),
    get: (id: string): Promise<CrowdmindTest | null> => ipcRenderer.invoke(IPC.testsGet, id),
    getResults: (testId: string): Promise<TestResultSummary | null> => ipcRenderer.invoke(IPC.testsGetResults, testId),
    runSimple: (input: {
      workspaceId: string
      panelId: string
      nombre: string
      estimuloTipo?: EstimuloTipo
      estimuloContenido: string
      imagenDataUri?: string
      attachments?: EstimuloAttachment[]
      provider: ProviderId
      model?: string
      responseLanguage?: 'es' | 'en'
      personaIds?: string[]
      scorecardCriteria?: string[]
    }): Promise<TestResultSummary> => ipcRenderer.invoke(IPC.testsRunSimple, input),
    getNarrativeReport: (testId: string): Promise<string | null> => ipcRenderer.invoke(IPC.testsGetNarrativeReport, testId),
    exportPdf: (testId: string, variant: 'summary' | 'full' = 'summary'): Promise<{ success: boolean; filePath?: string }> =>
      ipcRenderer.invoke(IPC.testsExportPdf, testId, variant),
    exportJson: (testId: string): Promise<{ success: boolean; filePath?: string }> => ipcRenderer.invoke(IPC.testsExportJson, testId),
    exportMarkdown: (testId: string): Promise<{ success: boolean; filePath?: string }> => ipcRenderer.invoke(IPC.testsExportMarkdown, testId)
  },
  versions: {
    list: (personaId: string): Promise<PersonaVersion[]> => ipcRenderer.invoke(IPC.versionsList, personaId),
    testsUsing: (versionId: string): Promise<Array<{ testId: string; testNombre: string }>> =>
      ipcRenderer.invoke(IPC.versionsTestsUsing, versionId)
  },
  temas: {
    list: (testId: string): Promise<TemaTest[]> => ipcRenderer.invoke(IPC.temasList, testId),
    extraer: (input: { testId: string; workspaceId: string; provider: ProviderId; model?: string }): Promise<TemaTest[]> =>
      ipcRenderer.invoke(IPC.temasExtraer, input)
  },
  followUps: {
    listForTest: (testId: string): Promise<FollowUp[]> => ipcRenderer.invoke(IPC.followUpsListForTest, testId),
    getResults: (followUpId: string): Promise<FollowUpResultSummary | null> =>
      ipcRenderer.invoke(IPC.followUpsGetResults, followUpId),
    run: (input: {
      testId: string
      workspaceId: string
      personaIds: string[]
      pregunta: string
      provider: ProviderId
      model?: string
      responseLanguage?: 'es' | 'en'
    }): Promise<FollowUpResultSummary> => ipcRenderer.invoke(IPC.followUpsRun, input)
  },
  funnel: {
    getResults: (testId: string): Promise<FunnelResultSummary | null> => ipcRenderer.invoke(IPC.funnelGetResults, testId),
    run: (input: {
      workspaceId: string
      panelId: string
      nombre: string
      modoInteraccion: ModoInteraccion
      etapas: EtapaFunnelDraft[]
      provider: ProviderId
      model?: string
      responseLanguage?: 'es' | 'en'
      personaIds?: string[]
      scorecardCriteria?: string[]
    }): Promise<FunnelResultSummary> => ipcRenderer.invoke(IPC.funnelRun, input),
    listTemplates: (): Promise<FunnelTemplate[]> => ipcRenderer.invoke(IPC.funnelTemplatesList)
  },
  comparison: {
    listTests: (workspaceId: string): Promise<Array<{ id: string; nombre: string; panelNombre: string }>> =>
      ipcRenderer.invoke(IPC.comparisonListTests, workspaceId),
    list: (workspaceId: string): Promise<Comparacion[]> => ipcRenderer.invoke(IPC.comparisonList, workspaceId),
    run: (input: { workspaceId: string; modo: ComparacionModo; testAId: string; testBId: string }): Promise<ComparacionResult> =>
      ipcRenderer.invoke(IPC.comparisonRun, input)
  },
  timeline: {
    getForPanel: (panelId: string): Promise<PanelTimelinePoint[]> => ipcRenderer.invoke(IPC.timelineGetForPanel, panelId)
  },
  marketplace: {
    exportPanel: (input: { panelId: string; descripcionPublica: string; autorPublico: string }): Promise<{ success: boolean; filePath?: string }> =>
      ipcRenderer.invoke(IPC.marketplaceExportPanel, input),
    importPanel: (): Promise<MarketplacePanelTemplate | null> => ipcRenderer.invoke(IPC.marketplaceImportPanel),
    listBundled: (): Promise<Array<{ fileName: string; template: MarketplacePanelTemplate }>> =>
      ipcRenderer.invoke(IPC.marketplaceListBundled),
    refreshFromRepo: (): Promise<Array<{ fileName: string; template: MarketplacePanelTemplate }>> =>
      ipcRenderer.invoke(IPC.marketplaceRefreshFromRepo)
  },
  update: {
    isSupported: (): Promise<boolean> => ipcRenderer.invoke(IPC.updateIsSupported),
    getStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke(IPC.updateGetStatus),
    check: (): Promise<void> => ipcRenderer.invoke(IPC.updateCheck),
    download: (): Promise<void> => ipcRenderer.invoke(IPC.updateDownload),
    install: (): Promise<void> => ipcRenderer.invoke(IPC.updateInstall),
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_e: unknown, status: UpdateStatus) => callback(status)
      ipcRenderer.on(IPC.updateStatusPush, listener)
      return () => ipcRenderer.removeListener(IPC.updateStatusPush, listener)
    }
  },
  chat: {
    list: (personaId: string): Promise<ChatMensaje[]> => ipcRenderer.invoke(IPC.chatList, personaId),
    send: (input: {
      personaId: string
      workspaceId: string
      mensaje: string
      provider: ProviderId
      model?: string
      responseLanguage?: 'es' | 'en'
    }): Promise<{ userMsg: ChatMensaje; personaMsg: ChatMensaje }> => ipcRenderer.invoke(IPC.chatSend, input)
  },
  settings: {
    listProviders: (): Promise<ProviderSetting[]> => ipcRenderer.invoke(IPC.settingsListProviders),
    setApiKey: (input: { provider: ProviderId; workspaceId: string | null; apiKey: string }): Promise<void> =>
      ipcRenderer.invoke(IPC.settingsSetApiKey, input),
    clearApiKey: (input: { provider: ProviderId; workspaceId: string | null }): Promise<void> =>
      ipcRenderer.invoke(IPC.settingsClearApiKey, input),
    setDefaultModel: (input: { provider: ProviderId; workspaceId: string | null; model: string }): Promise<void> =>
      ipcRenderer.invoke(IPC.settingsSetDefaultModel, input),
    testProvider: (input: { provider: ProviderId; workspaceId: string | null }): Promise<{ ok: boolean; message: string }> =>
      ipcRenderer.invoke(IPC.settingsTestProvider, input),
    isEncryptionAvailable: (): Promise<boolean> => ipcRenderer.invoke(IPC.settingsIsEncryptionAvailable)
  }
}

export type CrowdmindApi = typeof api

contextBridge.exposeInMainWorld('crowdmind', api)
