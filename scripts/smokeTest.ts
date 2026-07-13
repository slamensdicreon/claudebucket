/**
 * Standalone smoke test for the core loop, using the built-in "local" provider so it needs no API keys.
 * Run with: npm run smoke-test
 * Exercises: workspace -> panel -> AI-generated personas -> simple test -> results -> chat, all against
 * the real SQLite file, then prints a summary and exits non-zero on any failure.
 */
import { app } from 'electron'
import { createWorkspace } from '../src/main/db/repo/workspaces'
import { createPanel } from '../src/main/db/repo/panels'
import { createPersonasBulk, listPersonas, updatePersona } from '../src/main/db/repo/personas'
import { createTest, saveRespuesta, getTestResults } from '../src/main/db/repo/tests'
import { saveChatMensaje, listChatMensajes } from '../src/main/db/repo/chat'
import { listPersonaVersions, getLatestPersonaVersionId } from '../src/main/db/repo/personaVersions'
import { generatePersonasWithAi, getPersonaResponseToStimulus, getPersonaChatReply } from '../src/main/llm/useCases'
import { evaluarYGuardarConfianza } from '../src/main/analytics/confidence'
import { extraerYGuardarTemas } from '../src/main/analytics/temas'
import { createFollowUp, saveFollowUpRespuesta, getFollowUpResults } from '../src/main/db/repo/followUps'
import { getFollowUpReply } from '../src/main/llm/useCases'
import { createEtapas, getFunnelResults } from '../src/main/db/repo/funnel'
import { runFunnelTest } from '../src/main/engine/funnelEngine'
import { createComparacion, computeComparison } from '../src/main/db/repo/comparison'
import { generarReporteCompletoHtml, generarReporteNarrativoHtml, generarReporteNarrativoMarkdown } from '../src/main/report/narrativeReport'
import { parseCsvToPersonaDrafts } from '../src/main/csv/csvImport'
import { buildMarketplaceTemplate, parseMarketplaceTemplate, listBundledTemplates, fetchRemoteTemplates } from '../src/main/marketplace/marketplace'
import { seedDemoWorkspace } from '../src/main/demo/seedDemo'
import { listFunnelTemplates } from '../src/main/funnelTemplates/funnelTemplates'
import { parseDataUri } from '../src/main/llm/types'
import { listPanels } from '../src/main/db/repo/panels'
import { listTests } from '../src/main/db/repo/tests'
import { getDbPath } from '../src/main/db/client'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

async function main() {
  const localCall = { provider: 'local' as const, apiKey: null, model: 'local-deterministic-v1' }

  const workspace = createWorkspace('QA Smoke Test Workspace')
  assert(workspace.id, 'workspace created')
  console.log(`[ok] workspace created: ${workspace.nombre} (${workspace.id})`)

  const panel = createPanel({ workspaceId: workspace.id, nombre: 'QA Panel', descripcion: 'panel de prueba', color: '#5eead4' })
  assert(panel.id, 'panel created')
  console.log(`[ok] panel created: ${panel.nombre} (${panel.id})`)

  const drafts = await generatePersonasWithAi(localCall, 'Consumidores urbanos 25-40, ingreso medio, interesados en alimentación saludable', 5)
  assert(drafts.length === 5, `expected 5 persona drafts, got ${drafts.length}`)
  const personas = createPersonasBulk(panel.id, drafts)
  assert(personas.length === 5, 'personas saved')
  console.log(`[ok] ${personas.length} personas generated + saved (local provider, deterministic)`)

  const listed = listPersonas(panel.id)
  assert(listed.length === 5, 'personas listed back from db')

  const test = createTest({
    workspaceId: workspace.id,
    panelId: panel.id,
    nombre: 'Test de humo',
    estimuloTipo: 'texto',
    estimuloContenido: 'Nueva línea de snacks saludables, entrega el mismo día, certificación orgánica.'
  })
  console.log(`[ok] test created: ${test.nombre} (${test.id})`)

  for (const persona of listed) {
    const respuesta = await getPersonaResponseToStimulus(localCall, persona, test.estimuloContenido)
    saveRespuesta({
      testId: test.id,
      personaId: persona.id,
      scoreSatisfaccion: respuesta.scoreSatisfaccion,
      opinionTexto: respuesta.opinionTexto,
      objeciones: respuesta.objeciones,
      aspectosPositivos: respuesta.aspectosPositivos,
      modeloUsadoProvider: 'local',
      modeloUsadoModel: 'local-deterministic-v1'
    })
  }

  const results = getTestResults(test.id)
  assert(results, 'test results retrievable')
  assert(results!.respuestas.length === 5, `expected 5 respuestas, got ${results!.respuestas.length}`)
  console.log(
    `[ok] test results: ${results!.respuestas.length} respuestas, score promedio ${results!.scorePromedio.toFixed(2)}, distribución ${JSON.stringify(results!.distribucion)}`
  )

  const TINY_PNG_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  const { mimeType, base64 } = parseDataUri(TINY_PNG_DATA_URI)
  assert(mimeType === 'image/png' && base64.length > 0, 'parseDataUri should split the mime type and base64 payload')
  const imageRespuesta = await getPersonaResponseToStimulus(localCall, listed[0], 'Reacciona a esta imagen de producto.', TINY_PNG_DATA_URI)
  assert(typeof imageRespuesta.scoreSatisfaccion === 'number', 'local provider should handle an image-attached stimulus without crashing')
  console.log(`[ok] multimodal stimulus works — local provider responded with score ${imageRespuesta.scoreSatisfaccion}/10`)

  const PDF_DATA_URI = 'data:application/pdf;base64,JVBERi0xLjQKJUVPRg=='
  const attachmentRespuesta = await getPersonaResponseToStimulus(
    localCall,
    listed[1],
    'Reacciona al paquete adjunto.',
    undefined,
    [],
    [
      { id: 'smoke-image-1', type: 'image', name: 'concept.png', mimeType: 'image/png', dataUri: TINY_PNG_DATA_URI, sizeBytes: 68 },
      { id: 'smoke-pdf-1', type: 'pdf', name: 'brief.pdf', mimeType: 'application/pdf', dataUri: PDF_DATA_URI, sizeBytes: 15 }
    ]
  )
  assert(typeof attachmentRespuesta.scoreSatisfaccion === 'number', 'local provider should handle multiple attachments without crashing')
  console.log('[ok] multi-attachment stimulus works - image + PDF accepted by the shared test path')

  const { indice, disclaimers } = await evaluarYGuardarConfianza(test.id, localCall, results!.respuestas)
  assert(typeof indice === 'number' && indice >= 0 && indice <= 100, `confidence index out of range: ${indice}`)
  console.log(`[ok] confidence index: ${indice}/100, ${disclaimers.length} disclaimer(s)`)

  const temas = await extraerYGuardarTemas(test.id, localCall, results!.respuestas)
  assert(temas.length > 0, 'expected at least one extracted theme')
  assert(
    temas.every((t) => t.personasRepresentativas.every((v) => results!.respuestas.some((r) => r.personaId === v.personaId))),
    'every representative persona ID must belong to this test'
  )
  console.log(`[ok] extracted ${temas.length} theme(s), e.g. "${temas[0].nombreTema}" (${temas[0].cantidadMenciones} menciones)`)

  const persona = listed[0]

  const versionsBefore = listPersonaVersions(persona.id)
  assert(versionsBefore.length === 1, `expected 1 version at creation, got ${versionsBefore.length}`)
  updatePersona(persona.id, { disposicionBase: persona.disposicionBase === 'entusiasta' ? 'esceptico' : 'entusiasta' })
  const versionsAfter = listPersonaVersions(persona.id)
  assert(versionsAfter.length === 2, `expected 2 versions after edit, got ${versionsAfter.length}`)
  assert(versionsAfter[0].diffResumen.includes('disposicion_base'), `diff summary should mention the changed field, got: "${versionsAfter[0].diffResumen}"`)
  assert(getLatestPersonaVersionId(persona.id) === versionsAfter[0].id, 'latest version id should match the most recent version')
  console.log(`[ok] persona versioning works — diff: "${versionsAfter[0].diffResumen}"`)

  const TINY_JPEG_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  const withAvatar = updatePersona(persona.id, { avatarImageDataUri: TINY_JPEG_DATA_URI })
  assert(withAvatar.avatarImageDataUri === TINY_JPEG_DATA_URI, 'custom avatar image should round-trip through updatePersona')
  const withoutAvatar = updatePersona(persona.id, { avatarImageDataUri: null })
  assert(withoutAvatar.avatarImageDataUri === null, 'clearing the avatar image should round-trip as null')
  console.log('[ok] custom persona avatar image (upload path) round-trips correctly')

  const followUpTargets = listed.slice(0, 3)
  const followUp = createFollowUp(test.id, '¿Qué te haría reconsiderar tu decisión?', followUpTargets.map((p) => p.id))
  for (const p of followUpTargets) {
    const original = results!.respuestas.find((r) => r.personaId === p.id)?.opinionTexto ?? ''
    const reply = await getFollowUpReply(localCall, p, original, followUp.pregunta)
    saveFollowUpRespuesta(followUp.id, p.id, reply)
  }
  const followUpResults = getFollowUpResults(followUp.id)
  assert(followUpResults, 'follow-up results retrievable')
  assert(followUpResults!.respuestas.length === 3, `expected 3 follow-up respuestas, got ${followUpResults!.respuestas.length}`)
  console.log(`[ok] batch follow-up works — ${followUpResults!.respuestas.length} respuestas for "${followUp.pregunta}"`)

  const testB = createTest({
    workspaceId: workspace.id,
    panelId: panel.id,
    nombre: 'Test de humo B',
    estimuloTipo: 'texto',
    estimuloContenido: 'Misma línea de snacks, pero con envío gratis y sin certificación orgánica.'
  })
  for (const p of listed) {
    const respuesta = await getPersonaResponseToStimulus(localCall, p, testB.estimuloContenido)
    saveRespuesta({
      testId: testB.id,
      personaId: p.id,
      scoreSatisfaccion: respuesta.scoreSatisfaccion,
      opinionTexto: respuesta.opinionTexto,
      objeciones: respuesta.objeciones,
      aspectosPositivos: respuesta.aspectosPositivos,
      modeloUsadoProvider: 'local',
      modeloUsadoModel: 'local-deterministic-v1'
    })
  }
  const comparacion = createComparacion(workspace.id, 'mismo_panel_dos_estimulos', test.id, testB.id)
  const comparisonResult = computeComparison(comparacion)
  assert(comparisonResult, 'comparison result computed')
  assert(comparisonResult!.deltas.length === 5, `expected 5 persona deltas, got ${comparisonResult!.deltas.length}`)
  console.log(`[ok] comparison works — score promedio delta: ${comparisonResult!.scorePromedioDelta.toFixed(2)}`)

  const reportHtml = generarReporteNarrativoHtml(test.id)
  assert(reportHtml && reportHtml.includes('<html') && reportHtml.includes(test.nombre), 'narrative report HTML should be well-formed and mention the test name')
  assert(reportHtml!.includes('Recomendaciones'), 'narrative report should include a recommendations section')
  console.log(`[ok] narrative report generated — ${reportHtml!.length} characters of HTML`)

  const reportMd = generarReporteNarrativoMarkdown(test.id)
  assert(reportMd && reportMd.startsWith('# Reporte') && reportMd.includes('## Recomendaciones'), 'markdown report should be well-formed')
  console.log(`[ok] markdown report generated — ${reportMd!.length} characters`)
  const fullReportHtml = generarReporteCompletoHtml(test.id)
  assert(fullReportHtml && fullReportHtml.includes('Detalle por persona del panel'), 'full report should include persona detail table')
  console.log(`[ok] full report generated — ${fullReportHtml!.length} characters of HTML`)

  const csvPath = path.join(os.tmpdir(), `crowdmind-smoketest-${Date.now()}.csv`)
  fs.writeFileSync(
    csvPath,
    'full_name,years,city,income,disposition\n' +
      'Laura Gomez,28,Bogotá,medio,entusiasta\n' +
      'Pedro Ruiz,52,Lima,alto,esceptico\n' +
      'Marta Diaz,29,Bogotá,medio,entusiasta\n'
  )
  const csvDrafts = parseCsvToPersonaDrafts(
    csvPath,
    { full_name: 'nombre', years: 'edad', city: 'ciudad', income: 'nivelIngreso', disposition: 'disposicionBase' },
    true
  )
  assert(csvDrafts.length === 2, `expected 2 grouped personas from 3 similar CSV rows, got ${csvDrafts.length}`)
  assert(csvDrafts.some((d) => d.nombre === 'Laura Gomez' && d.historiaPersonal.includes('2 personas')), 'grouped persona should note how many rows it represents')
  fs.unlinkSync(csvPath)
  console.log(`[ok] CSV import works — 3 rows grouped into ${csvDrafts.length} personas`)

  const marketplaceTemplate = buildMarketplaceTemplate(panel.id, 'Panel de prueba QA', 'Crowdmind QA')
  assert(marketplaceTemplate, 'marketplace template built')
  assert(marketplaceTemplate!.personas.length === 5, `expected 5 personas in template, got ${marketplaceTemplate!.personas.length}`)
  assert(!('id' in marketplaceTemplate!.personas[0]), 'exported personas must not leak internal IDs')
  const roundTripped = parseMarketplaceTemplate(JSON.stringify(marketplaceTemplate))
  assert(roundTripped.personas.length === 5, 'template round-trips through JSON serialization/validation')
  console.log(`[ok] marketplace export/import works — template with ${roundTripped.personas.length} personas round-tripped`)

  const bundledTemplates = listBundledTemplates()
  assert(bundledTemplates.length >= 6, `expected at least 6 bundled templates, got ${bundledTemplates.length}`)
  for (const b of bundledTemplates) {
    assert(b.template.personas.length > 0, `bundled template "${b.fileName}" has no personas`)
  }
  console.log(
    `[ok] bundled templates load and validate — ${bundledTemplates.map((b) => `${b.template.nombre} (${b.template.personas.length})`).join(', ')}`
  )

  const funnelTemplates = listFunnelTemplates()
  assert(funnelTemplates.length >= 5, `expected at least 5 funnel templates, got ${funnelTemplates.length}`)
  for (const ft of funnelTemplates) {
    assert(ft.etapas.length > 0, `funnel template "${ft.nombre}" has no stages`)
  }
  console.log(`[ok] funnel templates load and validate — ${funnelTemplates.map((t) => `${t.nombre} (${t.etapas.length} etapas)`).join(', ')}`)

  try {
    const remoteTemplates = await fetchRemoteTemplates()
    console.log(`[ok] fetched ${remoteTemplates.length} template(s) live from GitHub (Brokenwatch24/crowdmind)`)
  } catch (err) {
    console.log(`[warn] live GitHub template fetch failed (non-fatal, network-dependent): ${err instanceof Error ? err.message : err}`)
  }

  const demoWorkspace = await seedDemoWorkspace()
  const demoPanels = listPanels(demoWorkspace.id)
  assert(demoPanels.length === 1, `expected 1 demo panel, got ${demoPanels.length}`)
  assert(demoPanels[0].personaCount === 8, `expected 8 demo personas, got ${demoPanels[0].personaCount}`)
  const demoTests = listTests(demoPanels[0].id)
  assert(demoTests.length === 1, `expected 1 demo test, got ${demoTests.length}`)
  const demoResults = getTestResults(demoTests[0].id)
  assert(demoResults && demoResults.respuestas.length === 8, `expected 8 demo respuestas, got ${demoResults?.respuestas.length}`)
  assert(demoTests[0].indiceConfianza !== null, 'demo test should have a computed confidence index')
  console.log(`[ok] demo workspace seeded — ${demoPanels[0].personaCount} personas, confidence ${demoTests[0].indiceConfianza}/100`)

  const funnelTestIndividual = createTest({
    workspaceId: workspace.id,
    panelId: panel.id,
    nombre: 'Funnel individual',
    tipo: 'funnel',
    modoInteraccion: 'individual',
    estimuloTipo: 'texto',
    estimuloContenido: 'Etapa 1'
  })
  const etapasIndividual = createEtapas(funnelTestIndividual.id, [
    { orden: 0, tipoEstimulo: 'texto', estimuloContenido: 'Ves un anuncio de la marca en redes sociales.', estimuloMetadata: {}, titulo: 'Etapa 1 — Anuncio' },
    { orden: 1, tipoEstimulo: 'texto', estimuloContenido: 'Entras a la landing page y ves los precios.', estimuloMetadata: {}, titulo: 'Etapa 2 — Landing' },
    { orden: 2, tipoEstimulo: 'texto', estimuloContenido: 'Llegas al checkout con el costo de envío incluido.', estimuloMetadata: {}, titulo: 'Etapa 3 — Checkout' }
  ])
  await runFunnelTest({
    testId: funnelTestIndividual.id,
    personas: listed,
    etapas: etapasIndividual,
    modoInteraccion: 'individual',
    resolveCallForPersona: () => localCall
  })
  const funnelResultsIndividual = getFunnelResults(funnelTestIndividual.id)
  assert(funnelResultsIndividual, 'funnel (individual) results retrievable')
  assert(funnelResultsIndividual!.etapas.length === 3, `expected 3 stages, got ${funnelResultsIndividual!.etapas.length}`)
  assert(funnelResultsIndividual!.etapas[0].entraron === 5, `expected all 5 personas to enter stage 1, got ${funnelResultsIndividual!.etapas[0].entraron}`)
  assert(
    funnelResultsIndividual!.etapas[2].entraron <= funnelResultsIndividual!.etapas[0].entraron,
    'stage 3 entries should never exceed stage 1 entries (drop-off is monotonic)'
  )
  console.log(
    `[ok] funnel (individual mode) works — stage counts: ${funnelResultsIndividual!.etapas.map((s) => s.entraron).join(' → ')}`
  )

  const funnelTestFocusGroup = createTest({
    workspaceId: workspace.id,
    panelId: panel.id,
    nombre: 'Funnel focus group',
    tipo: 'funnel',
    modoInteraccion: 'focus_group',
    estimuloTipo: 'texto',
    estimuloContenido: 'Etapa 1'
  })
  const etapasFocusGroup = createEtapas(funnelTestFocusGroup.id, [
    { orden: 0, tipoEstimulo: 'texto', estimuloContenido: 'Ves el anuncio en grupo.', estimuloMetadata: {}, titulo: 'Etapa 1' },
    { orden: 1, tipoEstimulo: 'texto', estimuloContenido: 'Discuten el precio en grupo.', estimuloMetadata: {}, titulo: 'Etapa 2' }
  ])
  await runFunnelTest({
    testId: funnelTestFocusGroup.id,
    personas: listed.slice(0, 3),
    etapas: etapasFocusGroup,
    modoInteraccion: 'focus_group',
    resolveCallForPersona: () => localCall
  })
  const funnelResultsFocusGroup = getFunnelResults(funnelTestFocusGroup.id)
  assert(funnelResultsFocusGroup, 'funnel (focus group) results retrievable')
  assert(funnelResultsFocusGroup!.etapas[0].entraron === 3, `expected 3 personas to enter stage 1, got ${funnelResultsFocusGroup!.etapas[0].entraron}`)
  console.log(
    `[ok] funnel (focus group mode) works — stage counts: ${funnelResultsFocusGroup!.etapas.map((s) => s.entraron).join(' → ')}`
  )

  const userMsg = saveChatMensaje(persona.id, 'user', '¿Qué opinas de este producto?')
  const reply = await getPersonaChatReply(localCall, persona, [userMsg], '¿Qué opinas de este producto?')
  const personaMsg = saveChatMensaje(persona.id, 'persona', reply)
  const history = listChatMensajes(persona.id)
  assert(history.length === 2, `expected 2 chat messages, got ${history.length}`)
  console.log(`[ok] chat 1:1 works — ${persona.nombre} replied: "${personaMsg.contenido.slice(0, 80)}..."`)

  console.log(`[ok] sqlite db file at: ${getDbPath()}`)
  console.log('\nALL CHECKS PASSED')
}

app.whenReady().then(() => {
  main()
    .then(() => {
      app.exit(0)
    })
    .catch((err) => {
      console.error(err)
      app.exit(1)
    })
})
