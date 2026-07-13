export const IPC = {
  workspacesList: 'workspaces:list',
  workspacesCreate: 'workspaces:create',
  workspacesRename: 'workspaces:rename',
  workspacesDelete: 'workspaces:delete',
  workspacesSeedDemo: 'workspaces:seedDemo',

  notesList: 'notes:list',
  notesCreate: 'notes:create',
  notesUpdate: 'notes:update',
  notesDelete: 'notes:delete',

  panelsList: 'panels:list',
  panelsGet: 'panels:get',
  panelsCreate: 'panels:create',
  panelsUpdate: 'panels:update',
  panelsDelete: 'panels:delete',

  personasList: 'personas:list',
  personasGet: 'personas:get',
  personasCreate: 'personas:create',
  personasUpdate: 'personas:update',
  personasDelete: 'personas:delete',
  personasGeneratePreview: 'personas:generatePreview',
  personasImproveDraft: 'personas:improveDraft',
  personasRunInterview: 'personas:runInterview',
  personasSaveBulk: 'personas:saveBulk',
  personasPickCsvFile: 'personas:pickCsvFile',
  personasImportCsvPreview: 'personas:importCsvPreview',
  personasGenerateAvatarImage: 'personas:generateAvatarImage',

  versionsList: 'versions:list',
  versionsTestsUsing: 'versions:testsUsing',

  testsList: 'tests:list',
  testsGet: 'tests:get',
  testsRunSimple: 'tests:runSimple',
  testsGetResults: 'tests:getResults',
  testsGetNarrativeReport: 'tests:getNarrativeReport',
  testsExportPdf: 'tests:exportPdf',
  testsExportJson: 'tests:exportJson',
  testsExportMarkdown: 'tests:exportMarkdown',

  temasList: 'temas:list',
  temasExtraer: 'temas:extraer',

  followUpsRun: 'followUps:run',
  followUpsListForTest: 'followUps:listForTest',
  followUpsGetResults: 'followUps:getResults',

  funnelEtapasSave: 'funnel:etapasSave',
  funnelRun: 'funnel:run',
  funnelGetResults: 'funnel:getResults',
  funnelTemplatesList: 'funnel:templatesList',

  comparisonRun: 'comparison:run',
  comparisonList: 'comparison:list',
  comparisonListTests: 'comparison:listTests',

  timelineGetForPanel: 'timeline:getForPanel',

  marketplaceExportPanel: 'marketplace:exportPanel',
  marketplaceImportPanel: 'marketplace:importPanel',
  marketplaceListBundled: 'marketplace:listBundled',
  marketplaceRefreshFromRepo: 'marketplace:refreshFromRepo',

  updateCheck: 'update:check',
  updateGetStatus: 'update:getStatus',
  updateDownload: 'update:download',
  updateInstall: 'update:install',
  updateIsSupported: 'update:isSupported',
  updateStatusPush: 'update:statusPush',

  chatList: 'chat:list',
  chatSend: 'chat:send',

  settingsListProviders: 'settings:listProviders',
  settingsSetApiKey: 'settings:setApiKey',
  settingsClearApiKey: 'settings:clearApiKey',
  settingsSetDefaultModel: 'settings:setDefaultModel',
  settingsTestProvider: 'settings:testProvider',
  settingsIsEncryptionAvailable: 'settings:isEncryptionAvailable'
} as const
