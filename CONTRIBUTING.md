# Contributing to OpenVend

Thanks for your interest. OpenVend is a community-driven project for traditional vending machine operators.

## Most Wanted Contributions

1. **Machine compatibility reports** — see [`docs/supported-machines.md`](docs/supported-machines.md)
2. **Alternative implementations:**
   - Pi listener in Rust, Go, or Node.js
   - Cloud ingestor for AWS Lambda, Google Cloud Functions, or Fly.io
   - Dashboard in Svelte, Solid, or vanilla HTML
3. **Documentation improvements** — clearer wiring photos, video walkthroughs, regional variants
4. **Troubleshooting recipes** — if you hit a problem and solved it, write it up

## What Belongs Here vs Doesn't

✅ MDB protocol handling and tooling
✅ Hardware setup and wiring
✅ Generic dashboard / inventory / restock features
✅ Multi-machine support
✅ Database optimizations

❌ Vendor-specific cloud API integrations (Cantaloupe, Nayax, USA Tech, and other smart-vending proprietary platforms) — those belong in separate repos or `contrib/` directories outside core
❌ Payment processing — out of scope; we observe, we don't transact
❌ Hardware that doesn't speak MDB — it's not a fit

## Pull Request Process

1. Fork the repo
2. Branch from `main` (e.g., `feature/dixie-narco-support`)
3. Make your changes — keep PRs focused (one feature/fix at a time)
4. Update or add documentation
5. Open a PR with a description of what changed and why

## Code Style

- **Python:** Black formatting, type hints where reasonable
- **TypeScript:** Prettier defaults, strict TS
- **SQL:** Lowercase keywords, snake_case names, comments on non-obvious columns
- **Markdown:** Sentence case headers, no trailing whitespace

## Reporting Bugs

Use GitHub Issues. Include:
- Pi model + Qibixx HAT firmware version
- Vending machine make + model
- Steps to reproduce
- Expected vs actual behavior
- Last 50 lines of listener logs

## Security Issues

If you find a security issue (credential leak, RLS bypass, anything that could affect operator data), **do not open a public issue**. Email the maintainer privately first.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
