# Campus Circulate Hub – Implementation Plan

Campus Circulate Hub is a sustainability-focused circular campus marketplace for students to buy, sell, exchange, rent, donate, and share resources. This document details the technical implementation plan for a production-ready, full-stack React and Spring Boot web application.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions & Requirements:**
> 1. **Local Database Fallback:** Since PostgreSQL is not running locally on port 5432 and Docker is unavailable on your machine, we will configure the Spring Boot backend with two profiles:
>    - `dev` (Default): Uses an in-memory **H2 Database** with auto-ddl generation so it runs immediately out-of-the-box for demoing and local testing.
>    - `prod`: Configured for **PostgreSQL** using standard environment variables (e.g. `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, etc.) for Zoho Catalyst AppSail deployment.
> 2. **AI Integration (Gemini API):** We will implement direct REST clients calling Google Gemini APIs. We will look for a `GEMINI_API_KEY` env variable. If none is present, we will fallback to a smart sandbox simulation so the application features (like description generator and chatbot) don't crash.
> 3. **Real-time Messaging:** We will use Spring Boot's standard WebSocket handler with STOMP message brokerage and React's SockJS client for real-time buyer-seller chat.

---

## Open Questions

> [!WARNING]
> **Open Technical Considerations:**
> 1. **Image Storage / Uploads:** The user request specifies Cloudinary for image storage. Do you have active Cloudinary API credentials (cloud name, API key, API secret) that you would like to supply now? If not, we will configure a file-upload service that falls back to saving files locally in the workspace (or inside the target build) or using dummy URL image generators so that the app is fully functional out of the box.
> 2. **College Email Validation:** Standard registration will validate emails ending with college domains (e.g. `.edu`, `.ac.in`). Do you want specific domains restricted, or a general pattern check?

---

## Proposed Changes

We will divide the workspace into two distinct projects:
- `backend/`: Spring Boot Java application
- `frontend/`: React Vite TypeScript application

---

### Backend Component (`backend/`)

We will scaffold a Maven project in `backend/` supporting Java 21, Spring Security with JWT, JPA, WebSockets, and Gemini API services.

#### [NEW] [pom.xml](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/pom.xml)
This file will specify dependencies:
- `spring-boot-starter-web` & `spring-boot-starter-websocket`
- `spring-boot-starter-data-jpa` & `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `postgresql` (for prod) & `h2` (for dev)
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (for JWT authentication)
- `lombok` for boilerplates
- `spring-boot-starter-webflux` for Gemini client communications

#### [NEW] [application.properties](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/src/main/resources/application.properties)
Configures base properties and profile configuration (activation of `dev` or `prod`).

#### [NEW] [application-dev.properties](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/src/main/resources/application-dev.properties)
Configures H2 in-memory database, logging levels, and dev WebSocket configs.

#### [NEW] [application-prod.properties](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/src/main/resources/application-prod.properties)
Configures PostgreSQL connection strings and production settings for Zoho Catalyst AppSail (including binding server port dynamically using `${X_ZOHO_CATALYST_LISTEN_PORT:8080}`).

#### [NEW] [app-config.json](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/app-config.json)
Zoho Catalyst AppSail configuration specifying platform (`javase`), java stack (`java21`), memory (512MB), and startup command:
```json
{
  "command": "java -jar target/marketplace-0.0.1-SNAPSHOT.jar",
  "platform": "javase",
  "stack": "java21",
  "memory": 512
}
```

#### [NEW] [Java Source Code Structure](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/backend/src/main/java/com/campus/marketplace)
- **Security:** JWT filtering and Role-Based Access Control (`STUDENT`, `ADMIN`).
- **JPA Entities:**
  - `User`, `Category`, `Product`, `Transaction`, `Message`, `Review`, `Donation`, `Badge`, `Report`, `Notification`, `AdminLog`.
- **Services:**
  - `GeminiService`: Direct API call to Gemini using JSON schemas. Implements:
    - AI Product Description Generator (Image + Prompt analysis)
    - AI Fraud Detection (Checks spam, fake products, extreme prices)
    - EcoGuide AI Chatbot (Q&A, search items, sustainability tips)
    - AI Sustainability Advisor & Circular Economy Intelligence Engine
  - `WebSocketService`: Messaging broadcast routing.
  - `DonationService`: Donation tracking and Carbon offset calculation (Formula: e.g. Books = 2.5kg CO₂, Electronics = 15kg CO₂, Furniture = 40kg CO₂).
  - `GamificationService`: Adding EcoPoints (+10 Sell, +20 Donate, +15 Exchange, +8 Rent) and checking for Badge achievements.
- **Controllers:** REST endpoints for `auth`, `users`, `products`, `transactions`, `messages`, `donations`, `analytics`, `recommendations`, `admin`.

---

### Frontend Component (`frontend/`)

We will scaffold a Vite React TS Tailwind CSS application inside `frontend/`.

#### [NEW] [package.json](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/frontend/package.json)
Specifies dependencies: `react`, `react-dom`, `react-router-dom`, `axios`, `framer-motion`, `lucide-react`, `leaflet`, `react-leaflet`, `sockjs-client`, `stompjs`.

#### [NEW] [tailwind.config.js](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/frontend/tailwind.config.js)
Configures custom theme settings mapping the sustainability color palette:
- Primary: `#2E7D32`
- Secondary: `#4CAF50`
- Mint: `#E8F5E9`
- Accent: `#81D4FA`
- Custom glassmorphism utilities.

#### [NEW] [index.css](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/frontend/src/index.css)
Defines standard styles, custom imports (Inter/Poppins Google fonts), animations, and tailwind base layer.

#### [NEW] [App.tsx & router](file:///c:/Users/sandh/OneDrive/Documents/exspenso/Desktop/campus%20marketplace/frontend/src/App.tsx)
Routing setup for various pages:
- **Guest Access:** Landing Page, Login, Register (with College Verification).
- **Core App (Student):** Marketplace, Listing Creator (with AI Description Generator), Item Details, EcoGuide AI Assistant, Messaging (WebSocket-powered), Donation Hub, Campus Map (Leaflet), User Profile (Sustainability Score, Badges, Savings counter).
- **Admin App:** Verification Panel, Fraud Detection Queue, Analytics & Circular intelligence dashboard.

---

## Verification Plan

### Automated Tests
- Run `mvn clean test` on backend components to verify JPA mappings, token authentication filters, and Gemini client fallbacks.
- Run `npm run build` on frontend to verify TypeScript types and production builds.

### Manual Verification
- **User flows:**
  1. Register a student with college email -> login -> view landing page.
  2. Create a product listing: upload dummy image -> use AI generator to create description -> list product.
  3. Search & filter in marketplace by category/price/type.
  4. Open product detail page -> see map location of seller -> click "Chat" -> send real-time message via web sockets.
  5. Mark item as "Donated" -> verify points increment (+20) -> verify badge unlock.
  6. Login as Admin -> review listing -> check AI fraud flags -> export sustainability reports.
