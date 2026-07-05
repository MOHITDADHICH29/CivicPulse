# CivicPulse Dashboard

A modern civic complaint and issue tracking dashboard powered by generative AI. CivicPulse provides real-time insights into community complaints and issues with advanced analytics and severity tracking.

## Live Demo

🌐 **[Visit CivicPulse Dashboard](https://civicpulse-genai.web.app/)**

## Features

- **Real-time Analytics**: Track civic complaints and issues across different community areas
- **Severity Tracking**: Classify issues by severity levels (Critical, High, Warning, Stable)
- **Visual Dashboards**: Interactive charts and graphs for data visualization
  - Severity distribution bar charts
  - Open vs closed request donut charts
  - Community area breakdowns
- **Data-Driven Insights**: Analyze complaint patterns and trends
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **AI-Powered**: Built with generative AI capabilities for intelligent data processing

## Tech Stack

- **Frontend**: React 18.3
- **Build Tool**: Vite 5.4
- **Styling**: CSS3
- **Data**: JSON-based data storage

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Setup

1. Clone or download the repository:
```bash
cd "CivicPulse GENAI"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # React entry point
│   └── styles.css        # Global styles
├── data.json             # Complaint data
├── index.html            # HTML entry point
├── package.json          # Project dependencies
└── vite.config.js        # Vite configuration
```

## How It Works

CivicPulse analyzes civic complaint data and presents it through interactive visualizations:

1. **Data Processing**: Reads complaint data from JSON source
2. **Severity Analysis**: Automatically categorizes issues based on severity scores
3. **Geographic Mapping**: Groups complaints by community areas
4. **Status Tracking**: Monitors open and closed requests
5. **Dashboard Display**: Presents insights through intuitive charts and metrics

## Deployment

The application is currently deployed at: **https://civicpulse-genai.web.app/**

Built and optimized for production with Vite for lightning-fast performance.

## Contributing

Feel free to fork, modify, and improve this project. Your contributions are welcome!

## License

This project is open source and available under the MIT License.

---

**CivicPulse** - Empowering communities through data-driven civic engagement.
