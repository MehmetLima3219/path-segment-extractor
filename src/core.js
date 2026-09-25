/**
 * Core implementation of path segment extraction.
 *
 * Design decisions (documented so the reader knows exactly what they get):
 *
 * 1. POSIX-only. We split on '/' and treat '\' as an ordinary filename
 *    character. Supporting Windows would mean parsing both separators and
 *    resolving their collision (is "a\\b/c" two segments or one?). That
 *    ambiguity is not worth the complexity for this library's scope.
 *
 * 2. Single dots (".") and double dots ("..") are treated as ordinary
 *    filename tokens, not as special "current directory" / "parent
 *    directory" semantic markers. The function extracts lexical segments;
 *    semantic resolution is a different problem.
 *
 * 3. "Extension" means the substring after the LAST dot in the final
 *    segment, when that dot is not the first character and not the last
 *    character of the segment. This matches the common intuition:
 *      - "archive.tar.gz"  -> ext "gz", basename "archive.tar"
 *      - ".bashrc"         -> ext "", basename ".bashrc"
 *      - "report."         -> ext "", basename "report."
 *      - "no_ext"          -> ext "", basename "no_ext"
 *
 * 4. An empty path returns all-empty fields rather than throwing, because
 *    callers frequently pass in user input and a thrown exception would
 *    force them to wrap every call in try/catch.
 */

/**
 * Labels for the kind of value each returned field holds. Useful for
 * programmatic consumers that want to switch on the "shape" of a result
 * without re-deriving it.
 */
export const SegmentType = Object.freeze({
  /** Path contained no slash — a bare filename with no directory. */
  FILE: 'file',
  /** Path had at least one slash, so a directory portion exists. */
  NESTED: 'nested',
  /** Path was empty or only slashes. */
  EMPTY: 'empty'
});

/**
 * @typedef {Object} PathSegments
 * @property {string} directory  Everything up to and including the last
 *   slash, or "" if there is no slash.
 * @property {string} filename  The final path component, or "" if the path
 *   ends with a slash (or is empty). May equal `basename` when there is no
 *   extension.
 * @property {string} basename  The filename with the extension stripped.
 *   Equals `filename` when no extension is present.
 * @property {string} extension The substring after the last dot in the
 *   filename, excluding the dot itself. "" when none applies.
 * @property {string} type      One of the {@link SegmentType} values.
 */

/**
 * Extract directory, filename, basename, and extension from a POSIX path.
 *
 * @param {string} path  The path to analyse. Must be a string.
 * @returns {PathSegments}
 */
export function splitPath(path) {
  // Defensive guard: non-string input is a programming error. We coerce
  // rather than throw so a stray `undefined` from a missing env var does
  // not crash the caller; they get the empty result and can decide.
  if (typeof path !== 'string') {
    return {
      directory: '',
      filename: '',
      basename: '',
      extension: '',
      type: SegmentType.EMPTY
    };
  }

  // Empty or all-slash paths have no filename to extract.
  if (path.length === 0 || /^\/*$/.test(path)) {
    return {
      directory: path,
      filename: '',
      basename: '',
      extension: '',
      type: SegmentType.EMPTY
    };
  }

  // Find the last slash. Everything before it (inclusive) is the directory;
  // everything after is the filename.
  const lastSlash = path.lastIndexOf('/');
  let directory, filename;
  if (lastSlash === -1) {
    directory = '';
    filename = path;
  } else {
    directory = path.slice(0, lastSlash + 1);
    filename = path.slice(lastSlash + 1);
  }

  // A trailing slash means the "filename" slot is empty — e.g. "a/b/".
  if (filename === '') {
    return {
      directory,
      filename: '',
      basename: '',
      extension: '',
      type: SegmentType.EMPTY
    };
  }

  // Locate the extension. The rule: last dot in the filename, but only
  // valid when it is neither leading nor trailing.
  const lastDot = filename.lastIndexOf('.');
  let basename, extension;
  if (lastDot > 0 && lastDot < filename.length - 1) {
    basename = filename.slice(0, lastDot);
    extension = filename.slice(lastDot + 1);
  } else {
    basename = filename;
    extension = '';
  }

  return {
    directory,
    filename,
    basename,
    extension,
    type: lastSlash === -1 ? SegmentType.FILE : SegmentType.NESTED
  };
}
