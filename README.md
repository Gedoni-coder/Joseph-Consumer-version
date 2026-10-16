# JOSEPH consumer

Live planning beta: **https://joseph-consumer.vercel.app**

The current consumer app is React/TypeScript in `web/`, with an Express/Prisma API in `backend/` and a dedicated hosted PostgreSQL database. It supports real accounts, manual balances, bills and goals, spending forecasts, purchase checks, and privacy controls. Bank connections, verification delivery, and WhatsApp are still pending.

- [Consumer setup](web/README.md)
- [Deployment and operational limits](docs/CONSUMER_DEPLOYMENT.md)
- [Implementation and remaining gates](docs/CONSUMER_LOCAL_IMPLEMENTATION.md)

## Historical application notes

The notes below describe the older root HTML application, retained for reference. It is not the deployed consumer frontend.

# JOSEPH AI Family

A vanilla **HTML/CSS/JavaScript** single-page application that provides a suite of economic-AI tools.

## Overview
- index.html – entry point.
- pp.js – SPA router & UI logic.
- styles.css – custom styling (not included in this repo snapshot).

## Quick Start
`ash
# Clone / open the folder
cd " C:/Users/HP/Desktop/JOSEPHAIFAMILY\

# Install dev dependencies (Jest for tests)
npm install

# Run a local dev server (http-server is bundled via npx)
npm start # http://localhost:8080
`

## Testing
We use **Jest** with the **jsdom** environment to unit-test the routing helpers.
`ash
npm test
`
The test suite lives in ests/app.test.js.

## Project Structure
`
JOSEPH AI Family/
+- index.html # HTML entry point
+- app.js # SPA router & UI helpers
+- tests/
¦ +- app.test.js # Jest tests
+- package.json # npm scripts & dev deps
+- README.md # you are here!
`

## Contributing
1. Fork the repository.
2. Create a feature branch.
3. Ensure 
pm test passes.
4. Submit a pull request.

## License
MIT – feel free to adapt and improve.
