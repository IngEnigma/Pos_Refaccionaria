# Graph Report - manual  (2026-11-15)

## Corpus Check
- 3 files · ~14,019 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 17 nodes · 16 edges · 3 communities (2 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb7b57b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- capturar.mjs
- generar-pdf.mjs
- seed_demo.py

## God Nodes (most connected - your core abstractions)
1. `shot()` - 2 edges
2. `settle()` - 2 edges
3. `paso()` - 2 edges
4. `ir()` - 2 edges
5. `IMG` - 1 edges
6. `dir` - 1 edges
7. `[entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf']` - 1 edges
8. `salida` - 1 edges
9. `opciones` - 1 edges
10. `paginas` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (3 total, 1 thin omitted)

### Community 0 - "capturar.mjs"
Cohesion: 0.38
Nodes (5): IMG, ir(), paso(), settle(), shot()

### Community 1 - "generar-pdf.mjs"
Cohesion: 0.29
Nodes (6): dir, [entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf'], numeros, opciones, paginas, salida

## Knowledge Gaps
- **7 isolated node(s):** `IMG`, `dir`, `[entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf']`, `salida`, `opciones` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `IMG`, `dir`, `[entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf']` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._