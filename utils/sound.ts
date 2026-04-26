"use client";

import { auth, db } from "./firebase/client";
import { doc, onSnapshot } from "firebase/firestore";

export enum SoundType {
  SUCCESS = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  CLICK = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  POP = "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
  MOOD = "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
}

let soundEnabled = true;

// Initialize listener to follow user preference
if (typeof window !== "undefined") {
  auth.onAuthStateChanged((user) => {
    if (user) {
      onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          soundEnabled = docSnap.data().sound !== false;
        }
      });
    }
  });
}

export const playSound = (type: SoundType) => {
  if (!soundEnabled) return;

  try {
    const audio = new Audio(type);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked by browser policy. Interaction required first.", e));
  } catch (error) {
    console.error("Sound playback error:", error);
  }
};
