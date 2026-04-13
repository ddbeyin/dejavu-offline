# dejavu offline

<p align="center">
  <img src="public/favicon.svg" alt="dejavu offline" width="96">
</p>

A client-side utility suite designed for game support operations. This tool ingests event-based telemetry (CSV/TSV) to run repeatable analysis directly in the browser.

**[Launch the app](https://ddbeyin.github.io/dejavu-offline/)**

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Distribution & Extension Model](#distribution--extension-model)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Plugin Development Guide](#plugin-development-guide)
  - [How it Works](#how-it-works)
  - [The Module Definition Object](#the-module-definition-object)
  - [Writing a Plugin](#writing-a-plugin)
  - [API Reference](#api-reference)
  - [Limitations & Security](#limitations--security)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Core Philosophy

1. **Local Data Sovereignty (Offline-First)**: No data leaves the local machine. All parsing, filtering, and analysis occur in the browser memory, ensuring compliance with privacy standards.
2. **Extensible Architecture**: A plugin system allows for the injection of custom algorithms to automate manual sequential state analysis without forking the core app.
3. **Aesthetic**: A nostalgic Windows 98 interface that prioritizes density and utility over modern whitespace.

## Distribution & Extension Model

This program was developed independently in my free time to address a workflow inefficiency I observed in support operations. Building it allowed me to both solve a practical problem for my team and strengthen my skills in React, JavaScript, and client-side data processing. It represents a deliberate architectural choice where the framework is open but the analysis logic is yours.

The application is designed as a content-agnostic engine. It provides the infrastructure for data parsing, UI, and plugin execution, but contains zero domain knowledge about any specific game, product, or business process. This separation serves multiple purposes.

First, portability. The tool can be used by any team dealing with event-based telemetry, regardless of industry, and is instantly accessible through a web browser since it can be hosted as a static site with no installation required. Second, intellectual property boundaries. The public codebase contains no proprietary business logic, algorithms, or company-specific information. Third, privacy by architecture. Since all analysis happens client-side, custom modules can encode sensitive business rules without ever transmitting data externally.

### How It Works in Practice

Think of this like publishing a calculator. It doesn't reveal what equations you're solving. Your private spreadsheets don't become public property because you used Excel. The same principle applies here. The framework is publicly available and fully functional, but completely neutral about what you analyze with it.

The intended workflow is straightforward. This repository hosts the application shell that anyone can access. Your domain-specific analysis modules (the `.js` files described in the Plugin Development Guide) live separately and are shared through whatever internal channels your team already uses. A Google Space, Jira page, internal wiki, or private repository. When someone needs to run an analysis, they load the public tool in their browser and import the relevant plugin. All execution happens locally on their machine. Nothing leaves.

Or to put it more plainly, if I write down some useful procedures on my own time and hand you that document when we're at work, you keep it at your desk. It helps you do your job, but it never leaves the building. Same idea here, just digital.

This model keeps proprietary logic under your control while letting teams benefit from a shared, maintained platform. Your custom modules can be versioned, updated, and distributed however you normally share internal documentation. They never need to touch this public codebase or leave your secure channels.

## Features

### 1. Data Manager

- **Import**: Easily upload or paste denormalized, wide-column CSV/TSV exports.
- **Parsing**: Automatically detects delimiters and handles the sparse structure of game event logs, where different event types populate different subsets of columns.
- **Preview**: View raw data in a virtualized, read-only table that preserves the original file order.

### 2. Log Analyzer (The Workbench)

This is the heart of the application. It allows you to apply modules to automate the manual correlation of trigger events and state changes.

- **Browser**: Select from built-in or custom modules.
- **Configuration**: Dynamic forms generated based on the module's requirements (e.g., mapping specific `event` or `timestamp` columns).
- **Results**: Structured output including Summary Statistics, Data Tables, and raw Text logs.

### 3. Unicode Inspector

A standalone diagnostic tool for validating player usernames by detecting disallowed or visually deceptive Unicode characters (e.g., Cyrillic or Greek look-alikes), with detailed grapheme-level inspection and Unicode metadata available when needed.

## Getting Started

No installation required. The app is hosted as a static site and runs entirely in your browser:

**https://ddbeyin.github.io/dejavu-offline/**

Just open the link and start working. All data stays on your machine.

## Usage

1. **Import Data**: Upload or paste your CSV/TSV telemetry data through the Data Manager.
2. **Analyze**: Navigate to the Log Analyzer and select a module to run analysis on your data.
3. **Inspect**: Use the Unicode Inspector to validate player usernames for suspicious characters.
4. **Extend**: Create custom analysis modules using the Plugin Development Guide below.

## Plugin Development Guide

The Log Analyzer is designed to be extensible. You can write your own modules in JavaScript to automate specific Delta Analysis or Lag/Lead checks.

### How it Works

The app executes imported code using `new Function()`. This means your `.js` file is treated as the body of a function. Your file must end with a `return` statement returning the Module Definition object.

### The Module Definition Object
```typescript
{
  id: string;          // Unique identifier
  name: string;        // Display name
  version: string;     // Semver string
  description: string; // Context regarding the specific state analysis performed
  parameters: [];      // Array of input requirements
  run: async (ctx, params) => { ... } // The execution logic
}
```

### Writing a Plugin

Create a file named `my-check.js`.

**Example:**
```javascript
// my-check.js

// 1. Define your logic
return {
  id: "error-code-counter",
  name: "Error Code Counter",
  version: "1.0",
  description: "Counts occurrences of specific error codes in a column.",
  
  // 2. Define inputs required from the user
  parameters: [
    { 
      name: "targetCol", 
      label: "Error Column", 
      type: "columnSelect", 
      required: true,
      description: "Select the column containing error codes." 
    },
    {
      name: "threshold",
      label: "Alert Threshold",
      type: "number",
      defaultValue: 5
    }
  ],

  // 3. The execution function
  // ctx: { dataset: { headers: string[], rows: object[] }, log: (msg) => void }
  // params: The values entered by the user based on your 'parameters' config
  run: async (ctx, params) => {
    const rows = ctx.dataset.rows;
    const colName = params.targetCol;
    const threshold = parseInt(params.threshold) || 0;
    
    const counts = {};
    
    // Process data
    rows.forEach((row, index) => {
      const val = row[colName];
      if (!val) return;
      counts[val] = (counts[val] || 0) + 1;
    });

    // Prepare Table Data
    const tableData = Object.entries(counts).map(([code, count]) => ({
      "Error Code": code,
      "Count": count,
      "Status": count > threshold ? "CRITICAL" : "Normal"
    }));

    // Return the Result Object
    return {
      sections: [
        {
          type: "summary",
          title: "Overview",
          data: {
            "Total Rows Scanned": rows.length,
            "Unique Errors": Object.keys(counts).length
          }
        },
        {
          type: "table",
          title: "Error Distribution",
          data: tableData
        }
      ],
      logs: [`Finished processing ${rows.length} rows.`]
    };
  }
};
```

### API Reference

#### Context (`ctx`)

- `ctx.dataset.headers`: Array of column names from the denormalized schema.
- `ctx.dataset.rows`: An immutable event stream represented as an array of row objects in chronological order. Access fields via `row["Column Name"]`.
- `ctx.log(msg)`: Appends a message to the execution log in the UI.

#### Parameters Configuration

Available types for `parameters` array:

- `string`: Simple text input.
- `number`: Numeric input.
- `boolean`: Checkbox.
- `columnSelect`: Dropdown populated with headers, allowing the user to map their specific CSV schema to your logic.

#### Return Object (`ModuleResult`)

Your `run` function must return an object with a `sections` array. Each section renders a specific UI block:

1. **Summary**: Key-Value pairs.
```javascript
   { type: "summary", title: "Stats", data: { "Sum": 100, "Avg": 10 } }
```

2. **Table**: Array of objects.
```javascript
   { type: "table", title: "Details", data: [{ id: 1, val: "A" }, { id: 2, val: "B" }] }
```

3. **Text**: Monospace text block.
```javascript
   { type: "text", title: "Raw Output", data: "Line 1\nLine 2" }
```

4. **Markdown**: Rendered Markdown (basic support).
```javascript
   { type: "markdown", title: "Notes", data: "**Bold** text" }
```

### Limitations & Security

1. **Security**: Imported modules run with the same privileges as the application. Only import scripts you trust.
2. **Persistence**: Custom modules are saved to your browser's `localStorage`. Clearing browser data will remove them.
3. **DOM Access**: Plugins should not attempt to modify the DOM directly. Return data structures via the `sections` array to let React handle the rendering.
4. **Network**: While technically possible to use `fetch`, it is discouraged to keep the tool offline-capable and fast.
5. **Memory**: Large datasets (100k+ rows) are processed in the main thread. Heavy computations in plugins may freeze the UI momentarily.

## Development

This project is built with React and TypeScript, using Vite.

### Prerequisites

- Node.js (v20 or higher)
- npm

### Running Locally

```bash
git clone https://github.com/ddbeyin/dejavu-offline.git
cd dejavu-offline
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

### Project Structure

- `src/app`: Main entry and layout.
- `src/shared`: Reusable components (Windows 98 UI) and types.
- `src/features`: Feature-specific logic.
  - `data-import`: CSV/TSV parsing and schema detection.
  - `log-analyzer`: The workbench and module registry.
  - `other`: Utility tools.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Guidelines

- Follow the existing code style
- Write clear commit messages
- Update documentation as needed
- Test your changes thoroughly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This tool is designed for offline use and prioritizes data privacy. All processing occurs locally in your browser.
