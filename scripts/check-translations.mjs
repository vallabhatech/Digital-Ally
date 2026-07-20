import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const rootDirectory = process.cwd();
const sourceDirectory = path.join(rootDirectory, 'src');
const constantsPath = path.join(sourceDirectory, 'shared', 'constants.ts');

const parseFile = (filePath) =>
  ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

const getPropertyName = (property) => {
  if (!property.name) return null;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
    return property.name.text;
  }
  return null;
};

const constantsSource = parseFile(constantsPath);
const schemasSource = parseFile(path.join(sourceDirectory, 'shared', 'validation', 'schemas.ts'));
const translations = new Map();
const configuredLocales = new Set();
const dynamicTranslationKeys = new Set();

const visitConstants = (node) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    (ts.isArrayLiteralExpression(node.initializer) || ts.isObjectLiteralExpression(node.initializer) || ts.isAsExpression(node.initializer))
  ) {
    let initializer = node.initializer;
    if (ts.isAsExpression(initializer)) initializer = initializer.expression;

    if (ts.isArrayLiteralExpression(initializer)) {
      const target =
        node.name.text === 'LANGUAGES'
          ? { propertyName: 'value', values: configuredLocales }
          : node.name.text === 'COLOR_PALETTES'
            ? { propertyName: 'name', values: dynamicTranslationKeys }
            : null;

      if (target) {
        for (const element of initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          for (const property of element.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              getPropertyName(property) === target.propertyName &&
              ts.isStringLiteral(property.initializer)
            ) {
              target.values.add(property.initializer.text);
            }
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(initializer) && node.name.text === 'VALIDATION_ERROR_KEYS') {
      for (const property of initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
          dynamicTranslationKeys.add(property.initializer.text);
        }
      }
    }
  }

  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === 'TRANSLATIONS' &&
    node.initializer &&
    ts.isObjectLiteralExpression(node.initializer)
  ) {
    for (const localeProperty of node.initializer.properties) {
      if (!ts.isPropertyAssignment(localeProperty)) continue;

      const locale = getPropertyName(localeProperty);
      if (!locale || !ts.isObjectLiteralExpression(localeProperty.initializer)) continue;

      const keys = new Set();
      for (const translationProperty of localeProperty.initializer.properties) {
        const key = getPropertyName(translationProperty);
        if (key) keys.add(key);
      }
      translations.set(locale, keys);
    }
  }

  ts.forEachChild(node, visitConstants);
};

visitConstants(constantsSource);
visitConstants(schemasSource);

if (translations.size === 0) {
  console.error('Translation coverage failed: TRANSLATIONS could not be read.');
  process.exit(1);
}

const sourceFiles = [];
const collectSourceFiles = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(entryPath);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }
};

collectSourceFiles(sourceDirectory);

const usedKeys = new Set();
for (const filePath of sourceFiles) {
  const source = parseFile(filePath);
  const visitCalls = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 't' &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      usedKeys.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visitCalls);
  };
  visitCalls(source);
}
for (const key of dynamicTranslationKeys) usedKeys.add(key);

const allDefinedKeys = new Set([...translations.values()].flatMap((keys) => [...keys]));
const failures = [];

for (const locale of configuredLocales) {
  if (!translations.has(locale)) {
    failures.push(`${locale} is configured in LANGUAGES but has no translation table`);
  }
}

for (const [locale, keys] of translations) {
  const missingDefinedKeys = [...allDefinedKeys].filter((key) => !keys.has(key));
  const missingUsedKeys = [...usedKeys].filter((key) => !keys.has(key));

  if (missingDefinedKeys.length > 0) {
    failures.push(`${locale} is missing locale keys: ${missingDefinedKeys.sort().join(', ')}`);
  }
  if (missingUsedKeys.length > 0) {
    failures.push(`${locale} is missing used keys: ${missingUsedKeys.sort().join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error(`Translation coverage failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `Translation coverage passed: ${translations.size} locales, ` +
    `${allDefinedKeys.size} consistent keys, ${usedKeys.size} static UI keys checked.`
);
