import { BoardCell, CellOwner, TeamColor } from '../src/types/game.types';
import { DIFFICULTY_CONFIGS } from '../src/domain/solo/config/difficulty.config';
import { generateClue } from '../src/domain/solo/engine/clue-generator';
import { SeededRandom } from '../src/domain/solo/engine/seeded-random';
import {
  clueCompleted,
  createActiveMediumClue,
  emptyClueHistory,
  registerSelection,
  updateClueHistory,
} from '../src/domain/solo/engine/active-clue';
import { ES_SEMANTIC_PACK } from '../src/data/word-packs/es-semantic-v1';
import { isKnownExcludedWord } from '../src/domain/solo/engine/vocabulary-validator';
import { getBoardWordsForDifficulty } from '../src/services/game/BoardVocabulary';
import { normalize } from '../src/utils/string.utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Esperado: ${expected}. Recibido: ${actual}`);
  }
}

const WORDS = [
  'BARCO', 'PLAYA', 'TIBURON', 'PUERTO', 'FARO', 'ISLA', 'OLA', 'MAREA', 'AGUA',
  'CASTILLO', 'CORONA', 'REY', 'TRONO', 'ESPADA', 'ESCUDO', 'CABALLO', 'BANDERA',
  'TORMENTA', 'NUBE', 'LLUVIA', 'VIENTO', 'RAYO', 'FUEGO', 'SOMBRA', 'RELOJ',
];

declare const process: { env?: Record<string, string | undefined> };
const SIM_GAMES = Number(process.env?.SOLO_SIM_GAMES ?? 1000);

function makeBoard(team: TeamColor = 'BLUE'): BoardCell[] {
  const owners: CellOwner[] = [
    ...Array(9).fill(team),
    ...Array(8).fill(team === 'BLUE' ? 'RED' : 'BLUE'),
    ...Array(7).fill('NEUTRAL'),
    'CURSED',
  ];

  return WORDS.map((word, index) => ({
    id: `cell-${index}`,
    position: index,
    word,
    owner: owners[index],
    state: 'HIDDEN',
  }));
}

function testActiveClueCounters() {
  const board = makeBoard();
  const clue = createActiveMediumClue({
    clueId: 'mar-test',
    clue: 'MAR',
    count: 3,
    targetCellIds: ['cell-0', 'cell-1', 'cell-2'],
    explanation: [],
    confidence: 1,
    riskScore: 0,
    engineVersion: 'test',
  }, 1);

  assertEqual(clue.originalCount, 3, 'originalCount');
  assertEqual(clue.remainingCount, 3, 'remainingCount inicial');
  assertEqual(clue.maximumSelections, 4, 'maximumSelections');

  const afterOne = registerSelection(clue, board[0].id, true);
  assertEqual(afterOne.originalCount, 3, 'originalCount no debe cambiar');
  assertEqual(afterOne.remainingCount, 2, 'remainingCount baja tras acierto');
  assertEqual(afterOne.maximumSelections, 4, 'maximumSelections no debe cambiar');
  assertEqual(afterOne.status, 'active', 'status tras acierto parcial');

  const afterTwo = registerSelection(afterOne, board[1].id, true);
  const afterThree = registerSelection(afterTwo, board[2].id, true);
  assertEqual(afterThree.remainingCount, 0, 'remainingCount final');
  assertEqual(afterThree.status, 'completed', 'status completado');
  assertEqual(clueCompleted(afterThree), true, 'clueCompleted');
}

function testGeneratorProducesMultiWordClues() {
  const board = makeBoard();
  const cfg = DIFFICULTY_CONFIGS.apprentice;
  const history = emptyClueHistory();
  let sawTwo = false;
  let sawThree = false;
  let sawFour = false;

  for (let i = 0; i < 40; i++) {
    const clue = generateClue(board, 'BLUE', cfg, new SeededRandom(`unit-${i}`), history);
    if (clue.count === 2) sawTwo = true;
    if (clue.count === 3) sawThree = true;
    if (clue.count === 4) sawFour = true;
    assertEqual(new Set(clue.targetCellIds).size, clue.targetCellIds.length, 'sin objetivos duplicados');
    assert(clue.targetCellIds.every((id) => board.find((cell) => cell.id === id)?.state === 'HIDDEN'), 'no debe incluir reveladas');
    assert(clue.explanation.length === clue.targetCellIds.length, 'toda relacion tiene explicacion');
  }

  assert(sawTwo || sawThree || sawFour, 'Debe generar pistas multi-palabra');
}

function testLocalBoardVocabulary() {
  for (const difficulty of ['EASY', 'MEDIUM', 'HARD', 'INFERNAL'] as const) {
    for (let i = 0; i < 80; i++) {
      const words = getBoardWordsForDifficulty(difficulty, `local-${difficulty}-${i}`);
      assertEqual(words.length, 25, `${difficulty}: tablero debe tener 25 palabras`);
      assertEqual(new Set(words.map((word) => word.toLowerCase())).size, 25, `${difficulty}: palabras unicas`);
      for (const word of words) {
        const key = normalize(word);
        assert(!isKnownExcludedWord(key), `${difficulty}: palabra excluida ${word}`);
        assert(Object.values(ES_SEMANTIC_PACK).some((entry) => normalize(entry.normalizedText) === key), `${difficulty}: palabra fuera del pack ${word}`);
      }
    }
  }
}

function simulateDifficulty(name: keyof typeof DIFFICULTY_CONFIGS, games = 1000) {
  const cfg = DIFFICULTY_CONFIGS[name];
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let repeatedImmediate = 0;
  let repeatedCombination = 0;
  let invalidVocabulary = 0;
  let missingExplanation = 0;
  const semanticWords = Object.keys(ES_SEMANTIC_PACK).filter((word) => {
    const entry = ES_SEMANTIC_PACK[word];
    return entry.commonness >= (cfg.minimumCommonness ?? 0.45) && !isKnownExcludedWord(word);
  });

  for (let game = 0; game < games; game++) {
    const rng = new SeededRandom(`${name}-${game}`);
    const boardWords = rng.shuffle(semanticWords).slice(0, 25);
    const owners: CellOwner[] = [
      ...Array(9).fill('BLUE'),
      ...Array(8).fill('RED'),
      ...Array(7).fill('NEUTRAL'),
      'CURSED',
    ];
    const board = boardWords.map((word, index): BoardCell => ({
      id: `${game}-${index}`,
      position: index,
      word,
      owner: owners[index],
      state: 'HIDDEN',
    }));
    let history = emptyClueHistory();
    let previousClue = '';

    for (let turn = 0; turn < 1; turn++) {
      const clue = generateClue(board, 'BLUE', cfg, new SeededRandom(`${name}-${game}-${turn}`), history);
      counts[clue.count] = (counts[clue.count] ?? 0) + 1;
      if (previousClue === clue.clue) repeatedImmediate++;
      previousClue = clue.clue;
      if (clue.targetCellIds.length !== new Set(clue.targetCellIds).size) repeatedCombination++;
      if (isKnownExcludedWord(clue.clue)) invalidVocabulary++;
      if (clue.explanation.length !== clue.targetCellIds.length) missingExplanation++;
      const active = createActiveMediumClue(clue, turn + 1);
      history = updateClueHistory(history, active);
      active.originalTargetWordIds.forEach((id) => {
        const cell = board.find((item) => item.id === id);
        if (cell) cell.state = 'REVEALED';
      });
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return {
    difficulty: name,
    total,
    one: counts[1] / total,
    two: counts[2] / total,
    three: counts[3] / total,
    four: counts[4] / total,
    averageTargets: (counts[1] + counts[2] * 2 + counts[3] * 3 + counts[4] * 4) / total,
    repeatedImmediate,
    repeatedCombination,
    invalidVocabulary,
    missingExplanation,
  };
}

function main() {
  testActiveClueCounters();
  testGeneratorProducesMultiWordClues();
  testLocalBoardVocabulary();
  const report = (Object.keys(DIFFICULTY_CONFIGS) as Array<keyof typeof DIFFICULTY_CONFIGS>)
    .map((difficulty) => simulateDifficulty(difficulty, SIM_GAMES));

  for (const item of report) {
    assert(item.one <= 0.25, `${item.difficulty}: demasiadas pistas de una palabra`);
    assertEqual(item.repeatedImmediate, 0, `${item.difficulty}: pistas repetidas inmediatamente`);
    assertEqual(item.invalidVocabulary, 0, `${item.difficulty}: vocabulario invalido`);
    assertEqual(item.missingExplanation, 0, `${item.difficulty}: explicaciones faltantes`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
