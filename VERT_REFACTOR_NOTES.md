# Vertical Refactor Notes

Questo file tiene traccia dei piccoli cambiamenti introdotti nel branch di refactor del verticale.
Il focus iniziale era il corpus `KIP`, ma ormai le modifiche riguardano tutti i corpora NoSketch e gli script in `KIParla/tools`.

## Obiettivo

Rendere il verticale e i registry:

- piu` semplici
- piu` coerenti con i nomi reali dei metadata
- piu` facili da estendere a moduli con schemi metadata diversi

## Cambiamenti introdotti

### 1. Nuovo script di generazione

File:

- `KIParla/tools/tsv2vert_v2.py`

Differenze principali rispetto a `tsv2vert.py`:

- rimosso il livello `<doc>`
- mantenuto solo il livello `<conversation>`
- rinominato `<annotation>` in `<transcription_unit>`
- aggiunto `token_id` come seconda colonna posizionale nel verticale
- rimosso il marcatore `//` a fine unita`

### 2. `conversation` come doc structure

Nei registry attivi:

- aggiunto `DOCSTRUCTURE conversation`
- `SHORTREF` ora usa `conversation.code`

Questo elimina la dipendenza dal vecchio livello `doc`.

### 3. Boundaries di `transcription_unit`

Nei registry attivi:

- boundary visibile di default con `DISPLAYBEGIN`
- formato attuale: `·[%(participant_code)]·`
- `DISPLAYEND` vuoto

Nota:

- la UI NoSkE tende a mangiare gli spazi, quindi e` stato scelto un separatore visibile

### 4. Token ID

Nel verticale:

- ogni riga token e` ora nel formato `word<TAB>token_id`

Nei registry attivi:

- aggiunto `ATTRIBUTE token_id`

### 5. Attributi guidati dai metadata

Lo script `tsv2vert_v2.py` ora genera gli attributi direttamente a partire dai nomi colonna dei metadata.

Regole attuali:

- `-` viene normalizzato in `_`
- i campi `participants` e gli altri campi con `;` vengono normalizzati a liste separate da `,`
- i metadata del partecipante diventano attributi `participant_*`

Esempi:

- `gender` -> `participant_gender`
- `collection-point` -> `collection_point`
- `birth-region` -> `participant_birth_region`
- `study-level` -> `participant_study_level`

### 6. Registry riallineati ai nuovi nomi

Modifiche gia` applicate:

- `conversation.point` -> `conversation.collection_point`
- `transcription_unit.participant_sex` -> `transcription_unit.participant_gender`
- `files_in_which_participant_appears` rimosso da `transcription_unit`
- `participant_conversations` rimosso da `transcription_unit`

Queste modifiche sono state propagate a:

- `KIP`
- `KIPasti`
- `ParlaBO`
- `ParlaTO`
- `KIParla`

### 7. Link `full_conversation`

Il campo `full_conversation` ora punta agli HTML pubblicati nella repo dedicata `KIParla-artifacts`.

Schema attuale:

- `https://kiparla.github.io/KIParla-artifacts/MODULE/html/CODE.html`

Per il corpus aggregato `KIParla`, `MODULE` non e` `KIParla`: viene derivato automaticamente dal prefisso del codice conversazione (`KIP`, `KIPasti`, `ParlaBO`, `ParlaTO`).

Il campo `full_jefferson` e` stato rimosso.

`audio_file` resta separato e continua a dipendere da `--base-url`.

La nuova generazione supporta quindi:

- `--base-url` per i link runtime del corpus
- `--artifacts-base-url` per i link `full_conversation`
- `--artifacts-module` per forzare il modulo quando serve

### 8. Repo `KIParla-artifacts`

Gli artefatti di pubblicazione non stanno piu` dentro `KIParla-NoSketch-Data/html` ma nella repo separata `KIParla-artifacts`.

Struttura attuale:

- `KIP/html` e `KIP/pdf`
- `KIPasti/html` e `KIPasti/pdf`
- `ParlaBO/html` e `ParlaBO/pdf`
- `ParlaTO/html` e `ParlaTO/pdf`
- `css/` e `js/` condivisi in root

`KIParla` non ha una directory dedicata in `KIParla-artifacts`, perche' non e` un modulo autonomo: i suoi link riusano gli HTML dei moduli reali.

### 9. Script per bozza di registry

File:

- `KIParla/tools/generate_registry_draft.py`

Scopo:

- generare una bozza di registry coerente con gli header di `conversations.tsv` e `participants.tsv`
- evitare hardcoding non validi per moduli diversi

Lo script ora assegna anche label leggibili agli attributi che in NoSkE finivano mostrati come nomi tecnici, ad esempio:

- `conversation.code` -> `Codice conversazione`
- `conversation.full_conversation` -> `Trascrizione completa`
- `transcription_unit.audio_file` -> `Audio`

Esempio:

```bash
python3 tools/generate_registry_draft.py \
  KIPasti \
  KIParla-NoSketch-Data/metadata/KIPasti/conversations.tsv \
  KIParla-NoSketch-Data/metadata/KIPasti/participants.tsv
```

## Stato di compilazione dei corpora aggiornati

I seguenti corpora sono stati rigenerati con `tsv2vert_v2.py` e compilati con successo in NoSketch Engine:

- `KIP`
- `KIPasti`
- `ParlaBO`
- `ParlaTO`
- `KIParla`

Verifiche emerse durante la compilazione:

- il modello `conversation` + `transcription_unit` e` accettato da NoSkE
- `DOCSTRUCTURE conversation` funziona correttamente
- `STRUCTURE g` viene riconosciuta come glue structure
- `token_id` viene indicizzato correttamente come attributo posizionale
- i nomi metadata-driven (`collection_point`, `participant_gender`, ecc.) vengono accettati dal registry e dalla compilazione

Warning ancora presenti:

- `KIP`: `INFOHREF seems to be a broken link`
- `KIPasti`: `INFOHREF seems to be a broken link`

Fin qui non sono emersi warning strutturali bloccanti sui corpora aggiornati.

## Stato attuale dei registry

I registry attivi sono stati aggiornati per mostrare label leggibili nella UI NoSkE invece dei nomi tecnici degli attributi.

Esempi:

- `Codice conversazione`
- `Trascrizione completa`
- `Durata`
- `Argomento`
- `Codice partecipante`
- `Inizio`
- `Fine`
- `Audio`

## Nota sul filtro `participants`

L'attributo `conversation.participants` e` corretto dal punto di vista semantico:

- selezionare `BO016` significa trovare le conversazioni in cui `BO016` partecipa

Pero` NoSkE, con attributi `MULTIVALUE`, mostra sia:

- il valore completo della lista, ad esempio `BO016,BO017,BO018,BO019`
- i singoli valori splittati, ad esempio `BO016`

Questo comportamento dipende da NoSkE/Manatee e non da un errore del verticale.

Per ora il comportamento resta invariato.

## Prossimi passi possibili

- automatizzare la pubblicazione di `KIParla-artifacts`
- aggiungere una procedura batch per rigenerare tutti gli HTML/PDF per modulo
- decidere se introdurre un link separato ai PDF nel verticale o lasciarli solo negli HTML

## TODO HTML / speaker colors

- il parlante `???` dovrebbe usare sempre un grigio scuro fisso
- per gli altri parlanti conviene smettere di inserire colori inline negli HTML
- introdurre variabili CSS tipo `--speaker-1`, `--speaker-2`, ..., `--speaker-10`
- mappare i parlanti a classi o varianti CSS corrispondenti invece di scrivere codici colore nel markup
- questo renderebbe il tema piu` facile da mantenere e da personalizzare
