/**
 * Web Speech API wrapper — voice input for the meal description field.
 *
 * SpeechRecognition is available on Chromium/Safari (with vendor prefix) but
 * not Firefox. The hook degrades gracefully via `isSupported`.
 *
 * Exports: createRecognition, isSupported
 */

/** @description True when the running browser exposes a Speech Recognition API. */
export function isSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * @typedef {object} RecognitionController
 * @property {() => void} start
 * @property {() => void} stop
 * @property {() => void} abort
 */

/**
 * @description Create a configured pt-BR SpeechRecognition instance. The
 *   returned controller forwards lifecycle calls; `onResult` fires on every
 *   interim transcript so the textarea can stream-update as the user speaks.
 * @param {object} cb
 * @param {(transcript: string, isFinal: boolean) => void} cb.onResult
 * @param {() => void} [cb.onEnd]
 * @param {(err: string) => void} [cb.onError]
 * @returns {RecognitionController | null} null if unsupported
 */
export function createRecognition({ onResult, onEnd, onError }) {
  if (!isSupported()) return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = 'pt-BR';
  // Interim results give the streaming-transcript UX users expect from voice.
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    onResult(transcript.trim(), isFinal);
  };
  rec.onend = () => onEnd?.();
  rec.onerror = (e) => onError?.(e.error || 'speech_error');

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}
