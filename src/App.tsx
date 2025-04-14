import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import { CreatePostPage } from "./pages/CreatePostPage";
import { Layout } from "./pages/Layout";
import { PostPage } from "./pages/PostPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { Profile } from "./pages/Profile";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  const { user, loading } = useAuth();

  // Loading screen
  if (loading && user) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-black text-gray-100 flex justify-center items-center">
        <p><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="white" />
        </svg></p>
      </div>
      </div>
    );
  }


  return (
    <div className="">
      {/* <Navbar /> */}
      <div className="">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={user ? <Layout /> : <Navigate to="/login" replace />} >
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/bookmark" element={<BookmarksPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:username" element={<Profile />} />
          </Route>

        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
