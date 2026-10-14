import { useCallback, useEffect, useRef, useState } from "react";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/**
 * Dictado por voz con el reconocimiento del navegador (gratis, sin servidor).
 * Funciona en Chrome / Edge (PC y Android) y Safari reciente. En Firefox no existe.
 */
export function useDictado({ onFinal } = {}) {
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => recRef.current?.abort(), []);

  const iniciar = useCallback(() => {
    if (!SR) return;
    setError("");
    setParcial("");
    finalRef.current = "";

    const rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let fin = "";
      let interino = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t;
        else interino += t;
      }
      finalRef.current = fin;
      setParcial((fin + " " + interino).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Tenés que permitir el micrófono en el navegador.");
      } else if (e.error === "no-speech") {
        setError("No te escuché. Probá de nuevo más cerca del micrófono.");
      } else if (e.error === "network") {
        setError("Este navegador no puede usar el dictado (pasa en Brave, Opera o con VPN). Usá Chrome o escribí la frase abajo.");
      } else if (e.error === "audio-capture") {
        setError("No se encontró un micrófono.");
      } else if (e.error !== "aborted") {
        setError("No se pudo usar el micrófono (" + e.error + ").");
      }
    };
    rec.onend = () => {
      setEscuchando(false);
      const texto = finalRef.current.trim();
      if (texto) onFinalRef.current?.(texto);
    };

    recRef.current = rec;
    setEscuchando(true);
    rec.start();
  }, []);

  const detener = useCallback(() => recRef.current?.stop(), []);

  return { soportado: !!SR, escuchando, parcial, error, iniciar, detener };
}
