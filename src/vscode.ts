import { VSCodeThemeId } from './types'
import JSZip from 'jszip'
import {ofetch} from 'ofetch'
import resolvePath from 'resolve-pathname'
import json5 from 'json5'

/**
 * Download theme from VS Code market.
 * `<Identifier>.<ThemeName>`
 * .Eg. `kricsleo.gentle-clen.Gentle Clean Vitesse`
 */
export async function downloadVSCodeTheme(remoteVSCodeTheme: VSCodeThemeId) {
  const [publisher, extId, theme] = remoteVSCodeTheme.split('.')
  const themeLink = 
    `https://${publisher}.gallery.vsassets.io` +
    `/_apis/public/gallery/publisher/${publisher}` +
    `/extension/${extId}/latest` +
    `/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage`
  const buffer = await ofetch(themeLink, { responseType: 'arrayBuffer'})
  const zip = await JSZip.loadAsync(buffer)
  const pkgContent = await zip.file('extension/package.json')!.async('string')
  const pkgJSON: VSCodeThemePkgJSON = JSON.parse(pkgContent);
  const themeConfig = (pkgJSON.contributes.themes || []).find(
    t => t.label.toLowerCase() === theme.toLowerCase()
  )
  if(!themeConfig) {
    const avaliableThemes = (pkgJSON.contributes.themes || [])
      .map(t => `\`${t.label}\``)
      .join(' | ')
    throw new Error(`Not found theme \`${theme}\`, but found ${avaliableThemes}`)
  }
  const themePath = resolvePath(themeConfig.path, 'extension/')
  const themeContent = await zip.file(themePath)!.async('string')
  const themeJSON = json5.parse(themeContent)
  return themeJSON
}

interface VSCodeThemePkgJSON {
  contributes: {
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
  }
}