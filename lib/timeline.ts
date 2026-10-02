export const DURATION = 38;

export const PROMPT = "Plan a safe rollback for a payments deploy.";

export const PRICE = {
  input: "$0.80",
  output: "$3.20",
  prior: "$2.50 / $7.50",
} as const;

export type Criterion = { label: string; on: boolean };

export type Lane = {
  id: "A" | "B" | "C" | "D";
  best: boolean;
  score: number;
  text: string;
  criteria: readonly Criterion[];
};

export const LANES: readonly Lane[] = [
  {
    id: "A",
    best: false,
    score: 41,
    text: "Restart the service and watch the logs.",
    criteria: [
      { label: "Fits", on: true },
      { label: "Done", on: false },
      { label: "Safe", on: true },
    ],
  },
  {
    id: "B",
    best: true,
    score: 92,
    text: "Freeze traffic. Ship the last good artifact. Verify auth and capture. Then reopen.",
    criteria: [
      { label: "Fits", on: true },
      { label: "Done", on: true },
      { label: "Safe", on: true },
    ],
  },
  {
    id: "C",
    best: false,
    score: 55,
    text: "Rewrite the pipeline and migrate regions tonight.",
    criteria: [
      { label: "Fits", on: false },
      { label: "Done", on: false },
      { label: "Safe", on: false },
    ],
  },
  {
    id: "D",
    best: false,
    score: 28,
    text: "Turn payments off until next week.",
    criteria: [
      { label: "Fits", on: false },
      { label: "Done", on: false },
      { label: "Safe", on: false },
    ],
  },
] as const;

export const WINNER = LANES[1];

export type Chapter = {
  id: "request" | "parallel" | "select" | "return" | "composite";
  index: string;
  title: string;
  label: string;
  start: number;
  hero: number;
  caption: string;
  support: string;
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "request",
    index: "01",
    title: "Request",
    label: "Request",
    start: 0,
    hero: 6.4,
    caption: "You send one request.",
    support: "A single call to pareto-26.10-preview.",
  },
  {
    id: "parallel",
    index: "02",
    title: "Parallel",
    label: "Parallel",
    start: 8.2,
    hero: 15.2,
    caption: "Several models answer in parallel.",
    support: "Stand-in lanes. They show the shape, not a private roster.",
  },
  {
    id: "select",
    index: "03",
    title: "Select",
    label: "Select",
    start: 17,
    hero: 24.4,
    caption: "Pareto evaluates and selects the best.",
    support: "This demo sketches the score as fits, done, and safe to ship.",
  },
  {
    id: "return",
    index: "04",
    title: "Return",
    label: "Return",
    start: 26.2,
    hero: 30.8,
    caption: "That answer is what comes back.",
    support: "One response leaves. The other drafts stay inside the call.",
  },
  {
    id: "composite",
    index: "",
    title: "Composite",
    label: "Composite",
    start: 32.4,
    hero: 36.6,
    caption: "A composite, not a router.",
    support: "The comparison ships inside the model.",
  },
] as const;

export type FrameLane = {
  id: Lane["id"];
  best: boolean;
  text: string;
  caret: boolean;
  opacity: number;
  dim: number;
  score: number;
  scoreOpacity: number;
  lock: number;
  criteria: Array<Criterion & { shown: number }>;
};

export type Frame = {
  t: number;
  chapter: Chapter;
  promptText: string;
  promptCaret: boolean;
  promptOpacity: number;
  hub: string;
  hubOpacity: number;
  bracket: number;
  lanes: FrameLane[];
  responseShell: number;
  responseText: string;
  responseCaret: boolean;
  responseLive: number;
  beams: { request: number; split: number; ret: number };
  boardOpacity: number;
  captionOpacity: number;
  end: number;
  flash: number;
  mood: number;
  scan: number;
};

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function ramp(t: number, a: number, b: number): number {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
}

export function typed(text: string, amount: number): string {
  const n = Math.round(clamp01(amount) * text.length);
  return text.slice(0, n);
}

export function chapterAt(t: number): Chapter {
  let current: Chapter = CHAPTERS[0];
  for (const chapter of CHAPTERS) {
    if (t >= chapter.start) current = chapter;
  }
  return current;
}

function caret(t: number, amount: number): boolean {
  return amount > 0.02 && amount < 0.995 && Math.sin(t * 9) > 0;
}

function hubLine(t: number): string {
  if (t < 2.2) return "Waiting for one request";
  if (t < 8.2) return "Request accepted";
  if (t < 17) return "4 answers in flight";
  if (t < 26.2) return "Scoring the set";
  if (t < 32.4) return "Sending the winner";
  return "One answer returned";
}

export function frameAt(time: number): Frame {
  const t = Math.min(DURATION, Math.max(0, time));
  const chapter = chapterAt(t);
  const promptAmount = ramp(t, 1.05, 4.35);
  const scoreAmount = ramp(t, 18.1, 22.5);
  const lock = ramp(t, 22.05, 23.25);
  const dimAmount = ramp(t, 22.55, 24.15);
  const responseLive = ramp(t, 26.7, 28.1);
  const responseType = ramp(t, 27.5, 30.5);
  const end = ramp(t, 32.35, 33.9);
  const flashCenter = t - 23.15;
  const flash =
    t > 21.5 && t < 25.4 ? Math.exp(-(flashCenter * flashCenter) / 0.012) : 0;

  const mood =
    t < 8.2
      ? ramp(t, 6.6, 8.2)
      : t < 17
        ? 1 + ramp(t, 15.4, 17)
        : t < 26.2
          ? 2 + ramp(t, 24.6, 26.2)
          : t < 32.4
            ? 3 + ramp(t, 31.1, 32.4)
            : 4;

  const lanes: FrameLane[] = LANES.map((lane, index) => {
    const typeAmount = ramp(t, 9.05 + index * 0.16, 14.4 + (index % 3) * 0.35);
    return {
      id: lane.id,
      best: lane.best,
      text: typed(lane.text, typeAmount),
      caret: caret(t, typeAmount),
      opacity: ramp(t, 8.25 + index * 0.1, 9.05 + index * 0.1),
      dim: lane.best ? 0 : dimAmount,
      score: Math.round(lane.score * scoreAmount),
      scoreOpacity: scoreAmount,
      lock: lane.best ? lock : 0,
      criteria: lane.criteria.map((criterion, criterionIndex) => ({
        ...criterion,
        shown: clamp01((scoreAmount - criterionIndex * 0.18) / 0.45),
      })),
    };
  });

  return {
    t,
    chapter,
    promptText: typed(PROMPT, promptAmount),
    promptCaret: caret(t, promptAmount),
    promptOpacity: ramp(t, 0.45, 1.25),
    hub: hubLine(t),
    hubOpacity: ramp(t, 1.35, 2.25),
    bracket: ramp(t, 6.5, 8.15) * (1 - end * 0.35),
    lanes,
    responseShell: Math.min(1, ramp(t, 1.7, 2.55) * 0.42 + responseLive),
    responseText: typed(WINNER.text, responseType),
    responseCaret: caret(t, responseType),
    responseLive,
    beams: {
      request: ramp(t, 2.15, 3.05) * (1 - ramp(t, 31.4, 32.6) * 0.75),
      split: ramp(t, 8.15, 9.05) * (1 - end),
      ret: ramp(t, 26.25, 27.35) * (1 - end),
    },
    boardOpacity: ramp(t, 0.25, 1.15) * (1 - end * 0.86),
    captionOpacity: ramp(t, 0.15, 0.7) * (1 - ramp(t, 32.2, 33.3)),
    end,
    flash,
    mood,
    scan: ramp(t, 17.2, 21.5),
  };
}

export function formatTime(time: number): string {
  const s = Math.max(0, Math.floor(time));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
