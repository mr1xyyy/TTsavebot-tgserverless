// Extract an ordinary (non-fragmented) MP4 audio track without re-encoding.
// Copy audio chunks only and rewrite their offsets in the preserved sample table.
export function extractAudio(bytes) {
  const fail = () => { throw new Error('Bu videodan audio ajratib bo`lmadi (MP4 format qo`llanmaydi)'); };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u32 = offset => { if (offset < 0 || offset + 4 > bytes.length) fail(); return view.getUint32(offset); };
  const text = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  function boxes(start, end) {
    const list = [];
    while (start < end) {
      if (start + 8 > end) fail();
      let size = u32(start), header = 8;
      if (size === 1) { size = u32(start + 8) * 4294967296 + u32(start + 12); header = 16; }
      if (size === 0) size = end - start;
      if (!Number.isSafeInteger(size) || size < header || start + size > end) fail();
      list.push({ start, end: start + size, body: start + header, type: text(start + 4) });
      start += size;
    }
    return list;
  }
  const children = box => boxes(box.body, box.end);
  const child = (box, type) => children(box).find(item => item.type === type);
  const top = boxes(0, bytes.length);
  const moov = top.find(box => box.type === 'moov');
  const ftyp = top.find(box => box.type === 'ftyp');
  if (!moov || !ftyp || top.some(box => box.type === 'moof') || child(moov, 'mvex')) fail();
  const tracks = children(moov).filter(box => box.type === 'trak');
  const audio = tracks.find(track => {
    const mdia = child(track, 'mdia');
    const handler = mdia && child(mdia, 'hdlr');
    return handler && text(handler.body + 8) === 'soun';
  });
  if (!audio) throw new Error('Videoda ovoz yo`q');
  const mdia = child(audio, 'mdia');
  const minf = child(mdia, 'minf');
  const stbl = minf && child(minf, 'stbl');
  if (!stbl) fail();
  const offsets = child(stbl, 'stco') || child(stbl, 'co64');
  const stsc = child(stbl, 'stsc'), stsz = child(stbl, 'stsz');
  if (!offsets || !stsc || !stsz) fail();
  const count = u32(offsets.body + 4), width = offsets.type === 'co64' ? 8 : 4;
  const entryCount = u32(stsc.body + 4);
  const sampleCount = u32(stsz.body + 8), fixedSize = u32(stsz.body + 4);
  if (!count || !entryCount || offsets.body + 8 + count * width > offsets.end ||
      stsc.body + 8 + entryCount * 12 > stsc.end ||
      (!fixedSize && stsz.body + 12 + sampleCount * 4 > stsz.end)) fail();
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    const at = stsc.body + 8 + i * 12;
    const first = u32(at), samples = u32(at + 4);
    if (!samples || first < 1 || (i === 0 && first !== 1) || (i && first <= entries[i - 1].first)) fail();
    entries.push({ first, samples });
  }
  const chunks = [];
  let sample = 0, entry = 0, payloadSize = 0;
  const mdats = top.filter(box => box.type === 'mdat');
  for (let i = 0; i < count; i++) {
    while (entry + 1 < entries.length && entries[entry + 1].first <= i + 1) entry++;
    const at = offsets.body + 8 + i * width;
    const offset = width === 4 ? u32(at) : u32(at) * 4294967296 + u32(at + 4);
    let size = 0;
    if (sample + entries[entry].samples > sampleCount) fail();
    for (let k = 0; k < entries[entry].samples; k++, sample++) size += fixedSize || u32(stsz.body + 12 + sample * 4);
    if (!Number.isSafeInteger(offset) || !mdats.some(box => offset >= box.body && offset + size <= box.end)) fail();
    chunks.push({ offset, size, tableOffset: at });
    payloadSize += size;
  }
  if (sample !== sampleCount || !payloadSize) fail();
  const fileType = bytes.subarray(ftyp.start, ftyp.end);
  const movie = Uint8Array.from(bytes.subarray(moov.start, moov.end));
  const movieView = new DataView(movie.buffer);
  // Keep movie size stable; hide video tracks and track references as free boxes.
  for (const track of tracks.filter(track => track !== audio)) {
    movie.set([102,114,101,101], track.start - moov.start + 4);
    movie.fill(0, track.body - moov.start, track.end - moov.start);
  }
  for (const box of children(audio).filter(box => box.type === 'tref')) {
    movie.set([102,114,101,101], box.start - moov.start + 4);
  }
  const dataStart = fileType.length + movie.length + 8;
  if (dataStart + payloadSize > 0xffffffff) fail();
  const output = new Uint8Array(dataStart + payloadSize);
  let cursor = dataStart;
  for (const chunk of chunks) {
    const at = chunk.tableOffset - moov.start;
    if (width === 8) { movieView.setUint32(at, 0); movieView.setUint32(at + 4, cursor); }
    else movieView.setUint32(at, cursor);
    output.set(bytes.subarray(chunk.offset, chunk.offset + chunk.size), cursor);
    cursor += chunk.size;
  }
  output.set(fileType);
  output.set(movie, fileType.length);
  const outputView = new DataView(output.buffer);
  outputView.setUint32(dataStart - 8, payloadSize + 8);
  output.set([109,100,97,116], dataStart - 4);
  return output;
}
