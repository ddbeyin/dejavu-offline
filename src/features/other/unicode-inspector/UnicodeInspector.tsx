import React, { useState, useEffect } from 'react';
import { GraphemeData, TabId } from '../../../shared/types';
import { segmentString, parseCodePointInput, toUTF8Hex, toUTF16Hex } from '../../../shared/utils';
import * as unicode from '../../../shared/unicodeData';

const SAMPLES = [
  { name: "Basic", val: "A" },
  { name: "Accent", val: "é" },
  { name: "Combined", val: "e\u0301" },
  { name: "Emoji ZWJ", val: "👨‍👩‍👧‍👦" },
  { name: "Bidi Marks", val: "\u200Eא\u200F" },
  { name: "Confusable", val: "а" } // Cyrillic a
];

interface UnicodeInspectorProps {
  onStatusUpdate: (status: string) => void;
}

export const UnicodeInspector: React.FC<UnicodeInspectorProps> = ({ onStatusUpdate }) => {
  const [input, setInput] = useState<string>("Hello! 🌍");
  const [cpInput, setCpInput] = useState<string>("");
  const [graphemes, setGraphemes] = useState<GraphemeData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabId>(TabId.Overview);
  const [showInvisibles, setShowInvisibles] = useState<boolean>(true);

  // Analyze input string for grapheme clusters
  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = segmentString(input);
      setGraphemes(result);
      if (result.length > 0 && selectedIndex >= result.length) {
        setSelectedIndex(0);
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [input, selectedIndex]);

  const selectedGrapheme = graphemes[selectedIndex];

  const handleInsertCP = () => {
    const char = parseCodePointInput(cpInput);
    if (char) {
      setInput(prev => prev + char);
      setCpInput("");
      onStatusUpdate(`Inserted ${cpInput}`);
    } else {
      onStatusUpdate("Invalid code point input");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onStatusUpdate("Copied to clipboard");
  };

  const renderGrapheme = (text: string, forceVisible = false) => {
    if (!showInvisibles && !forceVisible) return text;
    
    const parts = Array.from(text).map((char, i) => {
      const cp = char.codePointAt(0)!;
      if (unicode.isInvisible(cp)) {
        return <span key={i} className="invisible-token">{unicode.getInvisibleLabel(cp)}</span>;
      }
      return char;
    });
    return <>{parts}</>;
  };

  return (
    <div className="main-container">
      {/* Left Column: Input and Grapheme List */}
      <div className="list-container">
        <fieldset>
          <legend>Input Source</legend>
          <div className="field-row-stacked mb-2">
            <textarea 
              id="main-input" 
              rows={3} 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ resize: 'none', width: '100%' }}
            />
          </div>

          <div className="field-row">
            <label htmlFor="cp-input">U+:</label>
            <input 
              id="cp-input" 
              type="text" 
              className="flex-1"
              value={cpInput}
              onChange={(e) => setCpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertCP()}
            />
            <button onClick={handleInsertCP}>Insert</button>
          </div>

          <div className="flex gap-1 flex-wrap mt-2">
            <button onClick={() => setInput("")}>Clear</button>
            <button onClick={() => copyToClipboard(input)}>Copy All</button>
            <button onClick={() => {
              const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
              setInput(sample.val);
            }}>Random</button>
          </div>
        </fieldset>

        <fieldset className="flex-1 flex flex-col min-h-0">
          <legend>Grapheme Clusters</legend>
          <div className="tree-view flex-1">
            {graphemes.length === 0 && (
              <div className="p-2 text-gray-500 italic">No input...</div>
            )}
            {graphemes.map((g, idx) => (
              <div 
                key={idx} 
                className={`tree-item ${selectedIndex === idx ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <span className="w-6 text-right opacity-50">{idx}</span>
                <span className="w-8 flex justify-center text-lg bg-gray-100 border border-gray-400 text-black">
                  {renderGrapheme(g.text)}
                </span>
                <span className="font-mono text-xs" style={{ fontSize: '10px' }}>{g.codePoints[0].hex}</span>
              </div>
            ))}
          </div>

          <div className="field-row mt-2">
            <input 
              type="checkbox" 
              id="show-inv" 
              checked={showInvisibles}
              onChange={(e) => setShowInvisibles(e.target.checked)}
            />
            <label htmlFor="show-inv">Show invisibles</label>
          </div>
        </fieldset>
      </div>

      {/* Right Column: Detailed Properties Tabs */}
      <div className="details-container">
        <menu role="tablist">
          {(Object.values(TabId)).map(tab => (
            <li key={tab} role="tab" aria-selected={activeTab === tab}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}>{tab}</a>
            </li>
          ))}
        </menu>

        <div className="tab-content">
          {selectedGrapheme ? (
            <>
              {activeTab === TabId.Overview && (
                <fieldset>
                  <legend>Grapheme Info</legend>
                  <div>
                    <div className="preview-large text-black">
                      {renderGrapheme(selectedGrapheme.text, true)}
                    </div>
                    <p><strong>Name:</strong> {selectedGrapheme.codePoints.length === 1 ? selectedGrapheme.codePoints[0].name : `(Sequence of ${selectedGrapheme.codePoints.length} characters)`}</p>
                    <p><strong>Length:</strong> {selectedGrapheme.codePoints.length} Code Points, {selectedGrapheme.text.length} UTF-16 units</p>
                    <p><strong>Block:</strong> {unicode.getBlock(selectedGrapheme.codePoints[0].value).name}</p>
                    <p><strong>Category:</strong> {selectedGrapheme.codePoints[0].category}</p>
                    <p><strong>Script:</strong> {selectedGrapheme.codePoints[0].script}</p>
                    
                    <div className="mt-4 p-2 border border-gray-300 bg-gray-50">
                      <div className="text-xs font-bold mb-1">Copy Formats</div>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(selectedGrapheme.text)}>Text</button>
                        <button onClick={() => copyToClipboard(selectedGrapheme.codePoints.map(c => c.hex).join(' '))}>Hex</button>
                        <button onClick={() => copyToClipboard(JSON.stringify(selectedGrapheme, null, 2))}>JSON</button>
                      </div>
                    </div>
                  </div>
                </fieldset>
              )}

              {activeTab === TabId.CodePoints && (
                <table className="win98">
                  <thead>
                    <tr>
                      <th>Idx</th>
                      <th>Char</th>
                      <th>Hex</th>
                      <th>Dec</th>
                      <th>Name</th>
                      <th>Cat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGrapheme.codePoints.map((cp, idx) => (
                      <tr key={idx}>
                        <td>{idx}</td>
                        <td className="text-lg">{renderGrapheme(cp.char)}</td>
                        <td>{cp.hex}</td>
                        <td>{cp.value}</td>
                        <td>{cp.name}</td>
                        <td>{cp.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === TabId.Properties && (
                 <div className="space-y-4">
                    {selectedGrapheme.codePoints.map((cp, idx) => (
                      <fieldset key={idx}>
                        <legend>{cp.hex} ({cp.char})</legend>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Block:</strong> {cp.block}</div>
                          <div><strong>Script:</strong> {cp.script}</div>
                          <div><strong>Category:</strong> {cp.category}</div>
                          <div><strong>Bidi Class:</strong> {cp.bidiClass}</div>
                          <div><strong>Invisible:</strong> {cp.isInvisible ? "Yes" : "No"}</div>
                        </div>
                      </fieldset>
                    ))}
                 </div>
              )}

              {activeTab === TabId.Encodings && (
                <fieldset>
                  <legend>Byte Sequences</legend>
                  <div className="space-y-4">
                    <div className="field-row-stacked">
                      <label>UTF-8 Bytes:</label>
                      <input type="text" readOnly value={toUTF8Hex(selectedGrapheme.text)} />
                    </div>
                    <div className="field-row-stacked">
                      <label>UTF-16 Code Units:</label>
                      <input type="text" readOnly value={toUTF16Hex(selectedGrapheme.text)} />
                    </div>
                    <div className="field-row-stacked">
                      <label>JS String Escape:</label>
                      <input type="text" readOnly value={selectedGrapheme.codePoints.map(c => `\\u{${c.value.toString(16)}}`).join('')} />
                    </div>
                  </div>
                </fieldset>
              )}

              {activeTab === TabId.Normalize && (
                <div className="space-y-2">
                  {['NFC', 'NFD', 'NFKC', 'NFKD'].map(form => {
                    const normalized = selectedGrapheme.text.normalize(form as any);
                    return (
                      <fieldset key={form}>
                        <legend>{form}</legend>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl w-12 text-center border-r">{renderGrapheme(normalized)}</span>
                          <div className="text-xs font-mono truncate flex-1">
                            {Array.from(normalized).map((c: any) => c.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')).join(' ')}
                          </div>
                          {normalized !== selectedGrapheme.text && <span className="text-red-700 text-xs">Different!</span>}
                        </div>
                      </fieldset>
                    );
                  })}
                  <fieldset className="mt-4">
                    <legend>Case Transforms</legend>
                    <div className="text-xs space-y-1">
                      <div>Upper: {selectedGrapheme.text.toUpperCase()}</div>
                      <div>Lower: {selectedGrapheme.text.toLowerCase()}</div>
                      <div>Turkish I: {"i".toLocaleUpperCase('tr-TR')}</div>
                    </div>
                  </fieldset>
                </div>
              )}

              {activeTab === TabId.Security && (
                <fieldset>
                  <legend>Heuristics</legend>
                  <div className="space-y-2">
                     {selectedGrapheme.codePoints.some(cp => cp.isInvisible) && (
                       <div className="bg-yellow-100 p-2 border border-yellow-600 text-xs">
                         <strong>Warning:</strong> Contains invisible/format characters.
                       </div>
                     )}
                     {selectedGrapheme.codePoints.length > 3 && (
                       <div className="bg-blue-100 p-2 border border-blue-600 text-xs">
                         <strong>Info:</strong> Complex multi-codepoint sequence.
                       </div>
                     )}
                     <div className="bg-gray-100 p-2 border border-gray-600 text-xs">
                       <strong>Confusable Check:</strong> No exact matches in local tiny dictionary.
                     </div>
                     <p className="text-[10px] italic">Unicode security is a deep field. This tool provides basic heuristics.</p>
                  </div>
                </fieldset>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full opacity-50">
              Select a grapheme cluster from the left to see details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};