# Latin America Election Atlas

Public project: https://atlas.blakeoxford.com. Explore national elections, historical voting blocs, constituency results where available, and country context across 23 countries.

## Build

Requires Node 22.18+ and Python 3.

```sh
npm ci
npm test
npm run dev
```

[Deployment, testing and rollback](managed/README.md) · [Homepage UX review](managed/HOME-UX-REVIEW.md)

The canonical deploy builds static assets and the read-only MCP Worker from this checkout. Local build output, runtime state, historical deployment binaries and secrets are intentionally excluded. The datasets checked into the publication snapshot already drive the public Atlas. All election dates, source methods and coverage limits should be validated against the underlying records before publishing additions. [Sources and coverage](https://atlas.blakeoxford.com/regional#atlas-methodology).

To regenerate the optional regional publication inputs after source updates, see [Latam UI build](latam-ui/README.md) and the instructions in the data preparation script. Raw third-party archives are not part of this snapshot.
