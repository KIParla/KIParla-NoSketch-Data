# KIParla NoSketch Data

This repository mirrors the `corpora/` directory expected by
[`KIParla/NoSketch-Engine-Docker`](https://github.com/KIParla/NoSketch-Engine-Docker)
and remains compatible with
[`ELTE-DH/NoSketch-Engine-Docker`](https://github.com/ELTE-DH/NoSketch-Engine-Docker).

## Directory structure

```
KIParla-NoSketch-Data/
  registry/                one registry file per corpus
  metadata/                Italian-translated metadata per corpus modules
  KIP/ KIPasti/ ... KIParla/
    vertical/source        source vertical file (input to compilation)
    indexed/               compiled corpus index  ← NOT tracked
  translations.tsv         value-level translation table (EN → IT)
```

## Current scope

- `KIP`, `KIPasti`, `ParlaBO`, `ParlaTO`, and the aggregated `KIParla` corpus are currently included.
- Large vertical files are tracked with Git LFS.

## Setup

### 1. Install Docker

Download and install [Docker Desktop](https://www.docker.com/get-started/) for your platform.

### 2. Clone KIParla/NoSketch-Engine-Docker

```bash
git clone https://github.com/KIParla/NoSketch-Engine-Docker.git
cd NoSketch-Engine-Docker
make pull
```

### 3. Copy corpora files

Copy this directory as the `corpora/` directory inside the runtime repo:

```bash
cp -r /path/to/KIParla/KIParla-NoSketch-Data/* NoSketch-Engine-Docker/corpora/
```

## Generating the vertical files

Vertical files are produced from module vert.tsv files using
[`KIParla/tools`](https://github.com/KIParla/tools), specifically
`tsv2vert.py`.
Metadata must be translated to Italian first with `translate_metadata.py` from
the same repository.

Run all commands from the KIParla root directory.

**Single module (example: KIP):**

```bash
# Translate module metadata
python tools/translate_metadata.py \
    --input-dir KIP/metadata \
    --output-dir KIParla-NoSketch-Data/metadata/KIP \
    --translations KIParla-NoSketch-Data/translations.tsv

# Generate vertical file
python tools/tsv2vert.py \
    KIParla-NoSketch-Data/metadata/KIP/conversations.tsv \
    KIParla-NoSketch-Data/metadata/KIP/participants.tsv \
    KIP/tsv/*.vert.tsv > KIParla-NoSketch-Data/KIP/vertical/source
```

**KIParla collection (all modules merged):**

```bash
# Merge metadata
python tools/merge_metadata.py \
    --modules KIP KIPasti ParlaBO ParlaTO ParlaBZ \
    --output-dir /tmp/kiparla-merged

# Translate merged metadata
python tools/translate_metadata.py \
    --input-dir /tmp/kiparla-merged \
    --output-dir KIParla-NoSketch-Data/metadata/KIParla \
    --translations KIParla-NoSketch-Data/translations.tsv

# Generate vertical file
python tools/tsv2vert.py \
    KIParla-NoSketch-Data/metadata/KIParla/conversations.tsv \
    KIParla-NoSketch-Data/metadata/KIParla/participants.tsv \
    KIP/tsv/*.vert.tsv KIPasti/tsv/*.vert.tsv \
    ParlaBO/tsv/*.vert.tsv ParlaTO/tsv/*.vert.tsv \
    ParlaBZ/tsv/*.vert.tsv > KIParla-NoSketch-Data/KIParla/vertical/source
```

## Compiling and running

From inside the `NoSketch-Engine-Docker` directory:

```bash
# Compile all corpora listed in corpora/registry/
make compile

# Or compile a single corpus
make execute CMD="compilecorp --no-ske --recompile-corpus KIP"

# Launch the server
make run
```

Navigate to http://localhost:10070 to use the interface.
