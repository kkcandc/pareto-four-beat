# Four beats

A silent, scrubbable explainer of the mental model behind **Pareto 26.10 Preview**: one request goes in, several models answer in parallel, the best answer is kept, and that answer is what comes back.

This is a personal educational demo by Kenny Kline, in the `kkcandc` repo. It is not an official Unbiased product page, and it does not speak for Unbiased or OpenRouter.

## The four beats

1. **Request.** You send one prompt to a single model id, `pareto-26.10-preview`.
2. **Parallel.** Several models write answers at the same time, inside that one API response.
3. **Select.** The answers are evaluated and the best one is kept. The lanes, scores, and rubric in this film are stand-ins so the shape is visible. They are not a published roster or a claim about the real scoring rubric.
4. **Return.** One answer comes back. The other drafts stay inside the call.

The end card is the point of the film: **a composite, not a router.** A router chooses one model and then asks. A composite asks once, lets several answers happen, and returns the best.

OpenRouter lists Pareto 26.10 Preview at **$0.80 / M input** and **$3.20 / M output**. The earlier Pareto listing was $2.50 / $7.50. Those figures are taken from public posts, not from a private price sheet.

## Watch it

The page is a short film with a clock. Everything on screen is driven by that clock, so scrubbing lands on a real frame instead of a separate animation.

- Play and pause
- Drag the timeline
- Replay from the start
- Jump to a beat: Request, Parallel, Select, Return, Composite
- Keyboard: Space or K plays, R replays, arrows seek, Home and End jump

There is no narration and no audio. The captions are the script.

If the browser asks for reduced motion, the film stays paused and the chapter buttons step through a readable frame of each beat.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys. No paid APIs. The stand-in answers are written into the page.

## Sources

- Santiago, on the four-step shape of `pareto-26.10-preview`: https://x.com/svpino/status/2105664829277233594
- OpenRouter, on the Pareto 26.10 Preview listing: https://x.com/OpenRouter/status/2105661806186500286

## Deploy

Live site: https://pareto-four-beat.vercel.app

The Vercel project is `pareto-four-beat` on Kenny Kline’s personal team (`kenny-klines-projects`), connected to this `kkcandc/pareto-four-beat` repo. Do not publish it under an Unbiased team or as an official product surface.
