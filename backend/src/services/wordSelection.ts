export function selectWord(code: string, words: readonly string[]): string {
  const sum = [...code].reduce((acc, character) => acc + character.charCodeAt(0), 0);
  return words[sum % words.length];
}
