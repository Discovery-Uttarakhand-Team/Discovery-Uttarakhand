# Project Architecture & Workflow Guide (For Frontend & Backend Teams)

Yeh document Frontend aur Backend team members ke liye ek detailed guide hai. Isme humne project ka **Folder Structure**, **Data Flow (A to Z)**, aur **Frontend-Backend Connection** ko simple Hinglish aur English technical terms mein samjhaya hai.

---

## 1. FRONTEND ARCHITECTURE (React + Vite)

Frontend is responsible for UI, routing, and fetching data to display. Hamara frontend React, Vite, Tailwind CSS aur Zustand (for state management) par based hai.

### Folder Structure (Frontend)
Frontend ka saara main code `Frontend/src` folder ke andar hai:
- **`/api`**: Yahan saari API call methods likhi hain (e.g., `destinationApi.js`, `tripApi.js`, `authApi.js`). Frontend seedhe URL hit karne ke bajaye in files ke functions ko call karta hai.
- **`/components`**: Reusable UI parts jaise Navbar, Footer, Cards, aur Modals. Iske andar sub-folders hain jaise `booking`, `planner`, `sidebar` etc.
- **`/context`**: React Context files, jaise `AuthContext.jsx` jo user ki login state ko poore app mein maintain karta hai.
- **`/pages`**: Hamare main screens/routes jaise `Home.jsx`, `TripPlanner.jsx`, `Map.jsx`, `DetailPage.jsx`.
- **`/store`**: Zustand store (e.g., `mapStore.js`). Yeh hamara global state manager hai jo trips aur map data ko store karta hai taaki alag-alag components usko access kar sakein.
- **`/utils`**: Helper functions, jaise route calculation ya date formatting (`routeHelpers.js`, `geoHelpers.js`).

### Frontend ka Data Flow:
1. **User Action:** User kisi button pe click karta hai ya page (e.g., `TripPlanner.jsx`) load hota hai.
2. **API Call:** Component `/api/destinationApi.js` ke function ko call karta hai.
3. **Axios Request:** Wo function `Axios` ka use karke Backend ke route (e.g., `GET http://localhost:5000/api/destinations`) par HTTP request bhejta hai.
4. **State Update:** Jab Backend se JSON data return hota hai, toh usko `useState` ya Zustand `mapStore` mein save kiya jata hai.
5. **Render:** React us data ko map karke UI par Cards ya Map Pins banata hai.

---

## 2. BACKEND ARCHITECTURE (Node.js + Express + MongoDB)

Backend is the brain of the app. Yeh requests ko handle karta hai, business logic chalata hai, aur MongoDB database se data read/write karta hai.

### Folder Structure (Backend)
Backend ka main entry point `server.js` ya `index.js` hota hai. Iska structure MVC (Model-View-Controller) jaisa hai:
- **`/config`**: Database (MongoDB) ya third-party services (Cloudinary, Razorpay) connect karne ki configuration files.
- **`/models`**: Mongoose schemas (e.g., `Destination.js`, `Trip.js`, `User.js`). Yeh define karte hain ki data kaisa dikhega aur database me kaise save hoga.
- **`/routes`**: Express Router files (e.g., `destinationRoutes.js`, `tripRoutes.js`). Yeh incoming URL ko check karte hain aur sahi controller function ke paas bhejte hain.
- **`/controllers`**: Yahan actual business logic likhi hoti hai. Routes in functions ko call karte hain. Controller Model ka use karke database se data nikalta hai aur JSON format me wapas Frontend ko bhejta hai.
- **`/middleware`**: In-between functions. Jaise `authMiddleware.js` check karta hai ki user logged in hai ya nahi (JWT Token verify karta hai) request aage badhane se pehle.
- **`/services`**: External APIs (like OSRM for routing ya AI logic) se baat karne ke liye helper logic.

### Backend ka Data Flow:
1. **Request Aayi:** Frontend se request aati hai `GET /api/destinations`.
2. **Router Match:** `/routes/destinationRoutes.js` dekhta hai ki ye route kahan point kar raha hai aur usko `getDestinations` controller ke paas bhej deta hai.
3. **Controller Execution:** `getDestinations` function run hota hai. Yeh `Destination` model ka use karke likhta hai `Destination.find()`.
4. **Database Query:** Mongoose MongoDB se saara data fetch karta hai.
5. **Response:** Controller us raw database data ko JSON format mein pack karta hai aur `res.status(200).json({ success: true, data: [...] })` karke Frontend ko wapas bhej deta hai.

---

## 3. HOW THEY CONNECT (End-to-End A to Z Flow)

Chalo ek real example se samjhte hain ki poora system ek saath kaise kaam karta hai: **"Loading the Trip Planner Map"**

**Starting at Frontend:**
1. **Page Load:** User `http://localhost:5173/trip-planner` kholta hai. React ka `TripPlanner.jsx` page render hona shuru hota hai.
2. **UseEffect Trigger:** Page ke andar `useEffect` hook trigger hota hai jo bolta hai: "Mujhe saari destinations chahiye".
3. **API Function Call:** Wo `getDestinations()` (jo `/api/destinationApi.js` me hai) ko call karta hai.
4. **Network Request:** Axios backend ko call karta hai: `GET http://localhost:5000/api/destinations`.

**Moving to Backend:**
5. **Route Catch:** Backend ka Express server `/api/destinations` route match karta hai `destinationRoutes.js` file mein.
6. **Controller Action:** Route is request ko `getAllDestinations` controller ke paas pass kar deta hai.
7. **Database Fetch:** Controller Mongoose model (`Destination.find()`) call karta hai. MongoDB turant saari JSON documents return karta hai (jo Deepanshu ne database me seed kiye thay).
8. **JSON Response:** Backend us data ko `{ success: true, data: [...] }` me wrap karke Axios ko wapas bhej deta hai.

**Back to Frontend:**
9. **Data Receive:** Axios data receive karta hai aur promise resolve ho jata hai.
10. **State Save:** `TripPlanner.jsx` (ya Zustand Store) us data ko state variables (jaise `allDestinations`) me save kar leta hai.
11. **UI Update:** React automatically re-render hota hai. Ab jo data state me hai, uske basis par screen par destination selection cards aur Map par markers ban jate hain.

---

## 4. Main Concepts for Team Members to Remember

- **CORS (Cross-Origin Resource Sharing):** Frontend (port 5173) alag server pe chalta hai aur Backend (port 5000) alag pe. Backend me CORS enabled hai taaki frontend requests block na ho.
- **JWT Authentication:** Jab user login karta hai, backend ek 'Token' deta hai. Frontend is token ko localStorage me save karta hai aur har secure API call ke headers (e.g., Booking create karna) me bhejta hai.
- **Payload Wrapping:** Dhyan rahe, backend hamesha data ko `{ success: true, data: payload }` ke object mein bhejta hai. Frontend ko data extract karte waqt `response.data.data` parse karna hota hai.

Ye flow clear hone ke baad, agar tum frontend developer ho toh tumhe API banana nahi hai, sirf call karna hai. Aur agar tum backend developer ho, toh tumhe UI design nahi karna, sirf JSON data theek format me dena hai!
