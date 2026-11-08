"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const SAMPLE_RATE = 16000;
const MODELO = "Xenova/whisper-base";

/** @type {Promise<unknown>|null} */
let transcriberPromise = null;

/** @returns {Promise<typeof import('@xenova/transformers')>} */
async function carregarTransformers() {
  return import("@xenova/transformers");
}

/**
 * @param {string} idioma
 * @returns {string}
 */
function idiomaParaWhisper(idioma) {
  const mapa = {
    pt: "portuguese",
    en: "english",
    es: "spanish",
    fr: "french",
    de: "german",
    it: "italian",
  };
  const chave = String(idioma || "pt").toLowerCase().slice(0, 2);
  return mapa[chave] || "portuguese";
}

/**
 * @returns {Promise<unknown>}
 */
async function obterTranscriber() {
  if (!transcriberPromise) {
    const { pipeline } = await carregarTransformers();
    transcriberPromise = pipeline("automatic-speech-recognition", MODELO);
  }
  return transcriberPromise;
}

/**
 * @param {{ buffer?: Buffer|Uint8Array, caminhoArquivo?: string }} entrada
 * @returns {Promise<Float32Array>}
 */
async function carregarAudio(entrada) {
  const { read_audio } = await carregarTransformers();

  if (entrada.caminhoArquivo) {
    const caminho = String(entrada.caminhoArquivo);
    if (!fs.existsSync(caminho)) {
      throw new Error("Arquivo de áudio não encontrado.");
    }
    return read_audio(caminho, SAMPLE_RATE);
  }

  const buf = Buffer.from(entrada.buffer);
  const tmpPath = path.join(os.tmpdir(), `cybhor-whisper-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpPath, buf);
    return await read_audio(tmpPath, SAMPLE_RATE);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Transcreve áudio com Whisper (base), localmente via Transformers.js.
 * @param {{ buffer?: Buffer|Uint8Array, caminhoArquivo?: string, idioma?: string }} opts
 * @returns {Promise<{ texto: string, duracaoMs: number }>}
 */
async function transcrever(opts = {}) {
  const { buffer, caminhoArquivo, idioma = "pt" } = opts;
  const temBuffer =
    buffer != null &&
    (Buffer.isBuffer(buffer) || buffer instanceof Uint8Array);
  const temArquivo =
    typeof caminhoArquivo === "string" && caminhoArquivo.trim().length > 0;

  if (!temBuffer && !temArquivo) {
    throw new Error(
      "Informe buffer (Buffer ou Uint8Array) ou caminhoArquivo com o áudio."
    );
  }
  if (buffer != null && !temBuffer) {
    throw new Error("buffer deve ser Buffer ou Uint8Array.");
  }

  const transcriber = await obterTranscriber();
  const audio = await carregarAudio({ buffer, caminhoArquivo });
  const duracaoMs = Math.round((audio.length / SAMPLE_RATE) * 1000);
  const language = idiomaParaWhisper(idioma);

  const resultado = await transcriber(audio, {
    language,
    task: "transcribe",
    return_timestamps: false,
  });

  const texto = String(
    (resultado && resultado.text) || resultado || ""
  ).trim();

  return { texto, duracaoMs };
}

module.exports = {
  transcrever,
};
