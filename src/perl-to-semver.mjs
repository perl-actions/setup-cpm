export const perlToSemver = (perlVersion) => {
  return perlVersion.replace(/(v)?([0-9][0-9_]*)(\.([0-9_]*))?(\.[0-9_]+)?/g, (...[full, v, whole, , dec, more]) => {
    if (v !== undefined || more !== undefined) {
      return full.replaceAll('_', '');
    }
    whole = whole.replaceAll('_', '');
    const parts = [parseInt(whole, 10)];
    if (dec !== undefined) {
      dec = dec.replaceAll('_', '');
      for (const [part] of dec.matchAll(/.{1,3}/g)) {
        parts.push(parseInt(part.padEnd(3, '0'), 10));
      }
    }
    return parts.join('.');
  });
};
