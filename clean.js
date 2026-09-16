/* clip2md — page clean-up and Reddit formatting. Runs entirely in the browser.
   Exposes window.Clip2mdClean = { prepare, postprocess }. */
(function () {
  'use strict';

  var BUTTON_WORDS = /^(reply|share|report|save|saved|follow|following|subscribe|unsubscribe|join|joined|award|give award|upvote|downvote|vote|like|likes|comment|comments|copy link|copy text|embed|print|tweet|pin it|email|more|more options|show more|show less|read more|see more|continue reading|load more|view more comments|back to top|skip to content|skip to main content|accept|accept all|reject|reject all|allow all|decline|manage cookies|cookie settings|close|dismiss|sign in|log in|sign up|antworten|teilen|melden|speichern|folgen|abonnieren|beitreten|gefällt mir|kommentieren|link kopieren|drucken|mehr|mehr anzeigen|weniger anzeigen|weiterlesen|mehr laden|nach oben|zum inhalt springen|akzeptieren|alle akzeptieren|ablehnen|alle ablehnen|einstellungen|cookie-einstellungen|schließen|anmelden|registrieren)$/i;
  var JUNK_ATTR = /(^|[\s_-])(cookie|consent|gdpr|cmp|banner|newsletter|subscribe|share|sharing|social|advert|ad-slot|ads|sponsor|promo|popup|modal|overlay|sidebar|breadcrumb|related|recommend|paywall|toolbar|skip-link|comment-form|site-header|site-footer|masthead)([\s_-]|$)/i;
  var JUNK_SELECTORS = 'nav, aside, footer, form, button, input, select, textarea, dialog, iframe, noscript, template, [hidden], [aria-hidden="true"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="dialog"], [role="alertdialog"], [role="complementary"], [role="search"], [role="menu"], [role="menubar"], [role="toolbar"]';

  function textLen(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim().length : 0; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Generic page clean-up ----------
  function stripJunk(root) {
    var total = textLen(root) || 1, removed = 0;
    Array.prototype.slice.call(root.querySelectorAll(JUNK_SELECTORS)).forEach(function (el) {
      // Never drop the bulk of the content just because it sits in an odd wrapper.
      if (el.isConnected && textLen(el) < total * 0.5) { el.remove(); removed++; }
    });
    Array.prototype.slice.call(root.querySelectorAll('[class], [id]')).forEach(function (el) {
      if (!el.isConnected || /^(html|body|main|article)$/i.test(el.tagName)) return;
      var sig = (el.getAttribute('class') || '') + ' ' + (el.id || '');
      if (JUNK_ATTR.test(sig) && textLen(el) < total * 0.25) { el.remove(); removed++; }
    });
    Array.prototype.slice.call(root.querySelectorAll('a, span, div, li, p, strong, b')).forEach(function (el) {
      if (!el.isConnected) return;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && t.length < 32 && BUTTON_WORDS.test(t) && !el.querySelector('img')) { el.remove(); removed++; }
    });
    Array.prototype.slice.call(root.querySelectorAll('img')).forEach(function (img) {
      var w = parseInt(img.getAttribute('width'), 10), h = parseInt(img.getAttribute('height'), 10);
      var alt = (img.getAttribute('alt') || '') + ' ' + (img.getAttribute('src') || '');
      if ((w && w <= 48) || (h && h <= 48) || /avatar|icon|logo|emoji|spacer|pixel|tracking/i.test(alt)) { img.remove(); removed++; }
    });
    return removed;
  }

  function looksLikePage(doc) {
    return !!doc.querySelector('article, main, [role="main"], nav, header, footer') || doc.querySelectorAll('a').length > 25;
  }

  // ---------- Reddit ----------
  function isReddit(doc, html) {
    if (doc.querySelector('shreddit-comment, shreddit-post, .thing.comment, .thing.link, [data-testid="comment"]')) return true;
    return /reddit\.com\/(r|user)\//i.test(html) && /\b(reply|upvote|antworten)\b/i.test(doc.body ? doc.body.textContent : '');
  }

  function quote(lines, depth) {
    var p = new Array(depth + 1).join('> ');
    return lines.map(function (l) { return (p + l).replace(/\s+$/, ''); });
  }

  function nearest(el, sel) { var p = el.parentElement; return p ? p.closest(sel) : null; }

  function redditToMd(doc, toMd, labels) {
    var out = [], post, title, author, sub, body, comments = [];

    // New Reddit (shreddit web components)
    post = doc.querySelector('shreddit-post');
    var sc = doc.querySelectorAll('shreddit-comment');
    if (post || sc.length) {
      title = post && post.getAttribute('post-title');
      author = post && post.getAttribute('author');
      sub = post && post.getAttribute('subreddit-prefixed-name');
      body = post && post.querySelector('[slot="text-body"]');
      var top = Array.prototype.filter.call(sc, function (c) { return !nearest(c, 'shreddit-comment'); });
      var renderNew = function (c, depth) {
        var a = c.getAttribute('author') || '[deleted]';
        var bodyEl = Array.prototype.filter.call(c.querySelectorAll('[slot="comment"]'), function (b) { return b.closest('shreddit-comment') === c; })[0];
        var lines = ['**u/' + a + '**' + (author && a === author ? ' (OP)' : ''), ''];
        lines = lines.concat((bodyEl ? toMd(bodyEl.innerHTML) : '').split('\n'));
        var res = quote(lines, depth);
        Array.prototype.filter.call(c.querySelectorAll('shreddit-comment'), function (k) { return nearest(k, 'shreddit-comment') === c; })
          .forEach(function (k) { res.push(quote([''], depth)[0]); res = res.concat(renderNew(k, depth + 1)); });
        return res;
      };
      top.forEach(function (c) { comments.push(renderNew(c, 1).join('\n')); });
    } else {
      // Old Reddit
      var link = doc.querySelector('.thing.link');
      var oc = doc.querySelectorAll('.thing.comment');
      if (!link && !oc.length) return null;
      if (link) {
        var ta = link.querySelector('a.title'); title = ta && ta.textContent.trim();
        var au = link.querySelector('.tagline .author'); author = au && au.textContent.trim();
        var sr = link.querySelector('.tagline .subreddit'); sub = sr && sr.textContent.trim();
        body = link.querySelector('.usertext-body .md');
      }
      var topOld = Array.prototype.filter.call(oc, function (c) { return !nearest(c, '.thing.comment'); });
      var renderOld = function (c, depth) {
        var entry = c.querySelector(':scope > .entry') || c;
        var au2 = entry.querySelector('.tagline .author'); var a = au2 ? au2.textContent.trim() : '[deleted]';
        var md = entry.querySelector('.usertext-body .md');
        var lines = ['**u/' + a + '**' + (author && a === author ? ' (OP)' : ''), ''].concat((md ? toMd(md.innerHTML) : '').split('\n'));
        var res = quote(lines, depth);
        Array.prototype.filter.call(c.querySelectorAll('.thing.comment'), function (k) { return nearest(k, '.thing.comment') === c; })
          .forEach(function (k) { res.push(quote([''], depth)[0]); res = res.concat(renderOld(k, depth + 1)); });
        return res;
      };
      topOld.forEach(function (c) { comments.push(renderOld(c, 1).join('\n')); });
    }

    if (!title) { var h1 = doc.querySelector('h1'); title = h1 && h1.textContent.trim(); }
    if (title) out.push('# ' + title, '');
    var meta = [sub, author ? 'u/' + author : ''].filter(Boolean).join(' · ');
    if (meta) out.push('*' + meta + '*', '');
    if (body) { var b = toMd(body.innerHTML); if (b) out.push(b, ''); }
    if (comments.length) { out.push('---', '', '## ' + labels.comments + ' (' + comments.length + ')', '', comments.join('\n\n')); }
    var res = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return res.length > 20 ? res : null;
  }

  var REDDIT_LINE = /^(reply|share|report|save|follow|award|upvote|downvote|vote|more replies|\d+ more repl(y|ies)|level \d+|op|edited|•|·|u\/[\w-]+ avatar|r\/[\w-]+ icon|\d+(\.\d+)?\s*[kKmM]?|\d+\s*(s|m|h|d|w|mo|y|yr|min|hr)\.?\s*ago|go to comments|sort by:?|best|top|new|controversial|old|q&a|comments|antworten|teilen|melden)$/i;

  function postprocess(md, opts) {
    var lines = md.split('\n'), out = [], inFence = false;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], t = l.trim();
      if (/^(```|~~~)/.test(t)) { inFence = !inFence; out.push(l); continue; }
      if (inFence) { out.push(l); continue; }
      var bare = t.replace(/^[-*+]\s+/, '').replace(/^\[([^\]]*)\]\([^)]*\)$/, '$1').trim();
      if (bare && BUTTON_WORDS.test(bare)) continue;
      if (opts.reddit && bare && REDDIT_LINE.test(bare)) continue;
      if (/^\[\s*\]\([^)]*\)$/.test(t) || /^[|•·\-–—]+$/.test(t) && !/^-{3,}$/.test(t)) continue;
      out.push(l.replace(/\[\s*\]\([^)]*\)/g, ''));
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* prepare(html, opts) → { md?, html?, kind, title? }
     opts: { cleanup, reddit, toMd(htmlString)→md, labels:{comments} } */
  function prepare(html, opts) {
    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return { html: html, kind: 'plain' }; }
    if (!doc || !doc.body) return { html: html, kind: 'plain' };

    var reddit = isReddit(doc, html);
    if (opts.reddit && reddit) {
      try { var rmd = redditToMd(doc, opts.toMd, opts.labels); if (rmd) return { md: rmd, kind: 'reddit', reddit: true }; } catch (e) {}
    }
    if (!opts.cleanup) return { html: html, kind: 'plain', reddit: reddit };

    var before = textLen(doc.body);
    if (before > 1200 && typeof window.Readability === 'function' && looksLikePage(doc) && !reddit) {
      try {
        var art = new window.Readability(doc.cloneNode(true), { charThreshold: 250, keepClasses: false }).parse();
        if (art && art.content && (art.textContent || '').trim().length > before * 0.3) {
          var content = art.content;
          if (art.title && content.indexOf(art.title) < 0) content = '<h1>' + esc(art.title) + '</h1>' + content;
          return { html: content, kind: 'article', title: art.title, reddit: reddit };
        }
      } catch (e) {}
    }
    var n = stripJunk(doc.body);
    return { html: doc.body.innerHTML, kind: n ? 'cleaned' : 'plain', reddit: reddit };
  }

  window.Clip2mdClean = { prepare: prepare, postprocess: postprocess };
})();
