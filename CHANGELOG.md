# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-05-22

### Fixed

- CSV import now correctly handles quoted fields containing the delimiter.
  Previously, the parser used a naive `split(',')` (and equivalent for TSV),
  so a single cell whose value contained the delimiter inside quotes (for
  example `"iPhone14,3"` in a comma-delimited file) was split into two
  tokens. Every column after such a cell shifted by one position, silently
  corrupting all subsequent fields for that row. Analysis modules reading
  shifted columns by name would receive values from neighbouring columns
  -- often non-numeric or otherwise out of expected range -- and could
  produce nonsensical results without surfacing an obvious error. Header
  parsing is now likewise quote-aware.

### Added

- `parseCsvLine(line, delimiter)` helper exported from `src/shared/utils.ts`,
  implementing an RFC 4180-style line parser (quoted fields, escaped `""`
  quotes). Available to any module that needs to parse CSV-like strings.

## [1.0.1] - 2026-05-22

### Added

- New `select` parameter type for analysis modules. Modules can now declare a
  fixed set of predefined dropdown options via an `options` field (an array of
  `{ value, label }` pairs), enabling user-facing choices that are not derived
  from the loaded dataset's columns. This complements the existing
  `columnSelect` type, which sources its options from the active dataset's
  headers and remains unchanged. Useful for letting a module switch between
  preset modes, profiles, or schedules at run time without exposing those
  internals to the user.
- `ModuleParameterOption` type exported from `src/shared/types.ts`, describing
  the shape of a single option (`{ value: string; label: string }`).

### Changed

- Module parameters that declare a `defaultValue` now have that value applied
  automatically when the module is selected in the Log Analyzer. Previously,
  declared defaults had no effect and the user had to set every value
  manually before running. Modules that omit `defaultValue` are unaffected.

## [1.0.0] - 2026-04-14

### Added

- Initial release.
