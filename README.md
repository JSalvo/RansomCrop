# ransom_crop

Rails Engine per ritagliare porzioni di un'immagine tramite riquadri colorati trascinabili e ridimensionabili, e scaricarle in un file zip.

- Carichi un'immagine (jpg, png, webp).
- Definisci n porzioni, ciascuna con nome e colore.
- Le porzioni appaiono come riquadri semitrasparenti sopra l'immagine: li trascini e li ridimensioni.
- Un pulsante ritaglia le porzioni e scarica uno zip con i ritagli e un file `regions.json`.
- Puoi ricreare le regioni incollando un JSON nello stesso formato di `regions.json`.

Funziona come componente incorporato in una pagina dell'app host (Turbo Frame), non come pagina intera. Solo JavaScript vanilla, Turbo e Stimulus: nessuna libreria esterna.

## Requisiti

- Ruby >= 3.1
- Rails >= 7.0
- Importmap, Turbo e Stimulus nell'app host
- [libvips](https://www.libvips.org/) installato sul server (usato da `image_processing`)

Dipendenze della gem: `image_processing`, `rubyzip` (>= 2.3).

## Installazione

Nel `Gemfile` dell'app host:

```ruby
gem "ransom_crop"
```

```bash
bundle install
```

## Configurazione

### 1. Monta l'Engine

In `config/routes.rb`:

```ruby
mount RansomCrop::Engine => "/ransom_crop"
```

### 2. Registra il controller Stimulus

In `app/javascript/controllers/index.js`:

```javascript
import RansomCropController from "ransom_crop/controllers/ransom_crop_controller"
application.register("ransom-crop", RansomCropController)
```

Il pin importmap è registrato dall'Engine: **non** aggiungere pin per la gem in `config/importmap.rb`.

### 3. Includi il CSS

Nel `<head>` del layout dell'host:

```erb
<%= stylesheet_link_tag "ransom_crop/ransom_crop" %>
```

Va messo nel layout e non dentro il frame, perché i `<link>` caricati in un Turbo Frame non sono affidabili.

### 4. Incorpora il componente

Nella pagina dove vuoi l'editor:

```erb
<%= turbo_frame_tag "ransom_crop", src: "/ransom_crop" %>
```

### 5. Riavvia il server

Dopo ogni modifica a pin, Engine o Gemfile il server in esecuzione continua a servire l'importmap vecchio.

## Uso

1. Carica un'immagine.
2. Scrivi un nome, scegli un colore e premi **Aggiungi porzione**.
3. Trascina il riquadro per spostarlo, usa il quadratino in basso a destra per ridimensionarlo, usa **×** per rimuoverlo.
4. Il campo percentuale scala immagine e riquadri (10–400%). L'export è sempre al 100%.
5. **Ritaglia e scarica zip** scarica uno zip con un'immagine per porzione più `regions.json`.

## Formato JSON

Le coordinate sono in pixel dell'immagine originale.

```json
[
  {
    "name": "intestazione",
    "color": "#ff0000",
    "x": 40,
    "y": 20,
    "width": 300,
    "height": 120
  }
]
```

Incolla un JSON di questo tipo nel campo di testo e premi **Carica JSON**: le regioni vengono create sull'immagine e si aggiungono a quelle già presenti. Un `color` non valido (diverso da `#rrggbb`) diventa `#ff0000`.

## Valore JSON predefinito

Per popolare il campo JSON all'apertura, passa `default_json` nella `src` del frame:

```erb
<%= turbo_frame_tag "ransom_crop",
      src: "/ransom_crop?default_json=#{ERB::Util.url_encode(@mio_json)}" %>
```

Il parametro viene propagato dopo l'upload e letto dal controller Stimulus tramite l'attributo `data-ransom-crop-default-json-value`.

## Personalizzare lo stile

Tutte le classi del CSS hanno prefisso `ransom-crop-` e usano variabili `--rc-*`. Puoi sovrascriverle nel CSS dell'host.

## Note

- Le immagini caricate sono salvate in `tmp/ransom_crop/` con un nome casuale. Non vengono eliminate automaticamente: pianifica una pulizia periodica.
- Sono accettate solo le estensioni `.jpg`, `.jpeg`, `.png`, `.webp`.
- Le coordinate ricevute dal client sono limitate ai bordi dell'immagine.
- Il controller delle view dell'Engine non applica il layout dell'host (`layout false`).

## Risoluzione problemi

| Sintomo | Causa probabile |
|---|---|
| `Failed to resolve module specifier "ransom_crop/..."` | Nell'host c'è un pin con lo stesso nome e `to:` inesistente, oppure il server non è stato riavviato. |
| `Importmap skipped missing path` nel log | Pin errato nell'host: rimuovilo. |
| Il CSS non viene applicato | Manca `stylesheet_link_tag "ransom_crop/ransom_crop"` nel layout dell'host. |
| Nessuna porzione compare | Il controller non è registrato in `controllers/index.js`. |

Verifica che il pin sia caricato:

```bash
bin/rails runner 'puts Rails.application.importmap.packages.keys.grep(/ransom/).inspect'
```

## Sviluppo

```bash
git clone https://github.com/JSalvo/ransom_crop.git
cd ransom_crop
bundle install
```

Per provarla in locale in un'app Rails esistente:

```ruby
gem "ransom_crop", path: "../ransom_crop"
```

## Contribuire

Issue e pull request sono benvenute su <https://github.com/JSalvo/ransom_crop>.

## Licenza

Rilasciata con licenza [MIT](LICENSE.txt).
