const WORDS = [
  "rocket", "pizza", "castle", "guitar", "sunflower",
  "elephant", "bicycle", "umbrella", "telephone", "butterfly",
  "rainbow", "mountain", "airplane", "diamond", "pirate",
  "bridge", "candle", "dolphin", "eagle", "flamingo",
  "garden", "hammer", "island", "jungle", "kangaroo",
  "ladder", "mushroom", "necklace", "ostrich", "pancake",
  "queen", "robot", "sandwich", "telescope", "unicorn",
  "volcano", "waterfall", "xylophone", "yacht", "zebra",
  "anchor", "balloon", "cactus", "dragon", "envelope",
  "fountain", "glasses", "helicopter", "icicle", "jellyfish",
  "koala", "lemon", "microscope", "notebook", "octopus",
  "penguin", "quarter", "rainbow", "scissors", "triangle",
  "accordion", "backpack", "compass", "dominoes", "escalator",
  "feather", "gondola", "hammock", "igloo", "jigsaw",
  "kettle", "lantern", "marble", "napkin", "origami",
  "parachute", "quilt", "riddle", "satellite", "trampoline",
  "vacuum", "wand", "yoyo", "zeppelin", "avocado",
  "baguette", "cabinet", "dartboard", "espresso", "fireplace",
  "gargoyle", "harmonica", "inkwell", "javelin", "kaleidoscope",
  "lobster", "manatee", "nutcracker", "otter", "popcorn",
  "raspberry", "seaweed", "toucan", "ukulele", "velociraptor",
  "waffle", "acorn", "badge", "clover", "drawbridge"
];

let shuffled = [...WORDS];

function shuffle() {
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
}

export function pickWords(count: number): string[] {
  if (count > WORDS.length) {
    throw new Error(`Cannot pick ${count} words; only ${WORDS.length} available`);
  }
  shuffle();
  return shuffled.slice(0, count);
}

export function listAllWords(): string[] {
  return [...WORDS];
}
