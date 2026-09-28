# 🚀 ConnectHub – Social Media Platform

ConnectHub is a full-stack social media platform developed as part of the **CodeAlpha Full Stack Development Internship – Task 2**.

It allows users to register and log in, create posts, like and comment on posts, follow other users, and manage their profiles.

---

## ✨ Features

### 🔐 Authentication

- User Registration
- User Login
- JWT-based authentication
- Password hashing using bcrypt
- Logout functionality
- Persistent login session

### 📝 Posts

- Create new posts
- Edit your own posts
- Delete your own posts
- View posts from users
- Post ownership protection

### ❤️ Social Interactions

- Like / Unlike posts
- Add comments
- Delete your own comments
- Follow / Unfollow users
- Followers and Following counts

### 👥 People

- View available users
- Follow / Unfollow users
- People You May Know section
- Following status

### 👤 Profile

- User profile
- Username
- Bio
- Followers count
- Following count
- Posts count

### 🎨 User Interface

- Modern social-media style UI
- Responsive design
- Desktop and mobile friendly
- Interactive buttons
- Hover effects
- Clean card-based layout

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Axios

### Backend

- Node.js
- Express.js
- REST API
- JWT
- bcrypt.js

### Database

- MongoDB
- Mongoose
- MongoDB Atlas

### Tools

- Visual Studio Code
- Git
- GitHub
- Postman

---

## 📁 Project Structure

```text
SocialMediaPlatform/
│
├── backend/
│   ├── models/
│   │   ├── Comment.js
│   │   ├── Post.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── postRoutes.js
│   │
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```
