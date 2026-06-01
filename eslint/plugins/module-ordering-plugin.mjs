/** @typedef {import('eslint').Rule.RuleModule} RuleModule */

/** @type {Record<string, number>} */
const SECTION_INDEX = {
  import: 0,
  'module-constant': 1,
  'export-default': 2,
  'export-const': 3,
  'export-function': 4,
  'export-type': 5,
  'module-function': 6,
  'module-type': 7,
  unknown: 8,
}

/** @type {string[]} */
const SECTION_ORDER = Object.keys(SECTION_INDEX).filter(k => k !== 'unknown')

/**
 * @param {import('estree').Node} node
 * @returns {boolean}
 */
function isDirectiveStatement(node) {
  return (
    node.type === 'ExpressionStatement' &&
    node.expression.type === 'Literal' &&
    typeof node.expression.value === 'string' &&
    (node.expression.value === 'use client' ||
      node.expression.value === 'use server')
  )
}

/**
 * @param {import('estree').Node} node
 * @returns {keyof typeof SECTION_INDEX}
 */
function sectionForNode(node) {
  switch (node.type) {
    case 'ImportDeclaration':
      return 'import'

    case 'ExportDefaultDeclaration':
      return 'export-default'

    case 'ExportAllDeclaration':
      return 'export-const'

    case 'ExportNamedDeclaration': {
      if (node.exportKind === 'type') {
        return 'export-type'
      }

      const declaration = node.declaration
      if (declaration) {
        if (
          declaration.type === 'TSTypeAliasDeclaration' ||
          declaration.type === 'TSInterfaceDeclaration'
        ) {
          return 'export-type'
        }
        if (declaration.type === 'VariableDeclaration') {
          return 'export-const'
        }
        if (
          declaration.type === 'FunctionDeclaration' ||
          declaration.type === 'ClassDeclaration' ||
          declaration.type === 'TSEnumDeclaration'
        ) {
          return 'export-function'
        }
        return 'export-const'
      }

      const specifiers = node.specifiers ?? []
      if (
        specifiers.length > 0 &&
        specifiers.every(specifier => specifier.exportKind === 'type')
      ) {
        return 'export-type'
      }

      return 'export-const'
    }

    case 'VariableDeclaration':
      return 'module-constant'

    case 'FunctionDeclaration':
      return 'module-function'

    case 'ClassDeclaration':
      return 'module-function'

    case 'TSTypeAliasDeclaration':
    case 'TSInterfaceDeclaration':
      return 'module-type'

    case 'TSDeclareFunction':
      return 'module-type'

    case 'ExpressionStatement':
      if (isDirectiveStatement(node)) {
        return 'unknown'
      }
      return 'module-constant'

    case 'EmptyStatement':
      return 'unknown'

    default:
      return 'unknown'
  }
}

/**
 * @param {import('estree').Statement[]} body
 * @param {number} fromIndex
 * @param {keyof typeof SECTION_INDEX} section
 */
function hasSectionLater(body, fromIndex, section) {
  for (let index = fromIndex + 1; index < body.length; index++) {
    const laterSection = sectionForNode(body[index])
    if (laterSection === 'unknown') continue
    if (laterSection === section) return true
  }
  return false
}

/** @param {string} filename */
function shouldSkipFile(filename) {
  return (
    filename.endsWith('.d.ts') ||
    filename.includes('/_generated/') ||
    filename.includes('/.next/') ||
    filename.endsWith('routeTree.gen.ts') ||
    /(?:^|\/)(?:drizzle|sentry)\.[^/]+\.ts$/.test(filename) ||
    /(?:^|\/)tailwind\.config\.ts$/.test(filename)
  )
}

/** @type {RuleModule} */
const moduleOrderingRule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Enforce module section order: imports, module constants, export default, export const, export function, export type, module functions, module types',
    },
    schema: [],
    messages: {
      wrongOrder:
        '{{current}} must not appear after {{previous}}. Expected order: {{order}}.',
      wrongOrderBefore:
        '{{current}} must not appear before {{later}}. Expected order: {{order}}.',
      importsNotFirst:
        'Imports must be the first section in the file (before {{found}}).',
    },
  },
  create(context) {
    return {
      /** @param {import('estree').Program} node */
      Program(node) {
        const filename = context.filename ?? context.getFilename?.() ?? ''

        if (shouldSkipFile(filename)) {
          return
        }

        let maxSectionIndex = -1
        let lastSection = ''
        let seenNonImport = false

        for (let index = 0; index < node.body.length; index++) {
          const statement = node.body[index]
          const section = sectionForNode(statement)

          if (section === 'unknown') {
            continue
          }

          if (section !== 'import' && !seenNonImport) {
            seenNonImport = true
          }

          if (section === 'import' && seenNonImport) {
            context.report({
              node: statement,
              messageId: 'importsNotFirst',
              data: { found: lastSection || 'other code' },
            })
            continue
          }

          if (
            section === 'export-type' &&
            hasSectionLater(node.body, index, 'export-function')
          ) {
            context.report({
              node: statement,
              messageId: 'wrongOrderBefore',
              data: {
                current: section,
                later: 'export-function',
                order: SECTION_ORDER.join(' → '),
              },
            })
          }

          const sectionIndex = SECTION_INDEX[section]
          if (sectionIndex < maxSectionIndex) {
            context.report({
              node: statement,
              messageId: 'wrongOrder',
              data: {
                current: section,
                previous: lastSection,
                order: SECTION_ORDER.join(' → '),
              },
            })
          }

          if (sectionIndex > maxSectionIndex) {
            maxSectionIndex = sectionIndex
            lastSection = section
          }
        }
      },
    }
  },
}

/** @type {import('eslint').ESLint.Plugin} */
const moduleOrderingPlugin = {
  meta: {
    name: 'module-ordering',
    version: '1.0.0',
  },
  rules: {
    'module-ordering': moduleOrderingRule,
  },
}

export default moduleOrderingPlugin
