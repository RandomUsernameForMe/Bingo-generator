import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

// --- Types ---
interface BingoCardData {
  id: number;
  cells: string[]; // Flat array of 25 strings
}

const BingoGenerator: React.FC = () => {
  // --- State ---
  // Default buzzwords to get started
  const [rawText, setRawText] = useState<string>(() => {
    return localStorage.getItem('bingo-rawText') || 
    "Synergy\nCircle Back\nLow Hanging Fruit\nDeep Dive\nTouch Base\n" +
    "Bandwidth\nParadigm Shift\nLeverage\nHolistic\nDeliverables\n" +
    "Scalable\nDisruptive\nThink Outside the Box\nMoving the Needle\n" +
    "Win-Win\nBest Practice\nEcosystem\nOn the Radar\nHard Stop\n" +
    "Ping Me\nTake Offline\nValue Add\nCore Competency\nGame Changer\n" +
    "Blue Sky";
  });
  const [bgImage, setBgImage] = useState<string | null>(() => localStorage.getItem('bingo-bgImage'));
  const [quantity, setQuantity] = useState<number>(1);
  const [generatedCards, setGeneratedCards] = useState<BingoCardData[]>([]);
  const [title, setTitle] = useState<string>(() => localStorage.getItem('bingo-title') || "Event Bingo");
  const [bgOpacity, setBgOpacity] = useState<number>(() => {

    const saved = localStorage.getItem('bingo-bgOpacity');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [textColor, setTextColor] = useState<string>(() => localStorage.getItem('bingo-textColor') || '#1f2937');
  const [useFreeSpace, setUseFreeSpace] = useState<boolean>(() => (localStorage.getItem('bingo-useFreeSpace') ?? 'true') === 'true');
  const [subtitle, setSubtitle] = useState<string>(() => localStorage.getItem('bingo-subtitle') || '');
  const [titleSize, setTitleSize] = useState<number>(() => parseInt(localStorage.getItem('bingo-titleSize') || '48', 10));
  const [titleWeight, setTitleWeight] = useState<string>(() => localStorage.getItem('bingo-titleWeight') || '900');
  const [titleItalic, setTitleItalic] = useState<boolean>(() => localStorage.getItem('bingo-titleItalic') === 'true');
  const [titleUppercase, setTitleUppercase] = useState<boolean>(() => localStorage.getItem('bingo-titleUppercase') === 'true');
  const [fontStyle, setFontStyle] = useState<string>(() => localStorage.getItem('bingo-fontStyle') || 'font-sans');
  const [subtitleSize, setSubtitleSize] = useState<number>(() => parseInt(localStorage.getItem('bingo-subtitleSize') || '24', 10));
  const [cellOpacity, setCellOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('bingo-cellOpacity');
    return saved ? parseFloat(saved) : 0.9;
  });

  // --- Effects for Persistence ---
  useEffect(() => {
    localStorage.setItem('bingo-rawText', rawText);
  }, [rawText]);

  useEffect(() => {
    localStorage.setItem('bingo-title', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('bingo-bgOpacity', bgOpacity.toString());
  }, [bgOpacity]);

  useEffect(() => {
    localStorage.setItem('bingo-textColor', textColor);
  }, [textColor]);

  useEffect(() => {
    localStorage.setItem('bingo-useFreeSpace', String(useFreeSpace));
  }, [useFreeSpace]);

  useEffect(() => {
    localStorage.setItem('bingo-subtitle', subtitle);
  }, [subtitle]);

  useEffect(() => {
    localStorage.setItem('bingo-titleSize', String(titleSize));
  }, [titleSize]);

  useEffect(() => {
    localStorage.setItem('bingo-titleWeight', titleWeight);
  }, [titleWeight]);

  useEffect(() => {
    localStorage.setItem('bingo-titleItalic', String(titleItalic));
  }, [titleItalic]);

  useEffect(() => {
    localStorage.setItem('bingo-titleUppercase', String(titleUppercase));
  }, [titleUppercase]);

  useEffect(() => {
    localStorage.setItem('bingo-fontStyle', fontStyle);
  }, [fontStyle]);

  useEffect(() => {
    localStorage.setItem('bingo-subtitleSize', String(subtitleSize));
  }, [subtitleSize]);

  useEffect(() => {
    localStorage.setItem('bingo-cellOpacity', String(cellOpacity));
  }, [cellOpacity]);

  useEffect(() => {
    if (bgImage) {
      try {
        localStorage.setItem('bingo-bgImage', bgImage);
      } catch (e) {
        console.warn("Image too large to save to local storage");
      }
    } else {
      localStorage.removeItem('bingo-bgImage');
    }
  }, [bgImage]);

  // --- Logic ---

  // 1. Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Shuffle Algorithm (Fisher-Yates)
  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // 3. Generate Batch
  const handleGenerate = () => {
    // Split text by newlines and filter empty strings
    const terms = rawText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    const requiredTerms = useFreeSpace ? 24 : 25;

    // Validation
    if (terms.length < requiredTerms) {
      alert(`You need at least ${requiredTerms} terms to generate a card. You currently have ${terms.length}.`);
      return;
    }

    const newCards: BingoCardData[] = [];

    for (let i = 0; i < quantity; i++) {
      // Shuffle the terms
      const shuffled = shuffle(terms);
      
      // Take the first 24 or 25 items
      const selected = shuffled.slice(0, requiredTerms);
      
      // Insert "FREE SPACE" if enabled
      if (useFreeSpace) {
        selected.splice(12, 0, "FREE SPACE");
      }

      newCards.push({
        id: Date.now() + i,
        cells: selected
      });
    }

    setGeneratedCards(newCards);
  };

  // 4. Export Actions
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const cardElements = document.querySelectorAll<HTMLElement>('[data-printable-card]');
    if (cardElements.length === 0) return;

    if (cardElements.length === 1) {
      // Single image download
      const dataUrl = await htmlToImage.toPng(cardElements[0], { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `bingo-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      // Multiple images, create a ZIP
      const zip = new JSZip();
      
      for (let i = 0; i < cardElements.length; i++) {
        const element = cardElements[i];
        const dataUrl = await htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 2 });
        // We need to remove the data URL prefix to get the raw base64 data
        const base64Data = dataUrl.split(',')[1];
        zip.file(`bingo-card-${i + 1}.png`, base64Data, { base64: true });
      }

      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "bingo-cards.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  // 5. Preview Data Helper
  const getPreviewCells = () => {
    const terms = rawText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    const requiredTerms = useFreeSpace ? 24 : 25;
    const cells = terms.slice(0, requiredTerms);
    while (cells.length < requiredTerms) {
      cells.push("...");
    }
    if (useFreeSpace) {
      cells.splice(12, 0, "FREE SPACE");
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* --- NO-PRINT CONTROL PANEL --- */}
      <div className="print:hidden max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Settings */}
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Bingo Config</h1>
          
          {/* Title & Subtitle */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold text-gray-600">Header</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
              <input 
                type="text" 
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-600">Font Size: {titleSize}px</label>
                    <input type="range" min="16" max="128" value={titleSize} onChange={(e) => setTitleSize(parseInt(e.target.value))} className="w-full"/>
                </div>
                <div>
                    <label className="block text-xs text-gray-600">Font Weight</label>
                    <select value={titleWeight} onChange={(e) => setTitleWeight(e.target.value)} className="w-full border border-gray-300 rounded p-1 text-sm">
                        <option value="400">Normal</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                    </select>
                </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Subtitle Size: {subtitleSize}px</label>
              <input type="range" min="12" max="64" value={subtitleSize} onChange={(e) => setSubtitleSize(parseInt(e.target.value))} className="w-full"/>
            </div>
            <div className="mt-2">
                <label className="block text-xs text-gray-600">Font Family</label>
                <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className="w-full border border-gray-300 rounded p-1 text-sm">
                    <option value="font-sans">Sans-Serif (Modern)</option>
                    <option value="font-serif">Serif (Classic)</option>
                    <option value="font-mono">Monospace (Typewriter)</option>
                </select>
            </div>

            <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={titleItalic} onChange={(e) => setTitleItalic(e.target.checked)} /> Italic</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={titleUppercase} onChange={(e) => setTitleUppercase(e.target.checked)} /> Uppercase</label>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bingo Terms (One per line)
              <span className="text-xs text-gray-500 ml-2">({rawText.split('\n').filter(t=>t.trim()).length} count)</span>
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full h-64 border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter at least 24 terms..."
            />
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={useFreeSpace}
                onChange={(e) => setUseFreeSpace(e.target.checked)}
              />
              Include a "FREE SPACE" in the center
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {bgImage && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Opacity: {Math.round(bgOpacity * 100)}%</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={bgOpacity} 
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button 
                  onClick={() => setBgImage(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-20 p-1 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{textColor}</span>
            </div>
          </div>
          
          {/* Cell Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cell Opacity: {Math.round(cellOpacity * 100)}%</label>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={cellOpacity} onChange={(e) => setCellOpacity(parseFloat(e.target.value))} 
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Quantity & Actions */}
          <div className="flex items-end gap-4 pt-4 border-t">
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            <button 
              onClick={handleGenerate}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition font-bold"
            >
              Generate Cards
            </button>
          </div>
        </div>

        {/* Right Column: Preview Instructions */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-gray-800 self-start">Live Preview</h2>
          
          {/* Preview Card */}
          <div className={`w-full aspect-square bg-white shadow-xl rounded-lg overflow-hidden relative flex flex-col border border-gray-200 ${fontStyle}`}>
             {/* Background Image Layer */}
             {bgImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: bgOpacity
                }}
              />
            )}
            
            <div className="relative z-10 flex-1 flex flex-col p-4 ">
              <header className="text-center mb-2">
                <h2 
                  className={`drop-shadow-sm ${titleUppercase ? 'uppercase' : ''}`}
                  style={{ 
                    color: textColor,
                    fontSize: `${titleSize / 2}px`,
                    fontWeight: titleWeight,
                    fontStyle: titleItalic ? 'italic' : 'normal',
                    lineHeight: 1.1
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ color: textColor, opacity: 0.8, fontSize: `${subtitleSize / 2}px` }}>{subtitle}</p>
                )}
              </header>
              <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-0 border" style={{ borderColor: textColor }}>
                {getPreviewCells().map((cell, i) => (
                  <div key={i} className={`flex items-center justify-center text-center p-1 text-[0.5rem] font-bold leading-tight ${cell === "FREE SPACE" ? 'bg-yellow-300 text-red-600' : ''}`} style={{
                    borderColor: textColor,
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    ...(cell !== "FREE SPACE" ? { color: textColor, backgroundColor: `rgba(255, 255, 255, ${cellOpacity})` } : {})
                  }}>
                    {cell}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status & Print */}
          <div className="text-center space-y-4 w-full">
          {generatedCards.length === 0 ? (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <p>👆 This is just a preview.</p>
              <p>Click <strong>Generate Cards</strong> to create your batch.</p>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <p className="text-lg text-green-600 font-bold">
                {generatedCards.length} Cards Generated!
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDownload}
                  className="bg-gray-800 text-white py-3 px-8 rounded-full shadow-xl hover:bg-black transition flex items-center justify-center gap-2 mx-auto w-full"
                >
                  <span>🖼️ Download as Image(s)</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="bg-blue-600 text-white py-3 px-8 rounded-full shadow-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 mx-auto w-full"
                >
                  <span>📄 Print / Save as PDF</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div className="flex flex-col items-center bg-gray-200 print:bg-white p-8 print:p-0">
        {generatedCards.map((card) => (
          <div 
            key={card.id}
            data-printable-card // Add a data attribute to select these elements
            className="mb-8 print:mb-0 print:break-after-page w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none relative overflow-hidden flex flex-col print:border-none print:p-0"
            style={{
              // Force print to respect background colors/images
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            {/* Background Image Layer */}
            {bgImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: bgOpacity
                }}
              />
            )}

            {/* Content Layer */}
            <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center p-12 ${fontStyle} bg-transparent`}>
              <div className="text-center mb-8 w-full">
                <h2 
                  className={`drop-shadow-sm ${titleUppercase ? 'uppercase' : ''}`}
                  style={{ 
                    color: textColor,
                    fontSize: `${titleSize}px`,
                    fontWeight: titleWeight,
                    fontStyle: titleItalic ? 'italic' : 'normal',
                    lineHeight: 1.1
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2" style={{ color: textColor, opacity: 0.8, fontSize: `${subtitleSize}px` }}>{subtitle}</p>
                )}
              </div>

              {/* The Grid */}
              <div className="w-full max-w-[180mm] aspect-square grid grid-cols-5 grid-rows-5 gap-0 border" style={{ borderColor: textColor }}>
                {card.cells.map((cellText, cellIndex) => {
                  const isFree = cellText === "FREE SPACE";
                  return (
                    <div 
                      key={cellIndex}
                      className={`
                          flex items-center justify-center text-center p-2 text-sm font-bold leading-tight select-none
                          ${isFree ? 'bg-yellow-300 text-red-600' : ''}
                        `}
                        style={{
                          borderColor: textColor,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          ...(!isFree ? { color: textColor, backgroundColor: `rgba(255, 255, 255, ${cellOpacity})` } : {})
                        }}
                    >
                      <span className={isFree ? "transform -rotate-12 text-lg border-2 border-red-600 rounded-full px-2 py-1" : ""}>
                        {cellText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BingoGenerator;