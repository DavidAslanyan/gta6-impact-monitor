# GTA VI Global Impact Monitor

A live public dashboard that tracks real-world indicators (economy, markets, internet, energy, mobility, gaming, tech) from before and after the launch of Grand Theft Auto VI, so viewers can see what changed around the world while everyone stopped to play.

## Time

**Launch Moment**:
One of three reference instants when GTA VI unlocks in a major region: New Zealand (the first unlock anywhere), Europe, and the United States.
_Avoid_: Release, drop, go-live

**T0**:
The New Zealand Launch Moment: the first unlock anywhere, and the instant the dashboard's "time since launch" clock counts from.
_Avoid_: Launch day, day zero

**Home Region**:
The region (Oceania, Europe or the Americas/global) whose Launch Moment applies to a Signal.
_Avoid_: Market, zone, locale

**Baseline**:
The data a Signal recorded before its Home Region's Launch Moment (up to four weeks, matched by weekday and hour where available) that every after-launch value is measured against.
_Avoid_: Normal, average, control

**Delta**:
How far a current value is from its Baseline, shown as a percentage.
_Avoid_: Change, impact, effect size

## Signals

**Signal**:
One real, sourced, time-stamped measurement series shown on the dashboard (for example, Steam concurrent players for one game).
_Avoid_: Metric, KPI, feed, stat

**Cause Signal**:
A Signal that directly measures attention to GTA VI itself, such as pageviews of its Wikipedia article.
_Avoid_: Hype metric, GTA metric

**Effect Signal**:
A Signal about the wider world that does not mention GTA VI, such as electricity demand, commuting, other games' player counts, developer activity, or markets.
_Avoid_: Impact metric, indirect metric

**Control Signal**:
A Signal that is not expected to move because of the launch, such as weather or weekly jobless claims; it shows what ordinary noise looks like next to the Effect Signals.
_Avoid_: Baseline signal, reference metric

**Snapshot**:
One reading of a Signal at a moment, recorded by us because its source keeps no history of its own.
_Avoid_: Sample, scrape, poll

**Anomaly**:
A moment when a Signal's Delta is unusually large compared with how much it normally varies during the Baseline; Anomalies are what fill the "What happened" timeline.
_Avoid_: Spike, alert, event

**Calendar Effect**:
A known date that moves Signals on its own, such as a weekend, US Thanksgiving or Black Friday; charts shade it so it isn't mistaken for a launch effect.
_Avoid_: Holiday, confound

**Estimated Loss**:
The headline running total of global productivity lost, calculated from a stated formula with adjustable inputs; it is a model estimate, not a measurement.
_Avoid_: Economic damage, real loss, GDP loss
