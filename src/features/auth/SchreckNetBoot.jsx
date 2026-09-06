import React, { useEffect, useState, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SchreckNetBoot — Kindle Fire 7" (11th gen) — v2
//
// Layout (600px tall screen):
//   ① ASCII bat logo  ~330px   (6px font, tight line-height, instant-render)
//   ② Two progress bars         ~50px
//   ③ Terminal typing lines     ~140px
//   ④ Skip bar (fixed bottom)    52px
//
// Rules:
//   • B&W palette — no colour, only #000 / #fff / shades of grey
//   • No @keyframes — all motion via setInterval
//   • Every timer ID goes into timersRef → clearAll() on unmount / skip
//   • var throughout → terser compiles to ES5 cleanly
//   • No text-shadow, no box-shadow, no backdrop-filter
// ─────────────────────────────────────────────────────────────────────────────

// ── ASCII bat ─────────────────────────────────────────────────────────────────
// Stripped of robots.txt "# " prefix; embedded as a single string.
var BAT_ART = [
  '                                                                                                                                                           ',
  '                                                           .....:-=+**##%%%%@@@@%%%###*+==-:.....                                                          ',
  '                                                ..-+%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*=:.                                                ',
  '                                            .*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.                                            ',
  '                                            :@@@@@@@@@@@@@@@@%%#**+=--::............::--=+*#%%%@@@@@@@@@@@@@@@*                                            ',
  '                                            :@@@@@%+-...:-=*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#+-::..:=#%@@@@*                                            ',
  '                                            :@+ .*@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@#: :@+                                            ',
  '                                               .%@@@@@@%+-. ..::-==+*##%%@@@@@@@@@@%%#**+=-::.. .:=#%@@@@@@:                                               ',
  '                                                .#@@@@+    =@@@@%%%#*++==----------==+**#%%%@@@*    .@@@@#:                                                ',
  '                                           :%@.   @@@@+   =@#                                 +@*   .@@@@.   #%-.                                          ',
  '                                        :%@@@:    @@@@+  -@%                                   *@+  .@@@@.    %@@@-.                                       ',
  '                                     :#@@@@@*     @@@@+  %@:                                    %@: .@@@@.    -@@@@@%-                                     ',
  '                                  .*@@@@@@@@.     @@@@+ =@*                                     =@* .@@@@.    .@@@@@@@@%:                                  ',
  '                                =@@@@@@@@@@%      @@@@+ %@:                                     .@@ .@@@@.     #@@@@@@@@@@+.                               ',
  '                             .*@@@@%+%@@@@@#      @@@@+.%@                                       @@..@@@@.     +@@@@@@*%@@@@#.                             ',
  '                           .%@@@@#++@@@@@@@%      @@@@+.%@                                       @@..@@@@.     *@@@@@@@*+#@@@@%:                           ',
  '                         .#@@@@*+++@@@*@@@@@.     @@@@+ %@.                                     .@@ .@@@@.    .@@@@@*@@@*++*@@@@@:                         ',
  '                       .*@@@@*++++@@@**@@@@@*     @@@@+ +@+                                     -@* .@@@@.    -@@@@@#+%@@*+++*@@@@%.                       ',
  '                      =@@@@#+++++@@@++*@@@@@@:    @@@@+ .@@--+**######*+=-:..  ..::-+*#####*+=-:#@: .@@@@.   .%@@@@@%++@@@*++++*@@@@*                      ',
  '                    .%@@@%++++++%@@*++#@@*@@@@:   @@@@+  +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#  :@@@@.  .%@@@*@@%+++@@@*+++++#@@@@-                    ',
  '                   +@@@@*++++++%@@*+++#@@+*@@@@=  @@@@+   %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%   :@@@@. :@@@@*+%@@++++@@@+++++++@@@@*                   ',
  '                 .%@@@%+++++++*@@#++++%@%+++@@@@%:@@@@+   .%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.   :@@@@:#@@@@+++%@@++++*@@#+++++++#@@@@:                 ',
  '                :@@@@*++++++++@@%+++++%@%++++*@@@@@@@@+    :%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:    :@@@@@@@@#++++%@@+++++#@@+++++++++@@@@=                ',
  '               =@@@@+++++++++#@@*+++++#@@++++++*%@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%@@@@@@@@@@@@@*++++++%@%++++++@@%+++++++++%@@@+               ',
  '              =@@@%++++++++++@@%++++++*@@+++++++++@@@@@@@@#++++#@@@@@@@@@@@@@@@@@@@@@@@@@@@%++++#@@@@@@@@+++++++++@@%++++++#@@*+++++++++#@@@*              ',
  '             =@@@#++++++++++*@@*++++++*@@*++++++++@@@@%#@@@@@*+++#@@@@@@@@@@@@@@@@@@@@@@@%+++*%@@@@#*@@@@++++++++*@@#+++++++@@#++++++++++*@@@*             ',
  '            =@@@#+++++++++++@@@++++++++@@#++++++++@@@@#+++*@@@@#+++#@@@@@@@@@@@@@@@@@@@#+++#@@@@#+++*@@@@++++++++*@@*+++++++#@@+++++++++++*@@@*            ',
  '           .@@@#++++++++++++@@#++++++++@@@++++++++@@@@#++++++#@@@#+++*@@@@@@@@@@@@@@@#+++*@@@%++++++*@@@@++++++++#@@++++++++*@@*+++++++++++*@@@=           ',
  '          .@@@#++++++++++++*@@+++++++++*@@+++++++#@@@@@#+++++++%@@%++++*@@@@@@@@@@@#++++#@@@+++++++*@@@@@@+++++++@@#+++++++++@@#++++++++++++*@@@:          ',
  '          *@@%+++++++++++++*@@++++++++++@@#+++++*@@@@@@@*+++++++*@@@*++++#@@@@@@@%+++++%@@#++++++++%@@@@@@%+++++*@@*+++++++++@@%+++++++++++++#@@%.         ',
  '         =@@%++++++++++++++#@@++++++++++#@@+++++++#@@@#+++++++++++@@@+++#@@@@@@@@@%+++%@@+++++++++++*%@@%*++++++@@@++++++++++%@%++++++++++++++%@@*         ',
  '        .%@@*++++++++++++++#@%+++++++++++@@#+++++@@@@@@%+++++++++++@@%#@#:+@%@#@%.*@%#@@*++++++++++#@@@@@@+++++*@@+++++++++++%@%+++++++++++++++@@@:        ',
  '        =@@#+++++++++++++++#@%+++++++++++*@@+++++@@@@@@@++++*@@@%@@%@@@: =@@=@-*@+ .%@@%@@@@@@#++++%@@@@@@+++++@@%+++++++++++%@%+++++++++++++++*@@*        ',
  '       .@@@++++++*#%%%%#*++*@%+++*#%%##+++@@%+++%@%@@%**@@%#@=    .+@@.:%@+ -@: =@@- %@#:    -@%#@@*+%@@%@%*++#@@+++*#%%#*+++%@%+++#%%%%#*++++++%@@.       ',
  '       -@@#+++*@@#=:..:=#@%*@@*@@#-::-+%@%*@@*#@%%%%%%%#.:%@#       .+%@#.  -@.   *@@+-       =@%: *%%%%%%%@%*@@*#@@+-::-*@@*%@%#@%=:..:-*@@#+++*@@+       ',
  '       +@@++*@%:          +@@@@=        .+@@@@@- *@@@@@+   :=      -@@*.    -@.    .+@@+      .-   :%@@@@%.:@@@@@*         -@@@@#.         .*@#++@@%.      ',
  '       %@#+@@:             :@@=            +@@*   @@@@+          =@@+       -@.       =@@*.         :@@@@   +@@#.           -@@=             .%@**@@.      ',
  '       @@*@%.               .@              .%#   @@@@+        =@@=         -@.         -@@+        :@@@@   *@:              @=                *@*@@:      ',
  '      .@@@#                  .                =   @@@@+      :@@+.          -@.           =@@-      :@@@@   *.               -                  +@@@:      ',
  '      .@@@.                                       @@@@+     +@#.            -@.            .*@#.    :@@@@                                       .%@@:      ',
  '       @@=                                        @@@@+   .%@=              -@.              -@@:   :@@@@                                        .@@:      ',
  '       %@.                                        @@@@+  .%@-               -@.               :@@.  :@@@@                                         #@.      ',
  '       +#                                         @@@@+  *@=                -@:                :@%. :@@@@                                         =%.      ',
  '       :-                                         @@@@+ :@%.                =@-                 *@- :@@@@                                         :=       ',
  '                                                  @@@@+ #@-               :#@@@%-               :@% :@@@@                                                  ',
  '                                                  @@@@+.@@             .*@@@@@@@@@*.             @@.:@@@@                                                  ',
  '                                                  @@@@+.@%          :#@@@@@@@@@@@@@@@#:          #@-:@@@@                                                  ',
  '                                                  @@@@+.@%       .#@@@@@@@@@@@@@@@@@@@@@%:       %@::@@@@                                                  ',
  '                                                  @@@@+.%@    :#@@@@@@@@@@@@@@@@@@@@@@@@@@@#.   .@@.:@@@@                                                  ',
  '                                                  @@@@+ *@+=%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*.-@* :@@@@                                                  ',
  '                                                  @@@@+ .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@: :@@@@                                                  ',
  '                                                  @@@@+  =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*  :@@@@                                                  ',
  '                                                  @@@@+   *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#   :@@@@                                                  ',
  '                                                 .@@@@+    #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.   :@@@@                                                  ',
  '                                                %@@@@@*.    :+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#*-     -@@@@@@.                                               ',
  '                                            .## +@@@@@@@@@@@@%%##*+==-:::::::::::::::--=+*##%%%@@@@@@@@@@@%.+%:                                            ',
  '                                            .@@%*- .:=*%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#+-:.:+%@@=                                            ',
  '                                            .@@@@@@@@@@%%#+=:....::::--===+++++++====-::::....:-=*%%@@@@@@@@@@=                                            ',
  '                                            .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:                                            ',
  '                                              .:=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+:.                                              ',
  '                                                      ..::=+*%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#*+-:...                                                     ',
].join('\n');

// ── Terminal lines ─────────────────────────────────────────────────────────────
function buildLines(characterName, characterTitle) {
  var name  = (characterName  || 'UNKNOWN').toUpperCase();
  var title = (characterTitle || 'KINDRED' ).toUpperCase();
  return [
    { text: 'SCHRECKNET NODE EREBUS // INITIALISING', delay: 1900, speed: 14 },
    { text: '',                                        delay: 2200, speed: 0  },
    { text: 'IDENTITY  : ' + name,                    delay: 2350, speed: 16 },
    { text: 'POSITION  : ' + title,                   delay: 2800, speed: 16 },
    { text: 'CLEARANCE : HARPY NODE',                 delay: 3250, speed: 16 },
    { text: '',                                        delay: 3600, speed: 0  },
    { text: '>> ACCESS GRANTED <<',                   delay: 3750, speed: 24, bold: true },
    { text: '',                                        delay: 4100, speed: 0  },
    { text: 'LOADING HARPY NODE...',                  delay: 4200, speed: 18 },
  ];
}

// ── Progress bar definitions ──────────────────────────────────────────────────
// Each bar fills from 0→100 over `durationMs` starting at `startDelay`
var BARS = [
  { label: 'ESTABLISHING LINK',  startDelay: 200,  durationMs: 1100 },
  { label: 'VERIFYING KINDRED',  startDelay: 1200, durationMs: 900  },
];

var TOTAL_MS  = 6500;
var BLINK     = '_';
var TICK_STEP = 50; // ms between bar increments

// ─────────────────────────────────────────────────────────────────────────────
export default function SchreckNetBoot(props) {
  var characterName  = props.characterName;
  var characterTitle = props.characterTitle;
  var onDone         = props.onDone;

  var lines = buildLines(characterName, characterTitle);

  // line states
  var [lineStates, setLineStates] = useState(function() {
    return lines.map(function() {
      return { visible: false, revealed: '', done: false };
    });
  });

  // bar states: array of 0–100 integers
  var [barPct, setBarPct] = useState([0, 0]);

  var [blink, setBlink] = useState(true);

  var timersRef = useRef([]);
  function addTimer(id) { timersRef.current.push(id); }
  function clearAll() {
    timersRef.current.forEach(function(id) {
      clearTimeout(id);
      clearInterval(id);
    });
    timersRef.current = [];
  }
  function done() { clearAll(); onDone && onDone(); }

  useEffect(function() {
    // Auto-proceed
    addTimer(setTimeout(done, TOTAL_MS));

    // Shared cursor blink
    addTimer(setInterval(function() {
      setBlink(function(b) { return !b; });
    }, 480));

    // Animate loading bars
    BARS.forEach(function(bar, bi) {
      var steps = Math.round(bar.durationMs / TICK_STEP);
      var step  = 0;
      addTimer(setTimeout(function() {
        var interval = setInterval(function() {
          step++;
          var pct = Math.min(100, Math.round((step / steps) * 100));
          setBarPct(function(prev) {
            var next = prev.slice();
            next[bi] = pct;
            return next;
          });
          if (pct >= 100) clearInterval(interval);
        }, TICK_STEP);
        addTimer(interval);
      }, bar.startDelay));
    });

    // Terminal lines
    lines.forEach(function(line, idx) {
      addTimer(setTimeout(function() {
        setLineStates(function(prev) {
          var next = prev.slice();
          next[idx] = { visible: true, revealed: '', done: !line.text };
          return next;
        });
        if (!line.text) return;
        var charIdx = 0;
        var typeTimer = setInterval(function() {
          charIdx++;
          var slice    = line.text.slice(0, charIdx);
          var finished = charIdx >= line.text.length;
          setLineStates(function(prev) {
            var next = prev.slice();
            next[idx] = { visible: true, revealed: slice, done: finished };
            return next;
          });
          if (finished) clearInterval(typeTimer);
        }, line.speed);
        addTimer(typeTimer);
      }, line.delay));
    });

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Styles ──────────────────────────────────────────────────────────────────
  // Palette: pure B&W — black bg, white text, grey accents.
  // No colour, no text-shadow, no box-shadow.

  var rootStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    // Don't centre vertically — start from top so the art occupies top half
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    zIndex: 9999,
    fontFamily: '"Courier New", Courier, monospace',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  // ASCII art region — font tiny enough that the 55-line art fits in ~300px
  var artStyle = {
    display: 'block',
    width: '100%',
    // 6px × 55 lines × 1.0 line-height ≈ 330px
    fontSize: '6px',
    lineHeight: '1.0',
    whiteSpace: 'pre',
    overflow: 'hidden',
    color: '#fff',
    // Clip to ~310px so bars + text always visible on 600px screen
    maxHeight: '310px',
    padding: '10px 0 0 0',
    textAlign: 'center',
    // Prevent user from accidentally selecting/scrolling the art
    userSelect: 'none',
  };

  var barsRegionStyle = {
    padding: '8px 20px 4px 20px',
    borderTop: '1px solid #333',
    borderBottom: '1px solid #333',
  };

  var barRowStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
    fontSize: '11px',
    gap: '8px',
  };

  var barLabelStyle = {
    flexShrink: 0,
    width: '130px',
    letterSpacing: '0.5px',
    color: '#ccc',
  };

  var barTrackStyle = {
    flex: 1,
    height: '10px',
    background: '#222',
    border: '1px solid #555',
    position: 'relative',
    overflow: 'hidden',
  };

  var barPctLabelStyle = {
    flexShrink: 0,
    width: '38px',
    textAlign: 'right',
    color: '#aaa',
    fontSize: '10px',
  };

  var termRegionStyle = {
    padding: '6px 20px 60px 20px',
    fontSize: '13px',
    lineHeight: '1.6',
    flexGrow: 1,
    overflow: 'hidden',
  };

  var skipStyle = {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    height: '52px',
    background: '#000',
    borderTop: '1px solid #444',
    color: '#777',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '13px',
    letterSpacing: '2px',
    cursor: 'pointer',
    border: 'none',
    borderTop: '1px solid #444',
    width: '100%',
    display: 'block',
    padding: 0,
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    React.createElement('div', { id: 'schrecknet-boot', style: rootStyle },

      // ① ASCII bat
      React.createElement('pre', { style: artStyle, 'aria-hidden': 'true' }, BAT_ART),

      // ② Progress bars
      React.createElement('div', { style: barsRegionStyle },
        BARS.map(function(bar, bi) {
          var pct = barPct[bi] || 0;
          var fillStyle = {
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: pct + '%',
            background: pct < 100 ? '#666' : '#ccc',
            transition: 'none',   // no CSS transitions — pure JS
          };
          return React.createElement('div', { key: bi, style: barRowStyle },
            React.createElement('span', { style: barLabelStyle }, bar.label),
            React.createElement('div',  { style: barTrackStyle },
              React.createElement('div', { style: fillStyle })
            ),
            React.createElement('span', { style: barPctLabelStyle }, pct + '%')
          );
        })
      ),

      // ③ Terminal typed lines
      React.createElement('div', { style: termRegionStyle },
        lineStates.map(function(ls, idx) {
          if (!ls.visible) return null;
          var line   = lines[idx];
          var cursor = ls.done ? '' : (blink ? BLINK : ' ');
          var txt    = (ls.revealed || '') + cursor;
          var style  = line.bold
            ? { fontWeight: 'bold', color: '#fff', letterSpacing: '2px', fontSize: '14px' }
            : { color: '#ccc' };
          return React.createElement(
            'div', { key: idx, style: style },
            !line.text ? '\u00A0' : txt
          );
        })
      ),

      // ④ Skip
      React.createElement(
        'button',
        { id: 'schrecknet-skip', onClick: done, style: skipStyle },
        '[ SKIP ]'
      )
    )
  );
}
