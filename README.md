# Bingo Generator

A modern, customizable Bingo Card Generator built with React and Vite. Create, customize, and print bingo cards for events, meetings, or parties.

## Features

*   **Customizable Content**: Add your own list of terms (buzzwords, numbers, etc.).
*   **Visual Customization**:
    *   Change title and subtitle.
    *   Adjust font sizes, weights, and styles (Serif, Sans, Mono).
    *   Set text colors and cell opacity.
    *   Upload background images with opacity control.
*   **Generation**:
    *   Randomized shuffling using Fisher-Yates algorithm.
    *   Option to include a center "FREE SPACE".
    *   Generate batches of cards (1 to 100).
*   **Export & Print**:
    *   Live preview.
    *   Print-ready layout.
    *   Download individual cards as PNG.
    *   Download batches as ZIP.
*   **Persistence**: Settings are automatically saved to your browser's Local Storage.

## Tech Stack

*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Libraries**: `html-to-image`, `jszip`

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Building for Production

```bash
npm run build
```