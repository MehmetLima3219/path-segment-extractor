# path-segment-extractor

Extracts the directory, filename, basename, and extension components from a POSIX path string.

## Usage

```js
import { splitPath, SegmentType } from 'path-segment-extractor';

const { directory, filename, basename, extension, type } =
  splitPath('/home/alice/archive.tar.gz');

// directory  -> '/home/alice/'
// filename   -> 'archive.tar.gz'
// basename   -> 'archive.tar'
// extension  -> 'gz'
// type       -> SegmentType.NESTED  (== 'nested')
```

`SegmentType` is a frozen object with three string values: `FILE` (no slash in the path), `NESTED` (at least one slash, so a directory exists), and `EMPTY` (empty input, only slashes, or trailing slash with no filename).

## Why this exists

The standard library does not ship a `path`-style module that runs unchanged in the browser and in Node, and `path` on Node normalises paths in ways that quietly change semantics. This library is a small lexical extractor: it tells you what the *literal* path string contains without resolving `.` or `..`, collapsing repeated slashes, or touching the filesystem.

The trade-off is that this is a *lexical* tool, not a *semantic* one. If you need to resolve `..` or join paths, use something else — or call this afterwards.

## Edge you will hit

The extension is the substring after the **last** dot in the final segment, but a dot at the start (`.bashrc`) or end (`report.`) is not treated as an extension separator. So `.bashrc` has no extension, and `.env.local` has basename `.env` and extension `local`. This matches the intuition most file managers use; it does not match every shell glob expansion.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

## Contributing

Issues and pull requests are welcome. Please keep the dependency list empty —
that constraint is the point of the project, not an oversight.

