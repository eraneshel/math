# -*- coding: utf-8 -*-
"""Site-wide numbering: every exercise/example/question in a chapter gets one running number N.k
(N = chapter number from the chapter id chN); the type is shown only by the small tag."""
import re, sys

CH = re.compile(r'<section class="chapter" id="ch(\d+)"[^>]*data-kind="chapter"[^>]*>')
ART = re.compile(r'<article class="ex[^"]*" id="ex-([^"]+)"(?: data-id="([^"]+)")?')

def _swap(block, old, new):
    q = re.escape(old)
    for pat, rep in [(r'id="ex-%s"' % q, 'id="ex-%s"' % new), (r'data-id="%s"' % q, 'data-id="%s"' % new),
                     (r'class="ex-id">%s<' % q, 'class="ex-id">%s<' % new), (r'data-typed="%s"' % q, 'data-typed="%s"' % new),
                     (r'data-mc="%s"' % q, 'data-mc="%s"' % new), (r'data-act="%s"' % q, 'data-act="%s"' % new),
                     (r'name="mc-%s-' % q, 'name="mc-%s-' % new)]:
        block = re.sub(pat, rep, block)
    return block

def renumber(html):
    out, pos, mapping = [], 0, {}
    starts = [(m.start(), m.group(1)) for m in CH.finditer(html)]
    starts.append((len(html), None))
    out.append(html[:starts[0][0]])
    for (a, n), (b, _) in zip(starts, starts[1:]):
        seg = html[a:b]
        k = 0
        pieces, p = [], 0
        for m in ART.finditer(seg):
            e = seg.index('</article>', m.start()) + len('</article>')
            if m.start() < p:
                continue
            k += 1
            old, new = (m.group(2) or m.group(1)), '%s.%d' % (n, k)
            pieces.append(seg[p:m.start()]); blk = _swap(seg[m.start():e], old, new)
            if 'diag-item' in seg[m.start():m.end()]:
                blk = blk.replace('class="ex-id">%s</span>' % new, 'class="ex-id">%s</span><span class="tag t-solo">אבחון</span>' % new, 1)
            pieces.append(blk); p = e
            mapping['%s/%s' % (n, old)] = new
        pieces.append(seg[p:])
        out.append(''.join(pieces))
    return ''.join(out), mapping

if __name__ == '__main__':
    for f in sys.argv[1:]:
        t = open(f, encoding='utf8').read()
        t2, mp = renumber(t)
        open(f, 'w', encoding='utf8').write(t2)
        print(f, len(mp), 'renumbered')
