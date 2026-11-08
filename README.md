# cybhor-whisper-stt

Transcrição de fala (**STT**) local com [Whisper](https://github.com/openai/whisper) via [`@xenova/transformers`](https://github.com/xenova/transformers.js), pensada para uso no **CybhorPDV** (Electron/Node).

## Instalação

No diretório do pacote:

```bash
npm install
```

Ou como dependência local no app:

```json
"dependencies": {
  "cybhor-whisper-stt": "file:./electron/stt"
}
```

## Uso

```javascript
const { transcrever } = require("cybhor-whisper-stt");

// Por caminho de arquivo
const { texto, duracaoMs } = await transcrever({
  caminhoArquivo: "/caminho/para/audio.wav",
  idioma: "pt", // padrão: pt
});

// Por buffer
const fs = require("fs");
const buffer = fs.readFileSync("gravacao.wav");
const out = await transcrever({ buffer, idioma: "pt" });
console.log(out.texto, out.duracaoMs);
```

Parâmetros de `transcrever`:

| Campo | Descrição |
|--------|-----------|
| `caminhoArquivo` | Caminho no disco para o arquivo de áudio |
| `buffer` | `Buffer` ou `Uint8Array` com o conteúdo do arquivo |
| `idioma` | Código curto (`pt`, `en`, …); padrão `pt` |

É obrigatório informar **`caminhoArquivo`** ou **`buffer`**. Caso contrário a função lança um erro claro.

## Primeira execução (download do modelo)

Na **primeira** transcrição, o pacote baixa automaticamente o modelo `Xenova/whisper-base` (centenas de MB) e guarda o cache em `node_modules/.cache` ou no diretório padrão do Transformers.js. Isso pode levar alguns minutos conforme a conexão. As execuções seguintes reutilizam o cache.

## Formatos de áudio

O decoder usa a pilha do Transformers.js no Node. **WAV (PCM)** é o formato mais confiável. MP3, OGG e outros costumam funcionar, mas dependem do ambiente; em dúvida, converta para **WAV mono 16 kHz** antes de enviar.

## Licença

MIT — ver repositório [PhCybhor/cybhor-whisper-stt](https://github.com/PhCybhor/cybhor-whisper-stt).
