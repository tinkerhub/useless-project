"use client";

import { useLiveCreatures } from "./live-creatures";
import CreatureSwarm from "./creature-swarm";

export default function LiveCreatureSwarm() {
  const creatures = useLiveCreatures();
  return <CreatureSwarm creatures={creatures} />;
}
