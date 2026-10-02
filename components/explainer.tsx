"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Atmosphere } from "./atmosphere";
import { Grain } from "./grain";
import { curveBetween, paintBeams, type Anchor, type Beam } from "@/lib/paint";
import {
  CHAPTERS,
  DURATION,
  PRICE,
  WINNER,
  type Chapter,
  formatTime,
  frameAt,
} from "@/lib/timeline";

const LANE_COLOR: Record<string, string> = {
  A: "#9eb4c4",
  B: "#e6c27a",
  C: "#b7a6d6",
  D: "#d09a8d",
};

function readAnchor(board: HTMLElement, name: string): Anchor | null {
  const node = board.querySelector<HTMLElement>(`[data-anchor="${name}"]`);
  if (!node) return null;
  const boardRect = board.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return {
    cx: rect.left - boardRect.left + rect.width / 2,
    cy: rect.top - boardRect.top + rect.height / 2,
    left: rect.left - boardRect.left,
    right: rect.right - boardRect.left,
    top: rect.top - boardRect.top,
    bottom: rect.bottom - boardRect.top,
  };
}

export function Explainer() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [announcement, setAnnouncement] = useState(
    `${CHAPTERS[0].title}. ${CHAPTERS[0].caption} ${CHAPTERS[0].support}`,
  );
  const timeRef = useRef(0);
  const playingRef = useRef(true);
  const resumeRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<() => void>(() => {});
  const frame = frameAt(time);

  const seek = useCallback((next: number) => {
    const clamped = Math.min(DURATION, Math.max(0, next));
    timeRef.current = clamped;
    if (clamped >= DURATION) {
      playingRef.current = false;
      setPlaying(false);
    }
    setTime(clamped);
  }, []);

  const toggle = useCallback(() => {
    if (timeRef.current >= DURATION) {
      timeRef.current = 0;
      playingRef.current = true;
      setPlaying(true);
      setTime(0);
      return;
    }
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, []);

  const replay = useCallback(() => {
    timeRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    setTime(0);
  }, []);

  const pauseAt = useCallback(
    (next: number) => {
      playingRef.current = false;
      setPlaying(false);
      seek(next);
    },
    [seek],
  );

  const setScrubbing = useCallback((active: boolean) => {
    if (active) {
      resumeRef.current = playingRef.current;
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    if (resumeRef.current && timeRef.current < DURATION - 0.05) {
      playingRef.current = true;
      setPlaying(true);
    }
    resumeRef.current = false;
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      playingRef.current = false;
      timeRef.current = CHAPTERS[0].hero;
      setReduced(true);
      setPlaying(false);
      setTime(CHAPTERS[0].hero);
    }

    let raf = 0;
    let last = performance.now();
    let resumeAfterHide = false;
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playingRef.current) {
        timeRef.current = Math.min(DURATION, timeRef.current + delta);
        if (timeRef.current >= DURATION) {
          timeRef.current = DURATION;
          playingRef.current = false;
          setPlaying(false);
        }
        setTime(timeRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        resumeAfterHide = playingRef.current;
        playingRef.current = false;
        setPlaying(false);
      } else if (resumeAfterHide && timeRef.current < DURATION) {
        playingRef.current = true;
        setPlaying(true);
        resumeAfterHide = false;
      }
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const chapter = CHAPTERS.find((item) => item.id === frame.chapter.id) ?? CHAPTERS[0];
    setAnnouncement(`${chapter.title}. ${chapter.caption} ${chapter.support}`);
  }, [frame.chapter.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if ((event.key === " " || event.key === "k") && tag !== "BUTTON") {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.key === "r" && !typing) {
        event.preventDefault();
        replay();
        return;
      }
      if (typing) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(timeRef.current + (event.shiftKey ? 2 : 0.5));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(timeRef.current - (event.shiftKey ? 2 : 0.5));
      } else if (event.key === "Home") {
        event.preventDefault();
        seek(0);
      } else if (event.key === "End") {
        event.preventDefault();
        seek(DURATION);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replay, seek, toggle]);

  useEffect(() => {
    const canvas = beamRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const paint = () => {
      const rect = board.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const pixelWidth = Math.floor(width * dpr);
      const pixelHeight = Math.floor(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const current = frameAt(timeRef.current);
      const prompt = readAnchor(board, "prompt");
      const hub = readAnchor(board, "hub");
      const response = readAnchor(board, "response");
      const beams: Beam[] = [];
      const push = (
        from: Anchor | null,
        to: Anchor | null,
        color: string,
        strength: number,
        widthPx: number,
      ) => {
        if (!from || !to) return;
        const curve = curveBetween(from, to);
        if (!curve) return;
        beams.push({ curve, color, strength, width: widthPx });
      };
      push(prompt, hub, "#8de4ff", current.beams.request, 1.6);
      for (const lane of current.lanes) {
        const anchor = readAnchor(board, `lane-${lane.id}`);
        const fade = lane.best ? 1 : 1 - lane.dim * 0.75;
        push(
          hub,
          anchor,
          LANE_COLOR[lane.id] ?? "#d5d0c6",
          current.beams.split * fade * lane.opacity,
          lane.best ? 1.8 : 1.25,
        );
      }
      push(readAnchor(board, "lane-B"), response, "#e6c27a", current.beams.ret, 2);
      paintBeams(context, width, height, beams, current.t);
    };

    paintRef.current = paint;
    paint();
    const observer = new ResizeObserver(() => paintRef.current());
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    paintRef.current();
  }, [time]);

  const settled = frame.end > 0.72;

  return (
    <div className="shell">
      <Atmosphere mood={frame.mood} />
      <Grain />
      <div className="flash" style={{ opacity: frame.flash * 0.2 }} aria-hidden="true" />
      <div className="content">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">Four beats</span>
            <span className="brand-sub">Pareto 26.10 Preview</span>
          </div>
          <p className="demo-pill">Personal educational demo · not an Unbiased product</p>
        </header>

        <main className="stage">
          <div className="caption-row" style={{ opacity: frame.captionOpacity }} aria-hidden={settled}>
            <div>
              <p className="index">
                {frame.chapter.index ? <span>{frame.chapter.index}</span> : null}
                <span>{frame.chapter.title}</span>
              </p>
              <h1>{frame.chapter.caption}</h1>
              <p className="support">{frame.chapter.support}</p>
            </div>
            <p className="silent">Silent on purpose. The picture carries it.</p>
          </div>

          <div className="stack">
            <div className="board" ref={boardRef} style={{ opacity: frame.boardOpacity }} aria-hidden={settled}>
              <canvas ref={beamRef} className="beams" aria-hidden="true" />
              <div className="flow">
                <article className="card prompt" data-anchor="prompt" style={{ opacity: frame.promptOpacity }}>
                  <header>
                    <span>In</span>
                    <em>You</em>
                  </header>
                  <p>
                    {frame.promptText}
                    {frame.promptCaret ? <i className="caret" /> : null}
                  </p>
                </article>

                <section
                  className="chamber"
                  style={{ ["--bracket" as string]: frame.bracket }}
                >
                  <div className="chamber-label" style={{ opacity: frame.bracket }}>
                    Inside one API response
                  </div>
                  <article className="card hub" data-anchor="hub" style={{ opacity: frame.hubOpacity }}>
                    <header>
                      <span
                        className="dot"
                        style={{ transform: `scale(${1 + Math.sin(time * 4) * 0.08})` }}
                      />
                      <em>pareto-26.10-preview</em>
                    </header>
                    <p>{frame.hub}</p>
                  </article>
                  <div className="lanes">
                    <div
                      className="scan"
                      style={{
                        opacity: frame.scan > 0.02 && frame.scan < 0.995 && frame.lanes[0].dim < 0.85 ? 0.9 : 0,
                        left: `${frame.scan * 100}%`,
                      }}
                      aria-hidden="true"
                    />
                    {frame.lanes.map((lane) => (
                      <article
                        key={lane.id}
                        className={lane.best ? "card lane is-best" : "card lane"}
                        data-anchor={`lane-${lane.id}`}
                        style={{
                          opacity: lane.opacity * (1 - lane.dim * 0.62),
                          borderColor: lane.best
                            ? `rgba(230, 194, 122, ${0.22 + lane.lock * 0.78})`
                            : undefined,
                          boxShadow: lane.best
                            ? `0 0 0 1px rgba(230, 194, 122, ${lane.lock}), 0 18px 50px rgba(230, 194, 122, ${0.16 * lane.lock})`
                            : undefined,
                        }}
                      >
                        <header>
                          <Mark id={lane.id} />
                          <span>Lane {lane.id}</span>
                          {lane.best ? (
                            <em
                              className="stamp"
                              style={{
                                opacity: lane.lock,
                                transform: `rotate(-8deg) scale(${0.86 + lane.lock * 0.14})`,
                              }}
                            >
                              Selected
                            </em>
                          ) : null}
                        </header>
                        <p>
                          {lane.text}
                          {lane.caret ? <i className="caret" /> : null}
                        </p>
                        <footer style={{ opacity: lane.scoreOpacity }}>
                          <div className="pips">
                            {lane.criteria.map((criterion) => (
                              <span
                                key={criterion.label}
                                className={criterion.on ? "pip on" : "pip"}
                                style={{ opacity: 0.28 + criterion.shown * 0.72 }}
                              >
                                <i />
                                {criterion.label}
                              </span>
                            ))}
                          </div>
                          <strong>{lane.score}</strong>
                        </footer>
                      </article>
                    ))}
                  </div>
                </section>

                <article
                  className="card response"
                  data-anchor="response"
                  data-live={frame.responseLive > 0.6 ? "true" : "false"}
                  style={{ opacity: frame.responseShell }}
                >
                  <header>
                    <span>Out</span>
                    <em>pareto-26.10-preview</em>
                  </header>
                  <p>
                    {frame.responseLive > 0.35 ? (
                      <>
                        {frame.responseText}
                        {frame.responseCaret ? <i className="caret" /> : null}
                      </>
                    ) : (
                      <span className="waiting">The answer returns here.</span>
                    )}
                  </p>
                  <footer style={{ opacity: frame.responseLive }}>
                    <span>200</span>
                    <span>Lane {WINNER.id}</span>
                  </footer>
                </article>
              </div>
            </div>

            <section className="endcard" style={{ opacity: frame.end }} aria-hidden={frame.end < 0.45}>
              <p className="eyebrow">Personal educational demo</p>
              <h2>
                <span>A composite,</span>
                <span className="quiet-line">not a router.</span>
              </h2>
              <p className="lede">
                One call runs several models, keeps the strongest answer, and returns only that. The
                judging ships inside the model.
              </p>
              <div className="contrast">
                <div>
                  <span>Router</span>
                  <p>Choose a model, then ask it.</p>
                </div>
                <div className="hot">
                  <span>Composite</span>
                  <p>Ask once. Several answer. The best comes back.</p>
                </div>
              </div>
              <div className="prices">
                <div>
                  <b>{PRICE.input}</b>
                  <span>per million input tokens</span>
                </div>
                <div>
                  <b>{PRICE.output}</b>
                  <span>per million output tokens</span>
                </div>
              </div>
              <p className="fine">
                OpenRouter lists these rates for Pareto 26.10 Preview from Unbiased. The earlier Pareto
                listing was {PRICE.prior}. This page is not an official Unbiased product.
              </p>
            </section>
          </div>
        </main>

        <p className="sources">
          Inspired by public posts from{" "}
          <a href="https://x.com/svpino/status/2105664829277233594">Santiago</a> and{" "}
          <a href="https://x.com/OpenRouter/status/2105661806186500286">OpenRouter</a>. Made by Kenny
          Kline. Stand-in answers only.
        </p>

        <Transport
          time={time}
          playing={playing}
          ended={time >= DURATION}
          chapterId={frame.chapter.id}
          reduced={reduced}
          onToggle={toggle}
          onReplay={replay}
          onSeek={seek}
          onScrub={setScrubbing}
          onChapter={(chapter) => pauseAt(chapter.hero)}
        />
        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>
      </div>
    </div>
  );
}

function Mark({ id }: { id: string }) {
  if (id === "A") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (id === "B") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.6 13.6 5v6L8 14.4 2.4 11V5Z" fill="currentColor" />
      </svg>
    );
  }
  if (id === "C") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.2 14 13.2H2Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Transport({
  time,
  playing,
  ended,
  chapterId,
  reduced,
  onToggle,
  onReplay,
  onSeek,
  onScrub,
  onChapter,
}: {
  time: number;
  playing: boolean;
  ended: boolean;
  chapterId: string;
  reduced: boolean;
  onToggle: () => void;
  onReplay: () => void;
  onSeek: (time: number) => void;
  onScrub: (active: boolean) => void;
  onChapter: (chapter: Chapter) => void;
}) {
  const label = CHAPTERS.find((chapter) => chapter.id === chapterId)?.label ?? "Request";

  return (
    <div className="transport">
      <div className="controls">
        <button
          type="button"
          className="iconbtn"
          onClick={onToggle}
          aria-label={playing ? "Pause" : ended ? "Play from the start" : "Play"}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.5h2.4v11H4zM9.6 2.5H12v11H9.6z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.2 2.6v10.8L13.2 8z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="iconbtn"
          onClick={onReplay}
          aria-label="Replay from the start"
          data-ended={ended ? "true" : "false"}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 2.4a5.6 5.6 0 1 1-4.7 2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M3.1 2.2v3.2h3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="scrub">
        <div className="rail" />
        <div className="fill" style={{ width: `${(time / DURATION) * 100}%` }} />
        {CHAPTERS.map((chapter) => (
          <span
            key={chapter.id}
            className="tick"
            style={{ left: `${(chapter.start / DURATION) * 100}%` }}
            data-on={chapter.id === chapterId ? "true" : "false"}
            aria-hidden="true"
          />
        ))}
        <input
          className="range"
          type="range"
          min={0}
          max={DURATION}
          step={0.01}
          value={time}
          aria-label="Scrub the explainer"
          aria-valuetext={`${label}, ${formatTime(time)}`}
          onPointerDown={() => onScrub(true)}
          onPointerUp={() => onScrub(false)}
          onPointerCancel={() => onScrub(false)}
          onBlur={() => onScrub(false)}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>

      <time dateTime={`PT${Math.floor(time)}S`}>
        {formatTime(time)} <span>/ {formatTime(DURATION)}</span>
      </time>

      <div className="chapters">
        {CHAPTERS.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            aria-current={chapter.id === chapterId ? "true" : undefined}
            onClick={() => onChapter(chapter)}
          >
            {chapter.label}
          </button>
        ))}
      </div>
      <p className="keys">
        {reduced ? "Reduced motion. Step with the chapter buttons." : "Space plays. Drag the line. R replays."}
      </p>
    </div>
  );
}
