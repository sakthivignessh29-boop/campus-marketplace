# 🎓 Campus Marketplace

An all-in-one peer-to-peer campus trading, donation, and real-time community engagement platform. This project connects students within a campus to buy/sell products, donate items, make secure payments, locate listings on interactive maps, and chat in real-time.

---

## 🚀 Key Features

*   **🔒 Secure Authentication:** JWT-based user login and registration system using Spring Security.
*   **🛒 Peer-to-Peer Marketplace:** List items for sale, browse listings, filter by categories, and track product statuses.
*   **🎁 Donation & Beneficiary Matching:** 
    *   List products for donation.
    *   Request donations as a beneficiary.
    *   System matches donors with beneficiaries and tracks delivery status.
*   **💬 Real-Time Chat:** Immediate direct messaging between users using WebSockets (SockJS + STOMP protocols).
*   **🗺️ Interactive Map Integration:** Leaflet map integrations to show product/donation locations and coordinate meetups.
*   **🤖 AI-Powered Smart Features:** Integrated Google Gemini API (`gemini-pro`) for intelligent recommendations and text analysis.
*   **🏆 Gamification System:** Earn community badges (e.g., top donor, active buyer) to encourage positive engagement.
*   **💳 Secure Payments:** Razorpay integration for smooth transaction processing.
*   **🛡️ Moderation & Reporting:** Admin control dashboard with action logging, reporting systems, and listing reviews.

---

## 🛠️ Technology Stack

### Backend
*   **Language:** Java 17+
*   **Framework:** Spring Boot 3.x (Web, Security, WebSocket)
*   **Database:** H2 Database (File-based persistent storage)
*   **ORM/JPA:** Spring Data JPA / Hibernate
*   **Security:** JSON Web Tokens (JWT) & Spring Security
*   **APIs & Gateways:** Razorpay (Payments), Google Gemini API (AI Features)
*   **Build Tool:** Maven

### Frontend
*   **Framework:** React 19 (Vite, TypeScript)
*   **Styling:** Tailwind CSS v4, Lucide Icons
*   **Animations:** Framer Motion
*   **Maps:** Leaflet & React Leaflet
*   **WebSockets:** `@stomp/stompjs` & `sockjs-client`
*   **HTTP Client:** Axios
*   **Routing:** React Router Dom

---

## 📁 Project Structure

```text
campus-marketplace/
├── backend/
│   ├── src/main/java/com/campus/marketplace/
│   │   ├── config/          # Spring Security, Web, and WebSocket configs
│   │   ├── controller/      # REST API Controllers (Auth, Product, Chat, Admin, etc.)
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── model/           # JPA Entities (User, Product, Donation, Message, etc.)
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   └── service/         # Business logic (Gemini, Razorpay, Chat, etc.)
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── application-dev.properties
│   └── pom.xml              # Maven dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components (Navbar, UI components)
│   │   ├── context/         # Socket and Auth contexts
│   │   ├── pages/           # Page views (Marketplace, Chat, Donations, Profile)
│   │   └── App.tsx          # Router and entry component
│   ├── package.json         # Frontend dependencies and scripts
│   ├── tailwind.config.js   # Tailwind setup
│   └── vite.config.ts       # Vite bundler setup
