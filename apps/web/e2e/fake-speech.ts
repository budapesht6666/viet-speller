/**
 * Заглушка SpeechRecognition для e2e — ведёт себя как iPhone по замеру
 * этапа 0: сессия, начатая не из обработчика касания, глухая. Что
 * «сказать», тест кладёт в window.__say до касания «Сказать».
 */

export const fakeSpeech = () => {
  const w = window as unknown as Record<string, unknown>;
  let inGesture = false;
  addEventListener('click', () => {
    inGesture = true;
    setTimeout(() => (inGesture = false), 0);
  }, true);
  w.__sessions = 0;
  w.__deaf = 0;
  class FakeSR {
    onstart: ((e: unknown) => void) | null = null;
    onend: ((e: unknown) => void) | null = null;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    private alive = false;
    start() {
      const deaf = !inGesture;
      (w.__sessions as number)++;
      if (deaf) (w.__deaf as number)++;
      this.alive = true;
      setTimeout(() => this.onstart?.({}), deaf ? 5 : 200);
      if (deaf) return;
      const text = String(w.__say ?? '');
      setTimeout(() => this.emit(text, false), 500);
      setTimeout(() => this.emit(text, true), 900);
    }
    private emit(text: string, isFinal: boolean) {
      if (!this.alive) return;
      const result = Object.assign([{ transcript: text, confidence: isFinal ? 0.9 : 0 }], { isFinal });
      this.onresult?.({ resultIndex: 0, results: [result] });
    }
    stop() {
      if (!this.alive) return;
      this.alive = false;
      setTimeout(() => this.onend?.({}), 20);
    }
    abort() {
      this.stop();
    }
  }
  w.SpeechRecognition = FakeSR;
  w.webkitSpeechRecognition = FakeSR;
};
