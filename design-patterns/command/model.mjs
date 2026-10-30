// The Command figure's model: three stock adjustments queued as commands, run
// one by one, then the last one undone. build.mjs inlines this file into the
// page, so the counter wheels, the readout and the step captions all come from
// replay() below. The Python and TypeScript examples under code/ run the same
// scenario and print the same stock levels.

export const START_STOCK = 100;

// Each card is one command: what to do to the stock, and by how much.
export const COMMANDS = [
  { kind: "receive", qty: 50, name: "Nhập 50", code: "+50", cls: "ReceiveStock" },
  { kind: "ship", qty: 20, name: "Xuất 20", code: "−20", cls: "ShipStock" },
  { kind: "ship", qty: 15, name: "Xuất 15", code: "−15", cls: "ShipStock" },
];

// The scenario, one entry per step: what the invoker does at that step.
export const STEPS = [
  { action: "queue" },
  { action: "run", card: 0 },
  { action: "run", card: 1 },
  { action: "run", card: 2 },
  { action: "undo", card: 2 },
];

// What a command does to the stock when it runs; undo applies the opposite.
export const delta = (command) => (command.kind === "receive" ? command.qty : -command.qty);

// Replays the scenario up to step n with a tiny invoker: a queue, a history stack, a stock.
export function replay(n) {
  let stock = START_STOCK;
  const queue = COMMANDS.map((_, i) => i);
  const history = [];
  let undone = null;
  for (let i = 1; i <= n; i++) {
    const step = STEPS[i];
    if (step.action === "run") {
      const card = queue.shift();
      stock += delta(COMMANDS[card]);
      history.push(card);
    } else if (step.action === "undo") {
      const card = history.pop();
      stock -= delta(COMMANDS[card]);
      undone = card;
    }
  }
  return { stock, queue, history, undone };
}

// Small counts read as words in captions: "ba phiếu", "còn hai phiếu".
export const say = (n) => ["không", "một", "hai", "ba", "bốn", "năm"][n] ?? String(n);

// Stock after each step: 100, 150, 130, 115, 130.
export const STOCK = STEPS.map((_, i) => replay(i).stock);
